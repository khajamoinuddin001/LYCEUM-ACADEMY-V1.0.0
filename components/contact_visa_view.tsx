
import React, { useState, useRef, useEffect } from 'react';
import type { Contact, VisaInformation, User } from '../types';
import { ArrowLeft, Edit, Upload, Paperclip } from './icons';

interface ContactVisaViewProps {
    contact: Contact;
    onNavigateBack: () => void;
    onSave: (contact: Contact) => void;
    user: User;
}

const EditableField: React.FC<{
    label: string;
    isEditing: boolean;
    value?: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, isEditing, value, name, onChange }) => {
    if (isEditing) {
        return (
            <div>
                <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700/50 sm:text-sm text-gray-900 dark:text-gray-100 focus:ring-lyceum-blue focus:border-lyceum-blue"
                />
            </div>
        );
    }
    return (
        <div className="p-2 rounded-md border border-gray-200 dark:border-gray-700 min-h-[58px]">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate">
                {value || <span className="italic text-gray-400 dark:text-gray-500">Not set</span>}
            </p>
        </div>
    );
}

const EditableCheckbox: React.FC<{
    label: string;
    isEditing: boolean;
    checked?: boolean;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, isEditing, checked, name, onChange }) => {
    return (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                id={name}
                name={name}
                checked={checked || false}
                onChange={onChange}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-lyceum-blue focus:ring-lyceum-blue disabled:opacity-75 disabled:cursor-not-allowed"
            />
            <label htmlFor={name} className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</label>
        </div>
    );
}

const EditableDateField: React.FC<{
    label: string;
    isEditing: boolean;
    value?: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, isEditing, value, name, onChange }) => {
    if (isEditing) {
        return (
            <div>
                <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input
                    type="date"
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700/50 sm:text-sm text-gray-900 dark:text-gray-100 focus:ring-lyceum-blue focus:border-lyceum-blue"
                />
            </div>
        );
    }
    return (
        <div className="p-2 rounded-md border border-gray-200 dark:border-gray-700 min-h-[58px]">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate">
                {value ? new Date(value).toLocaleDateString() : <span className="italic text-gray-400 dark:text-gray-500">Not set</span>}
            </p>
        </div>
    );
}

const EditableTimeField: React.FC<{
    label: string;
    isEditing: boolean;
    value?: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, isEditing, value, name, onChange }) => {
    if (isEditing) {
        return (
            <div>
                <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input
                    type="time"
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700/50 sm:text-sm text-gray-900 dark:text-gray-100 focus:ring-lyceum-blue focus:border-lyceum-blue"
                />
            </div>
        );
    }
    return (
        <div className="p-2 rounded-md border border-gray-200 dark:border-gray-700 min-h-[58px]">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate">
                {value || <span className="italic text-gray-400 dark:text-gray-500">Not set</span>}
            </p>
        </div>
    );
}


const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">{title}</h3>
);

const VisaTab: React.FC<{ label: string; active?: boolean; onClick: () => void; }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors whitespace-nowrap ${active
            ? 'border-lyceum-blue text-lyceum-blue bg-lyceum-blue/5 dark:bg-lyceum-blue/10'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
    >
        {label}
    </button>
);

const EditableDropdownField: React.FC<{
    label: string;
    isEditing: boolean;
    value?: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    options: string[];
}> = ({ label, isEditing, value, name, onChange, options }) => {
    const [showCustomInput, setShowCustomInput] = React.useState(false);
    const [customValue, setCustomValue] = React.useState('');

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === '__custom__') {
            setShowCustomInput(true);
        } else {
            setShowCustomInput(false);
            onChange(e);
        }
    };

    const handleCustomSubmit = () => {
        if (customValue.trim()) {
            const syntheticEvent = {
                target: { name, value: customValue.trim() }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
            setCustomValue('');
            setShowCustomInput(false);
        }
    };

    if (isEditing) {
        return (
            <div>
                <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                {showCustomInput ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            placeholder="Enter custom location"
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700/50 sm:text-sm text-gray-900 dark:text-gray-100 focus:ring-lyceum-blue focus:border-lyceum-blue"
                        />
                        <button
                            type="button"
                            onClick={handleCustomSubmit}
                            className="px-3 py-2 bg-lyceum-blue text-white rounded-md text-sm hover:bg-lyceum-blue-dark"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCustomInput(false)}
                            className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <select
                        id={name}
                        name={name}
                        value={value || ''}
                        onChange={handleSelectChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700/50 sm:text-sm text-gray-900 dark:text-gray-100 focus:ring-lyceum-blue focus:border-lyceum-blue"
                    >
                        <option value="">Select {label}</option>
                        {options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                        <option value="__custom__">+ Add Custom Location</option>
                    </select>
                )}
            </div>
        );
    }
    return (
        <div className="p-2 rounded-md border border-gray-200 dark:border-gray-700 min-h-[58px]">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate">
                {value || <span className="italic text-gray-400 dark:text-gray-500">Not set</span>}
            </p>
        </div>
    );
}

const ContactVisaView: React.FC<ContactVisaViewProps> = ({ contact, onNavigateBack, onSave, user }) => {
    const [activeTab, setActiveTab] = useState('Visa Filing');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<VisaInformation | undefined>(contact.visaInformation);
    const paymentReceiptFileInputRef = useRef<HTMLInputElement>(null);
    const adminScreenshotFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(contact.visaInformation);
    }, [contact]);

    useEffect(() => {
        return () => {
            const paymentUrl = formData?.slotBooking?.paymentReceiptUrl;
            if (paymentUrl) URL.revokeObjectURL(paymentUrl);
            const adminUrl = formData?.adminControl?.agentRelated?.screenshotUrl;
            if (adminUrl) URL.revokeObjectURL(adminUrl);
        };
    }, [formData]);

    const handleDownload = (docName: string) => {
        const content = `This is a dummy file for ${docName}. In a real app, this would be the actual file content.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleEditToggle = () => setIsEditing(!isEditing);

    const handleCancel = () => {
        setFormData(contact.visaInformation);
        setIsEditing(false);
    };

    const handleSave = () => {
        const updatedContact: Contact = {
            ...contact,
            visaInformation: formData,
        };
        onSave(updatedContact);
        setIsEditing(false);
    };

    const initialVisaData: VisaInformation = {
        slotBooking: {},
        visaInterview: {},
        ds160: {},
        otherInformation: {},
        acknowledgement: {},
        sevisInformation: {},
        universityApplication: { universities: [{}, {}, {}, {}], academicInformation: {}, languageProficiency: {} },
        adminControl: { notices: {}, agentRelated: {}, warning: {}, others: {} },
        others: { workDetails: [], gapDuration: '', submittedForApproval: false },
    };

    const handleDeepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');

        setFormData(prev => {
            const newData = JSON.parse(JSON.stringify(prev || initialVisaData));
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key]) {
                    current[key] = isNaN(parseInt(keys[i + 1], 10)) ? {} : [];
                }
                current = current[key];
            }
            current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
            return newData;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'paymentReceipt' | 'adminScreenshot') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileUrl = URL.createObjectURL(file);

            setFormData(prev => {
                const newData = JSON.parse(JSON.stringify(prev || initialVisaData));
                if (fieldName === 'paymentReceipt') {
                    if (!newData.slotBooking) newData.slotBooking = {};
                    if (newData.slotBooking.paymentReceiptUrl) URL.revokeObjectURL(newData.slotBooking.paymentReceiptUrl);
                    newData.slotBooking.paymentReceipt = file.name;
                    newData.slotBooking.paymentReceiptUrl = fileUrl;
                } else if (fieldName === 'adminScreenshot') {
                    if (!newData.adminControl) newData.adminControl = {};
                    if (!newData.adminControl.agentRelated) newData.adminControl.agentRelated = {};
                    if (newData.adminControl.agentRelated.screenshotUrl) URL.revokeObjectURL(newData.adminControl.agentRelated.screenshotUrl);
                    newData.adminControl.agentRelated.screenshot = file.name;
                    newData.adminControl.agentRelated.screenshotUrl = fileUrl;
                }
                return newData;
            });
        }
    };

    const handleAddWorkDetail = () => {
        setFormData(prev => {
            const newData = JSON.parse(JSON.stringify(prev || initialVisaData));
            if (!newData.others) {
                newData.others = { workDetails: [] };
            }
            if (!newData.others.workDetails) {
                newData.others.workDetails = [];
            }
            newData.others.workDetails.push({ durationAndCompany: '' });
            return newData;
        });
    };

    const renderContent = () => {
        if (!formData && !isEditing) {
            return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No information available for this section. Click 'Edit' to add details.
                </div>
            );
        }

        const data = formData || initialVisaData;

        switch (activeTab) {
            case 'Visa Filing':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-6">
                            <div className="space-y-4">
                                <SectionTitle title="Slot Booking Information" />
                                {Object.entries({ username: "Username", password: "Password", securityQuestion1: "Security Question 1", answer1: "Answer (1)", securityQuestion2: "Security Question 2", answer2: "Answer (2)", securityQuestion3: "Security Question 3", answer3: "Answer (3)", oldDS160Number: "Old DS160 Number" }).map(([key, label]) =>
                                    <EditableField key={key} label={label} name={`slotBooking.${key}`} value={data.slotBooking?.[key]} isEditing={isEditing} onChange={handleDeepChange} />
                                )}
                                <div className={`${isEditing ? '' : 'p-2 rounded-md border border-gray-200 dark:border-gray-700 min-h-[58px]'}`}>
                                    <label className={`block text-xs font-medium ${isEditing ? 'text-gray-500 dark:text-gray-400 mb-1' : 'text-gray-500 dark:text-gray-400'}`}>Payment Receipt</label>
                                    {isEditing ? (
                                        <>
                                            <input type="file" ref={paymentReceiptFileInputRef} onChange={(e) => handleFileChange(e, 'paymentReceipt')} className="hidden" />
                                            <div className="flex items-center mt-1 space-x-2">
                                                <button type="button" onClick={() => paymentReceiptFileInputRef.current?.click()} className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-gray-500 rounded-md hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500">
                                                    <Upload size={12} className="mr-1.5" />
                                                    Upload your file
                                                </button>
                                                {data.slotBooking?.paymentReceipt && <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{data.slotBooking.paymentReceipt}</span>}
                                            </div>
                                        </>
                                    ) : data.slotBooking?.paymentReceipt ? (
                                        data.slotBooking.paymentReceiptUrl ? (
                                            <a href={data.slotBooking.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-lyceum-blue hover:underline mt-1 truncate w-full text-left">
                                                <Paperclip size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="truncate">{data.slotBooking.paymentReceipt}</span>
                                            </a>
                                        ) : (
                                            <button onClick={() => handleDownload(data.slotBooking!.paymentReceipt!)} className="flex items-center text-sm font-medium text-lyceum-blue hover:underline mt-1 truncate w-full text-left">
                                                <Paperclip size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="truncate">{data.slotBooking.paymentReceipt}</span>
                                            </button>
                                        )
                                    ) : (
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate"><span className="italic text-gray-400 dark:text-gray-500">Not set</span></p>
                                    )}
                                </div>
                                <EditableField label="Interview Fee Payment Date" name="slotBooking.interviewFeePaymentDate" value={data.slotBooking?.interviewFeePaymentDate} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                            <div className="space-y-4">
                                <SectionTitle title="Visa Interview Information" />
                                <EditableDropdownField
                                    label="VAC Preference"
                                    name="visaInterview.vacPreference"
                                    value={data.visaInterview?.vacPreference}
                                    isEditing={isEditing}
                                    onChange={handleDeepChange}
                                    options={['Mumbai', 'New Delhi', 'Chennai', 'Kolkata', 'Hyderabad']}
                                />
                                <EditableDropdownField
                                    label="VI Preference"
                                    name="visaInterview.viPreference"
                                    value={data.visaInterview?.viPreference}
                                    isEditing={isEditing}
                                    onChange={handleDeepChange}
                                    options={['Mumbai', 'New Delhi', 'Chennai', 'Kolkata', 'Hyderabad']}
                                />
                                <EditableDateField label="VAC Date" name="visaInterview.vacDate" value={data.visaInterview?.vacDate} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableTimeField label="VAC Time" name="visaInterview.vacTime" value={data.visaInterview?.vacTime} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableDateField label="VI Date" name="visaInterview.viDate" value={data.visaInterview?.viDate} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableTimeField label="VI Time" name="visaInterview.viTime" value={data.visaInterview?.viTime} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableDropdownField
                                    label="VI Consulate"
                                    name="visaInterview.consulate"
                                    value={data.visaInterview?.consulate}
                                    isEditing={isEditing}
                                    onChange={handleDeepChange}
                                    options={['Mumbai', 'New Delhi', 'Chennai', 'Kolkata', 'Hyderabad']}
                                />
                                <EditableDateField label="Slot Booked On" name="visaInterview.slotBookedOn" value={data.visaInterview?.slotBookedOn} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Slot Booked By" name="visaInterview.slotBookedBy" value={data.visaInterview?.slotBookedBy} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="space-y-4">
                                <SectionTitle title="DS-160" />
                                <EditableCheckbox label="Permitted to DS160" name="ds160.permittedToDS160" checked={data.ds160?.permittedToDS160} isEditing={isEditing} onChange={handleDeepChange} />
                                <div className="flex flex-col"><label className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">Omer Sir Signature</label><div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center"><span className="text-gray-400 dark:text-gray-500">SIGNATURE</span></div></div>
                                {Object.entries({ ds160StartDate: "DS160 Start Date", ds160ExpiryDate: "DS160 Expiry Date", ds160SubmissionDate: "DS160 Submission Date", ds160ConfirmationNumber: "DS160 Confirmation Number" }).map(([key, label]) =>
                                    <EditableField key={key} label={label} name={`ds160.${key}`} value={data.ds160?.[key]} isEditing={isEditing} onChange={handleDeepChange} />
                                )}
                            </div>
                            <div className="space-y-4">
                                <SectionTitle title="Other Information" />
                                {Object.entries({ finalisedUniversity: "Finalised University", passportNo: "Passport No.", ds160FilledBy: "DS-160 Filled By", visaOutcome: "Visa Outcome" }).map(([key, label]) =>
                                    <EditableField key={key} label={label} name={`otherInformation.${key}`} value={data.otherInformation?.[key]} isEditing={isEditing} onChange={handleDeepChange} />
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="space-y-4">
                                <SectionTitle title="Acknowledgement" />
                                <EditableCheckbox label="Bond Sign" name="acknowledgement.bondSign" checked={data.acknowledgement?.bondSign} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Bond Paper #" name="acknowledgement.bondPaper" value={data.acknowledgement?.bondPaper} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableCheckbox label="Online Signature" name="acknowledgement.onlineSignature" checked={data.acknowledgement?.onlineSignature} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Interview Classes Certificate Number" name="acknowledgement.interviewClassesCertificateNumber" value={data.acknowledgement?.interviewClassesCertificateNumber} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="GAP" name="acknowledgement.gap" value={data.acknowledgement?.gap} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Service Fee Reciept #" name="acknowledgement.serviceFeeReceipt" value={data.acknowledgement?.serviceFeeReceipt} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableCheckbox label="Financial Verification" name="acknowledgement.financialVerification" checked={data.acknowledgement?.financialVerification} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                            <div className="space-y-4">
                                <SectionTitle title="SEVIS Information" />
                                {Object.entries({ sevisNo: "SEVIS No.", sevisPaymentDate: "SEVIS Payment Date" }).map(([key, label]) =>
                                    <EditableField key={key} label={label} name={`sevisInformation.${key}`} value={data.sevisInformation?.[key]} isEditing={isEditing} onChange={handleDeepChange} />
                                )}
                            </div>
                        </div>
                    </>
                );
            case 'University Application':
                const uniData = data.universityApplication || { universities: [{}, {}, {}, {}] };
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
                        <div className="space-y-6">
                            {[0, 2].map(i => (
                                <div key={i} className="space-y-4">
                                    <SectionTitle title={`UNIVERSITY #${i + 1}`} />
                                    {Object.entries({ universityName: `University Name (${i + 1})`, course: `Course (${i + 1})`, applicationSubmissionDate: `Application Submission Date (${i + 1})`, status: `Status (${i + 1})`, remarks: `Remarks (${i + 1})` }).map(([key, label]) =>
                                        <EditableField key={key} label={label} name={`universityApplication.universities.${i}.${key}`} value={uniData.universities?.[i]?.[key]} isEditing={isEditing} onChange={handleDeepChange} />
                                    )}
                                </div>
                            ))}
                            <div className="space-y-4">
                                <SectionTitle title="ACADEMIC INFORMATION" />
                                <EditableField label="Passing Body/University" name="universityApplication.academicInformation.passingBodyUniversity" value={uniData.academicInformation?.passingBodyUniversity} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Passing Year" name="universityApplication.academicInformation.passingYear" value={uniData.academicInformation?.passingYear} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {[1, 3].map(i => (
                                <div key={i} className="space-y-4">
                                    <SectionTitle title={`UNIVERSITY #${i + 1}`} />
                                    {Object.entries({ universityName: `University Name (${i + 1})`, course: `Course (${i + 1})`, applicationSubmissionDate: `Application Submission Date (${i + 1})`, status: `Status (${i + 1})`, remarks: `Remarks (${i + 1})` }).map(([key, label]) =>
                                        <EditableField key={key} label={label} name={`universityApplication.universities.${i}.${key}`} value={uniData.universities?.[i]?.[key]} isEditing={isEditing} onChange={handleDeepChange} />
                                    )}
                                </div>
                            ))}
                            <div className="space-y-4">
                                <SectionTitle title="LANGUAGE PROFICIENCY INFORMATION" />
                                <EditableField label="Language Proficiency" name="universityApplication.languageProficiency.languageProficiency" value={uniData.languageProficiency?.languageProficiency} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Score" name="universityApplication.languageProficiency.score" value={uniData.languageProficiency?.score} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Exam Date" name="universityApplication.languageProficiency.examDate" value={uniData.languageProficiency?.examDate} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                        </div>
                    </div>
                );
            case 'Admin Control':
                const adminData = data.adminControl || {};
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <SectionTitle title="NOTICES" />
                                <EditableCheckbox label="General Terms & Conditions" name="adminControl.notices.generalTerms" checked={adminData.notices?.generalTerms} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableCheckbox label="Current Status" name="adminControl.notices.currentStatus" checked={adminData.notices?.currentStatus} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                            <div className="space-y-4">
                                <SectionTitle title="AGENT RELATED" />
                                <EditableField label="Payment Status" name="adminControl.agentRelated.paymentStatus" value={adminData.agentRelated?.paymentStatus} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableField label="Payment Date" name="adminControl.agentRelated.paymentDate" value={adminData.agentRelated?.paymentDate} isEditing={isEditing} onChange={handleDeepChange} />
                                <div className={`${isEditing ? '' : 'p-2 rounded-md border border-gray-200 dark:border-gray-700 min-h-[58px]'}`}>
                                    <label className={`block text-xs font-medium ${isEditing ? 'text-gray-500 dark:text-gray-400 mb-1' : 'text-gray-500 dark:text-gray-400'}`}>Screenshot</label>
                                    {isEditing ? (
                                        <>
                                            <input type="file" ref={adminScreenshotFileInputRef} onChange={(e) => handleFileChange(e, 'adminScreenshot')} className="hidden" />
                                            <div className="flex items-center mt-1 space-x-2">
                                                <button type="button" onClick={() => adminScreenshotFileInputRef.current?.click()} className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-gray-500 rounded-md hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500">
                                                    <Upload size={12} className="mr-1.5" />
                                                    Upload your file
                                                </button>
                                                {adminData.agentRelated?.screenshot && <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{adminData.agentRelated.screenshot}</span>}
                                            </div>
                                        </>
                                    ) : adminData.agentRelated?.screenshot ? (
                                        adminData.agentRelated.screenshotUrl ? (
                                            <a href={adminData.agentRelated.screenshotUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-lyceum-blue hover:underline mt-1 truncate w-full text-left">
                                                <Paperclip size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="truncate">{adminData.agentRelated.screenshot}</span>
                                            </a>
                                        ) : (
                                            <button onClick={() => handleDownload(adminData.agentRelated!.screenshot!)} className="flex items-center text-sm font-medium text-lyceum-blue hover:underline mt-1 truncate w-full text-left">
                                                <Paperclip size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="truncate">{adminData.agentRelated.screenshot}</span>
                                            </button>
                                        )
                                    ) : (
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate"><span className="italic text-gray-400 dark:text-gray-500">Not set</span></p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <SectionTitle title="WARNING" />
                                <EditableCheckbox label="Termination: Dues" name="adminControl.warning.terminationDues" checked={adminData.warning?.terminationDues} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableCheckbox label="Termination: Non-Compliance" name="adminControl.warning.terminationNonCompliance" checked={adminData.warning?.terminationNonCompliance} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                            <div className="space-y-4">
                                <SectionTitle title="OTHERS" />
                                <EditableCheckbox label="Finalise Agent" name="adminControl.others.finaliseAgent" checked={adminData.others?.finaliseAgent} isEditing={isEditing} onChange={handleDeepChange} />
                                <EditableCheckbox label="ID Card" name="adminControl.others.idCard" checked={adminData.others?.idCard} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                        </div>
                    </div>
                );
            case 'Others':
                const othersData = data.others || { workDetails: [] };
                return (
                    <div className="p-6">
                        <SectionTitle title="WORK" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <EditableField label="Gap Duration" name="others.gapDuration" value={othersData.gapDuration} isEditing={isEditing} onChange={handleDeepChange} />
                            <div></div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Details</label>
                                <div className="space-y-2 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Duration & Company</p>
                                        {isEditing && (
                                            <button onClick={handleAddWorkDetail} className="text-xs text-lyceum-blue hover:underline font-medium">Add a line</button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {othersData.workDetails?.map((detail, index) => (
                                            <div key={index}>
                                                <input
                                                    type="text"
                                                    name={`others.workDetails.${index}.durationAndCompany`}
                                                    value={detail.durationAndCompany || ''}
                                                    onChange={handleDeepChange}
                                                    readOnly={!isEditing}
                                                    className="w-full text-sm bg-transparent focus:outline-none placeholder:text-gray-400 border-b border-gray-200 dark:border-gray-600 py-1 focus:border-lyceum-blue disabled:border-transparent"
                                                    disabled={!isEditing}
                                                    placeholder={isEditing ? 'Enter details...' : ''}
                                                />
                                            </div>
                                        ))}
                                        {isEditing && othersData.workDetails.length === 0 && (
                                            <p className="text-xs text-center py-2 text-gray-400">Click 'Add a line' to add work experience.</p>
                                        )}
                                        {!isEditing && othersData.workDetails.length === 0 && (
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 py-1"><span className="italic text-gray-400 dark:text-gray-500">Not set</span></p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <EditableCheckbox label="Submitted for Approval?" name="others.submittedForApproval" checked={othersData.submittedForApproval} isEditing={isEditing} onChange={handleDeepChange} />
                            </div>
                        </div>
                    </div>
                );
            case 'Status':
                return (
                    <div className="p-6">
                        <div className="max-w-md mx-auto">
                            <SectionTitle title="FILE STATUS" />
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Current Status
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={contact.fileStatus || ''}
                                            onChange={(e) => {
                                                const newStatus = e.target.value as any;
                                                onSave({ ...contact, fileStatus: newStatus });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select Status</option>
                                            <option value="In progress">In progress</option>
                                            <option value="Closed">Closed</option>
                                            <option value="On hold">On hold</option>
                                        </select>
                                    ) : (
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${contact.fileStatus === 'In progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            contact.fileStatus === 'Closed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                contact.fileStatus === 'On hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {contact.fileStatus || 'Not Set'}
                                        </div>
                                    )}
                                </div>

                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <p>Update the file status to track the progress of this application.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in">
            <div className="flex items-center justify-between p-6">
                <div>
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-2"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Details
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Visa Details for {contact.name}
                    </h1>
                </div>
                {!isEditing && (user.role === 'Admin' || user.permissions?.['Contacts']?.update) && (
                    <button onClick={handleEditToggle} className="inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark">
                        <Edit size={16} className="mr-2" />
                        Edit
                    </button>
                )}
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 px-4">
                <div className="w-full overflow-x-auto">
                    <nav className="-mb-px flex">
                        <VisaTab label="Visa Filing" active={activeTab === 'Visa Filing'} onClick={() => setActiveTab('Visa Filing')} />
                        <VisaTab label="University Application" active={activeTab === 'University Application'} onClick={() => setActiveTab('University Application')} />
                        <VisaTab label="Admin Control" active={activeTab === 'Admin Control'} onClick={() => setActiveTab('Admin Control')} />
                        <VisaTab label="Others" active={activeTab === 'Others'} onClick={() => setActiveTab('Others')} />
                        <VisaTab label="Status" active={activeTab === 'Status'} onClick={() => setActiveTab('Status')} />
                    </nav>
                </div>
            </div>

            <div>
                {renderContent()}
                {isEditing && (
                    <div className="px-6 pb-6 flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={handleCancel} className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark">
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default ContactVisaView;