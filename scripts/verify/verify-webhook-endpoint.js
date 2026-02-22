// verify-webhook-endpoint.js
// Sends a fake webhook to localhost:3000 to see if it logs in the terminal.

const http = require('http');

const payload = JSON.stringify({
    action: "opened",
    pull_request: {
        number: 1337,
        id: 12345,
        title: "Test PR from Script",
        user: { login: "test-user" }
    },
    repository: {
        id: 99999,
        name: "test-repo",
        full_name: "test-owner/test-repo",
        owner: { login: "test-owner" }
    },
    installation: {
        id: 109301764 // Using the ID we found earlier
    }
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'x-github-event': 'pull_request',
        'x-hub-signature-256': 'sha256=fake-signature' // The backend verification might fail, but it SHOULD log "Webhook received" first
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(payload);
req.end();

console.log("🚀 Sending fake webhook to http://localhost:3000/api/webhook ...");
