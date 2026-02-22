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

if (!apiKey) {
    console.error("❌ No API Key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("❌ API Error:", json.error.message);
            } else {
                console.log("✅ Available Models:");
                if (json.models) {
                    json.models.forEach(m => {
                        if (m.supportedGenerationMethods.includes("generateContent")) {
                            console.log(`- ${m.name}`);
                        }
                    });
                } else {
                    console.log("No models found in response:", json);
                }
            }
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw output:", data);
        }
    });
}).on('error', (e) => {
    console.error("Request error:", e.message);
});
