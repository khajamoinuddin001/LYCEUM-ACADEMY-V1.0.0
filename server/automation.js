import { query } from './database.js';
import { createTransporter } from './email.js';
import fetch from 'node-fetch';

/**
 * Check if a string looks like a valid email address
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    // Basic regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Replace template variables with payload data.
 * e.g. {{client_name}} -> payload.client_name
 */
function compileTemplate(text, payload) {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        // Basic nested access support like "client.name" or just flat depending on how payload is structured.
        const keys = key.trim().split('.');
        let value = payload;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return match; // Keep original if not found
            }
        }
        return value !== undefined && value !== null ? String(value) : '';
    });
}

/**
 * Evaluate if conditions match the payload
 */
function evaluateConditions(conditions, payload) {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
        const { field, operator, value } = condition;

        // Resolve payload value (support dot notation)
        const keys = field.split('.');
        let payloadValue = payload;
        for (const k of keys) {
            if (payloadValue && typeof payloadValue === 'object') {
                payloadValue = payloadValue[k];
            } else {
                payloadValue = undefined;
                break;
            }
        }

        const ruleValue = value;

        let isMatch = false;
        switch (operator) {
            case '==':
            case 'equals':
                isMatch = (String(payloadValue) === String(ruleValue));
                break;
            case '!=':
            case 'not_equals':
                isMatch = (String(payloadValue) !== String(ruleValue));
                break;
            case '>':
                isMatch = (Number(payloadValue) > Number(ruleValue));
                break;
            case '>=':
                isMatch = (Number(payloadValue) >= Number(ruleValue));
                break;
            case '<':
                isMatch = (Number(payloadValue) < Number(ruleValue));
                break;
            case '<=':
                isMatch = (Number(payloadValue) <= Number(ruleValue));
                break;
            case 'contains':
                isMatch = (String(payloadValue).toLowerCase().includes(String(ruleValue).toLowerCase()));
                break;
            default:
                isMatch = false;
        }

        if (!isMatch) return false;
    }

    return true;
}

/**
 * Send WhatsApp Message via Gateway
 * (Placeholder for actual API integration like Twilio, Gupshup, etc.)
 */
async function sendWhatsApp(phone, message) {
    console.log(`📱 [WhatsApp] Sending to ${phone}: ${message}`);

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiUrl || !apiKey) {
        throw new Error('WhatsApp API credentials not configured. Please add WHATSAPP_API_URL and WHATSAPP_API_KEY to your .env file.');
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                to: phone,
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`Gateway returned ${response.status}: ${await response.text()}`);
        }

        return { success: true };
    } catch (err) {
        console.error('❌ [WhatsApp] Send failed:', err.message);
        throw err;
    }
}

/**
 * Log an automation action
 */
async function logAutomationAction({ rule_id, trigger_event, action_type, recipient, subject, status, error_message }) {
    try {
        await query(
            `INSERT INTO automation_logs (rule_id, trigger_event, action_type, recipient, subject, status, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [rule_id, trigger_event, action_type, recipient, subject, status, error_message]
        );
    } catch (err) {
        console.error('❌ [Automation] Failed to log action:', err);
    }
}

/**
 * Fetch and process rules for a given trigger
 * @param {string} triggerEvent E.g. 'Lead Created', 'Payment Received'
 * @param {object} payload The data dictionary context
 */
export async function evaluateAutomation(triggerEvent, payload) {
    try {
        console.log(`🤖 [Automation] Evaluating trigger: ${triggerEvent}`);

        // ENRICH PAYLOAD WITH CONTACT DETAILS IF contact_id OR student_id IS PRESENT
        const contactId = payload.contact_id || payload.contactId || payload.student_id;
        if (contactId) {
            try {
                const contactRes = await query(
                    "SELECT name as contact_name, email as contact_email, phone as contact_phone FROM contacts WHERE id = $1",
                    [contactId]
                );
                if (contactRes.rows.length > 0) {
                    const contact = contactRes.rows[0];
                    payload.contact_name = payload.contact_name || contact.contact_name;
                    payload.contact_email = payload.contact_email || contact.contact_email;
                    payload.contact_phone = payload.contact_phone || contact.contact_phone;
                    
                    // Derived first_name
                    if (!payload.first_name && contact.contact_name) {
                        payload.first_name = contact.contact_name.split(' ')[0];
                    }
                }
            } catch (dbErr) {
                console.error('🤖 [Automation] Failed to enrich payload with contact details:', dbErr);
            }
        }

        // Generic date support
        if (!payload.date) {
            payload.date = new Date().toISOString().split('T')[0];
        }

        // Select all rules for the trigger that are active
        const rulesResult = await query(
            `SELECT r.*, e.name as template_name, e.subject, e.body, e.from_address 
       FROM automation_rules r
       LEFT JOIN email_templates e ON r.email_template_id = e.id
       WHERE r.trigger_event = $1 AND r.is_active = true`,
            [triggerEvent]
        );

        if (rulesResult.rows.length === 0) {
            console.log(`🤖 [Automation] No active rules found for ${triggerEvent}`);
            return;
        }

        // Evaluate each rule
        for (const rule of rulesResult.rows) {
            try {
                const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;

                if (evaluateConditions(conditions, payload)) {
                    console.log(`🤖 [Automation] Rule matched: ${rule.name} (ID: ${rule.id})`);

                    // Action 1: Send Email
                    if (rule.action_send_email && rule.body) {
                        const recipientTypes = (rule.email_recipient || 'student').split(',');
                        const recipientEmails = new Set();

                        console.log(`🤖 [Automation] Rule matched: ${rule.name}. Resolving recipients of type: ${recipientTypes}`);

                        for (const type of recipientTypes) {
                            let email = null;
                            let sourceField = '';

                            if (type === 'student' || type === 'client') {
                                // Priority 1: Direct from payload
                                if (isValidEmail(payload.client_email)) { email = payload.client_email; sourceField = 'client_email'; }
                                else if (isValidEmail(payload.student_email)) { email = payload.student_email; sourceField = 'student_email'; }
                                else if (isValidEmail(payload.email)) { email = payload.email; sourceField = 'email'; }
                                else if (isValidEmail(payload.contact_email)) { email = payload.contact_email; sourceField = 'contact_email'; }

                                console.log(`🤖 [Automation] Student email resolved: ${email} from ${sourceField}`);

                                // Priority 2: Fallback to database lookup if contact_id exists
                                const contactId = payload.contact_id || payload.contactId || payload.student_id;
                                if (!email && contactId) {
                                    try {
                                        const contactRes = await query("SELECT email FROM contacts WHERE id = $1", [contactId]);
                                        if (contactRes.rows.length > 0 && isValidEmail(contactRes.rows[0].email)) {
                                            email = contactRes.rows[0].email;
                                            sourceField = 'database:contacts.email';
                                            console.log(`🤖 [Automation] Student email found in DB: ${email}`);
                                        }
                                    } catch (dbErr) {
                                        console.error('🤖 [Automation] Failed to fetch contact email from database:', dbErr);
                                    }
                                }
                            } else if (type === 'staff') {
                                if (isValidEmail(payload.staff_email)) { email = payload.staff_email; sourceField = 'staff_email'; }
                                else if (isValidEmail(payload.assigned_to_email)) { email = payload.assigned_to_email; sourceField = 'assigned_to_email'; }
                            } else if (type === 'admin') {
                                try {
                                    const admins = await query("SELECT email FROM users WHERE role = 'Admin'");
                                    admins.rows.forEach(row => {
                                        if (isValidEmail(row.email)) {
                                            recipientEmails.add(row.email);
                                        }
                                    });
                                    console.log(`🤖 [Automation] Admin emails resolved: ${admins.rows.length} found`);
                                } catch (adminErr) {
                                    console.error('🤖 [Automation] Failed to fetch admin emails:', adminErr);
                                }
                                continue;
                            }

                            if (email) {
                                if (isValidEmail(email)) {
                                    recipientEmails.add(email.trim());
                                } else {
                                    console.warn(`🤖 [Automation] Rejected invalid email candidate for rule ${rule.id} from field "${sourceField}": "${email}"`);
                                }
                            }
                        }

                        console.log(`🤖 [Automation] Total recipients for rule ${rule.id}: ${recipientEmails.size} (${Array.from(recipientEmails)})`);

                        const compiledSubject = compileTemplate(rule.subject, payload);
                        const compiledBody = compileTemplate(rule.body, payload);

                        if (recipientEmails.size > 0) {
                            for (const recipientEmail of recipientEmails) {
                                try {
                                    const { transporter, from } = createTransporter();
                                    const mailOptions = {
                                        from: rule.from_address || from,
                                        to: recipientEmail,
                                        subject: compiledSubject,
                                        html: compiledBody
                                    };

                                    await transporter.sendMail(mailOptions);
                                    console.log(`🤖 [Automation] Action Executed: Email sent to ${recipientEmail}`);

                                    // Log Success
                                    await logAutomationAction({
                                        rule_id: rule.id,
                                        trigger_event: triggerEvent,
                                        action_type: 'email',
                                        recipient: recipientEmail,
                                        subject: compiledSubject,
                                        status: 'success'
                                    });
                                } catch (emailErr) {
                                    console.error(`🤖 [Automation] Email failed for rule ${rule.id} to ${recipientEmail}:`, emailErr);
                                    // Log Failure
                                    await logAutomationAction({
                                        rule_id: rule.id,
                                        trigger_event: triggerEvent,
                                        action_type: 'email',
                                        recipient: recipientEmail,
                                        subject: compiledSubject,
                                        status: 'failed',
                                        error_message: emailErr.message
                                    });
                                }
                            }
                        } else {
                            console.log(`🤖 [Automation] Tried to send email but could not resolve recipient for rule ${rule.id}`);
                            await logAutomationAction({
                                rule_id: rule.id,
                                trigger_event: triggerEvent,
                                action_type: 'email',
                                recipient: 'Could not resolve',
                                subject: compiledSubject,
                                status: 'failed',
                                error_message: 'Recipient email could not be resolved from payload.'
                            });
                        }
                    }

                    // Action 2: Create Task
                    if (rule.action_create_task) {
                        try {
                            const taskTemplate = typeof rule.task_template === 'string' ? JSON.parse(rule.task_template) : rule.task_template;

                            const title = compileTemplate(taskTemplate.title || 'Automated Task', payload);
                            const description = compileTemplate(taskTemplate.description || '', payload);
                            const assigneeRole = taskTemplate.assigned_to_role || 'Staff';
                            const dueDays = parseInt(taskTemplate.due_days) || 0;
                            const priority = taskTemplate.priority || 'Medium';

                            const dueDate = new Date();
                            dueDate.setDate(dueDate.getDate() + dueDays);
                            const dueDateString = dueDate.toISOString().split('T')[0];

                            let assigneeId = null;
                            if (payload.assigned_to_id) {
                                assigneeId = payload.assigned_to_id;
                            } else {
                                const users = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', [assigneeRole]);
                                if (users.rows.length > 0) {
                                    assigneeId = users.rows[0].id;
                                }
                            }

                            let contactId = payload.contact_id || null;

                            const tzTask = await query("SELECT nextval('application_ack_seq') as seq");
                            const seq1 = tzTask.rows[0].seq;
                            const taskId = `TSK-${String(seq1).padStart(7, '0')}`;

                            await query(`
                                INSERT INTO tasks (title, description, due_date, status, assigned_to, priority, contact_id, task_id)
                                VALUES ($1, $2, $3, 'todo', $4, $5, $6, $7)
                            `, [title, description, dueDateString, assigneeId, priority, contactId, taskId]);

                            console.log(`🤖 [Automation] Action Executed: Task created "${title}"`);

                            await logAutomationAction({
                                rule_id: rule.id,
                                trigger_event: triggerEvent,
                                action_type: 'task',
                                recipient: `UserID: ${assigneeId}`,
                                subject: title,
                                status: 'success'
                            });
                        } catch (taskErr) {
                            console.error(`🤖 [Automation] Task creation failed for rule ${rule.id}:`, taskErr);
                            await logAutomationAction({
                                rule_id: rule.id,
                                trigger_event: triggerEvent,
                                action_type: 'task',
                                status: 'failed',
                                error_message: taskErr.message
                            });
                        }
                    }

                    // Action 3: Send WhatsApp
                    if (rule.action_send_whatsapp && rule.whatsapp_template) {
                        let recipientPhone = null;
                        if (payload.phone) {
                            recipientPhone = payload.phone;
                        } else if (payload.contact_phone) {
                            recipientPhone = payload.contact_phone;
                        } else if (payload.visitor_phone) {
                            recipientPhone = payload.visitor_phone;
                        }

                        if (recipientPhone) {
                            const compiledMessage = compileTemplate(rule.whatsapp_template, payload);
                            try {
                                await sendWhatsApp(recipientPhone, compiledMessage);
                                console.log(`🤖 [Automation] Action Executed: WhatsApp sent to ${recipientPhone}`);

                                await logAutomationAction({
                                    rule_id: rule.id,
                                    trigger_event: triggerEvent,
                                    action_type: 'whatsapp',
                                    recipient: recipientPhone,
                                    subject: compiledMessage.substring(0, 50) + '...',
                                    status: 'success'
                                });
                            } catch (waErr) {
                                console.error(`🤖 [Automation] WhatsApp failed for rule ${rule.id}:`, waErr);
                                await logAutomationAction({
                                    rule_id: rule.id,
                                    trigger_event: triggerEvent,
                                    action_type: 'whatsapp',
                                    recipient: recipientPhone,
                                    subject: compiledMessage.substring(0, 50) + '...',
                                    status: 'failed',
                                    error_message: waErr.message
                                });
                            }
                        } else {
                            console.log(`🤖 [Automation] Tried to send WhatsApp but could not resolve phone for rule ${rule.id}`);
                            await logAutomationAction({
                                rule_id: rule.id,
                                trigger_event: triggerEvent,
                                action_type: 'whatsapp',
                                recipient: 'Unknown',
                                status: 'failed',
                                error_message: 'Recipient phone number could not be resolved from payload.'
                            });
                        }
                    }

                    // Action 4: Update Field
                    if (rule.action_update_field && rule.update_field_config) {
                        try {
                            const config = typeof rule.update_field_config === 'string' ? JSON.parse(rule.update_field_config) : rule.update_field_config;
                            const { target_app, lookup_by, lookup_value, field, value } = config;

                            if (!target_app || !lookup_by || !lookup_value || !field) {
                                throw new Error('Incomplete update field configuration.');
                            }

                            const compiledLookupValue = compileTemplate(lookup_value, payload);
                            const compiledNewValue = compileTemplate(value, payload);

                            console.log(`🤖 [Automation] Executing Update Field: ${target_app}.${field} = ${compiledNewValue} (Lookup: ${lookup_by}=${compiledLookupValue})`);

                            let success = false;
                            let errorMsg = '';

                            if (target_app === 'Contacts') {
                                const lookupSql = `SELECT id FROM contacts WHERE LOWER(${lookup_by === 'name' ? 'name' : lookup_by}) = LOWER($1) LIMIT 1`;
                                const contactRes = await query(lookupSql, [compiledLookupValue]);

                                if (contactRes.rows.length > 0) {
                                    const contactId = contactRes.rows[0].id;
                                    if (field === 'metadata') {
                                        // SPECIAL HANDLING: If updating metadata, we MUST merge to avoid wiping AR/Quotations
                                        const currentResult = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);
                                        let currentMetadata = currentResult.rows[0].metadata || {};
                                        if (typeof currentMetadata === 'string') {
                                            try { currentMetadata = JSON.parse(currentMetadata); } catch (e) { currentMetadata = {}; }
                                        }

                                        let updateValue = compiledNewValue;
                                        if (typeof updateValue === 'string') {
                                            try { updateValue = JSON.parse(updateValue); } catch (e) { }
                                        }

                                        const mergedMetadata = { ...currentMetadata, ...(typeof updateValue === 'object' ? updateValue : { [field]: updateValue }) };
                                        await query(`UPDATE contacts SET metadata = $1 WHERE id = $2`, [JSON.stringify(mergedMetadata), contactId]);
                                    } else {
                                        await query(`UPDATE contacts SET ${field} = $1 WHERE id = $2`, [compiledNewValue, contactId]);
                                    }
                                    success = true;
                                } else {
                                    errorMsg = `No contact found with ${lookup_by}: ${compiledLookupValue}`;
                                }
                            } else if (target_app === 'Visa Operations') {
                                const lookupSql = `SELECT id FROM visa_operations WHERE LOWER(${lookup_by === 'name' ? 'name' : lookup_by}) = LOWER($1) LIMIT 1`;
                                const vopRes = await query(lookupSql, [compiledLookupValue]);

                                if (vopRes.rows.length > 0) {
                                    const vopId = vopRes.rows[0].id;
                                    await query(`UPDATE visa_operations SET ${field} = $1 WHERE id = $2`, [compiledNewValue, vopId]);
                                    success = true;
                                } else {
                                    errorMsg = `No visa operation found with ${lookup_by}: ${compiledLookupValue}`;
                                }
                            } else if (target_app === 'University Application') {
                                // University Applications are nested in contacts.visa_information
                                const lookupSql = `SELECT id, visa_information FROM contacts WHERE LOWER(${lookup_by === 'name' ? 'name' : lookup_by}) = LOWER($1) LIMIT 1`;
                                const contactRes = await query(lookupSql, [compiledLookupValue]);

                                if (contactRes.rows.length > 0) {
                                    const contact = contactRes.rows[0];
                                    const visaInfo = contact.visa_information || {};
                                    if (!visaInfo.universityApplication) visaInfo.universityApplication = { universities: [] };

                                    // Update the first university or add if empty (simplification for automation)
                                    if (visaInfo.universityApplication.universities.length === 0) {
                                        visaInfo.universityApplication.universities.push({});
                                    }

                                    // Map UI field names to JSON keys if necessary
                                    const jsonKey = field === 'university_name' ? 'universityName' :
                                        field === 'course_name' ? 'courseName' : field;

                                    visaInfo.universityApplication.universities[0][jsonKey] = compiledNewValue;

                                    await query('UPDATE contacts SET visa_information = $1 WHERE id = $2', [JSON.stringify(visaInfo), contact.id]);
                                    success = true;
                                } else {
                                    errorMsg = `No contact found for university application update with ${lookup_by}: ${compiledLookupValue}`;
                                }
                            }

                            if (success) {
                                await logAutomationAction({
                                    rule_id: rule.id,
                                    trigger_event: triggerEvent,
                                    action_type: 'update_field',
                                    recipient: `${target_app}: ${compiledLookupValue}`,
                                    subject: `${field} -> ${compiledNewValue}`,
                                    status: 'success'
                                });
                            } else {
                                console.error(`🤖 [Automation] Update Field failed: ${errorMsg}`);
                                await logAutomationAction({
                                    rule_id: rule.id,
                                    trigger_event: triggerEvent,
                                    action_type: 'update_field',
                                    recipient: `${target_app}: ${compiledLookupValue}`,
                                    subject: `${field} -> ${compiledNewValue}`,
                                    status: 'failed',
                                    error_message: errorMsg
                                });
                            }
                        } catch (updateErr) {
                            console.error(`🤖 [Automation] Update Field logic error for rule ${rule.id}:`, updateErr);
                            await logAutomationAction({
                                rule_id: rule.id,
                                trigger_event: triggerEvent,
                                action_type: 'update_field',
                                status: 'failed',
                                error_message: updateErr.message
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`🤖 [Automation] Error executing rule ${rule.id}:`, err);
            }
        }
    } catch (err) {
        console.error(`🤖 [Automation] Error in evaluateAutomation:`, err);
    }
}
