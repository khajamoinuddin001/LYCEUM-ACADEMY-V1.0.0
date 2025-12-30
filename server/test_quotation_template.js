import fetch from 'node-fetch';

const API_URL = 'http://localhost:5002/api';
let authToken = '';

async function login() {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testadmin1765530751824@lyceum.com', password: 'password123' })
    });
    const data = await response.json();
    if (data.token) {
        authToken = data.token;
        console.log('✅ Login successful');
    } else {
        console.error('❌ Login failed', data);
        process.exit(1);
    }
}

async function testCreateTemplate() {
    const template = {
        title: "Test Template " + Date.now(),
        description: "Description",
        lineItems: [{ description: "Item 1", price: 100 }],
        total: 100
    };

    const response = await fetch(`${API_URL}/quotation-templates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(template)
    });

    const data = await response.json();
    if (response.ok && data.id) {
        console.log('✅ Template created successfully:', data);
        if (!data.lineItems || data.lineItems.length === 0) {
            console.error('❌ Created template missing lineItems (check casing):', data);
        } else {
            console.log('✅ lineItems present:', data.lineItems);
        }
    } else {
        console.error('❌ Template creation failed:', data);
    }
}

async function run() {
    await login();
    await testCreateTemplate();
}

run();
