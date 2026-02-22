const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API Key
const envPath = path.resolve(__dirname, '.env');
let apiKey = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/) || envContent.match(/OPENAI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, '');
    }
} catch (e) { }

console.log(`🔑 Using API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NONE'}`);

function testModel(modelName) {
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
            console.log(`\n--- Testing ${modelName} ---`);
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log("✅ SUCCESS!");
                // console.log(body);
            } else {
                console.log("❌ FAILED");
                console.log(body);
            }
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });

    req.write(data);
    req.end();
}

testModel("gemini-2.0-flash");
testModel("gemini-1.5-flash");
