const { GoogleGenerativeAI } = require("@google/generative-ai");

// Try environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log(`✅ Success! Response: ${response.text()}`);
    } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
    }
}

test();
