const fetch = require('node-fetch'); // You might need to install this or use built-in fetch in Node 18+

async function test() {
    console.log("🚀 Sending fake webhook to localhost:3000...");

    const payload = {
        action: "opened",
        pull_request: {
            number: 1,
            id: 12345,
            title: "Test PR from Script",
            user: { login: "testuser" },
            head: { sha: "randomsha" }
        },
        repository: {
            id: 67890,
            name: "test-repo",
            full_name: "testuser/test-repo",
            owner: { login: "testuser" }
        },
        installation: { id: 123456 }
    };

    try {
        const response = await fetch('http://localhost:3000/api/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-github-event': 'pull_request'
                // We are skipping signature verification for local test if the code allows (or we might get 401)
            },
            body: JSON.stringify(payload)
        });

        console.log(`Response: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(text);
    } catch (error) {
        console.error("❌ Failed to connect:", error.message);
    }
}

test();
