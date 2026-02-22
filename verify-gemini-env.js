const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Manually read .env file since dotenv might not be installed or loaded
const envPath = path.resolve(__dirname, '.env');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    }
} catch (e) {
    console.error("Could not read .env file:", e.message);
}

if (!apiKey) {
    // Fallback to finding OPENAI_API_KEY if user reused it
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/OPENAI_API_KEY=(.*)/);
        if (match && match[1]) {
            apiKey = match[1].trim().replace(/^["']|["']$/g, '');
        }
    } catch (e) { }
}

if (!apiKey) {
    console.error("❌ No API Key found in .env");
    process.exit(1);
}

console.log(`🔑 Found API Key: ${apiKey.substring(0, 5)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    const modelName = "gemini-1.5-flash";
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Reply with 'Working'");
        const response = await result.response;
        console.log(`✅ SUCCESS! Response: ${response.text()}`);
    } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
    }
}

test();
