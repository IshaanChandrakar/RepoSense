const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually read .env to ensure we get the latest key
const envPath = path.resolve(__dirname, '.env');
let apiKey = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/) || envContent.match(/OPENAI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, '');
    }
} catch (e) {
    console.error("❌ Could not read .env");
}

console.log(`🔑 Testing API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NONE'}`);

function testModel(modelName) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                const success = res.statusCode === 200;
                console.log(`\n[${modelName}] Status: ${res.statusCode}`);
                if (!success) {
                    console.log("Response:", body);
                } else {
                    console.log("✅ Working!");
                }
                resolve(socket = { model: modelName, success, status: res.statusCode });
            });
        });

        req.on('error', (e) => {
            console.error(e);
            resolve({ model: modelName, success: false, error: e.message });
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    // gemini-2.0-flash gave 429. 1.5 gave 404. 
    // Testing alternatives found in the list-models output.
    await testModel("gemini-2.0-flash-lite-001");
    await testModel("gemini-exp-1206");
    await testModel("gemini-2.5-flash");
}

run();
