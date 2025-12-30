
import fetch from 'node-fetch';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJhZG1pbkBseWNldW0uY29tIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNzY2NDg1NzY0LCJleHAiOjE3NjcwOTA1NjR9.4tSsMeOBP5kuqgBFpc-ZXve1obMVNqAttD3NOUc2MbY'; // From previous step
const BASE_URL = 'http://localhost:5002/api';

const endpoints = [
    '/users',
    '/activity-log',
    '/payment-activity-log',
    '/contacts',
    '/transactions',
    '/leads',
    '/quotation-templates',
    '/visitors',
    '/tasks',
    '/events',
    '/channels',
    '/coupons',
    '/lms-courses',
    '/notifications'
];

async function checkEndpoints() {
    console.log('Checking all API endpoints...');

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log(`✅ ${endpoint}: OK`);
            } else {
                console.error(`❌ ${endpoint}: Failed with status ${response.status}`);
                const text = await response.text();
                console.error(`   Response: ${text.substring(0, 200)}`);
            }
        } catch (err) {
            console.error(`❌ ${endpoint}: Network Error - ${err.message}`);
        }
    }
}

checkEndpoints();
