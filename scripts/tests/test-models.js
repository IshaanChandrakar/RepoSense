const { GoogleGenerativeAI } = require("@google/generative-ai");

// Try environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in environment variables");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log("🔍 Checking available models...");
    try {
        // There isn't a direct listModels method on the client instance in some versions,
        // but usually we can try to instantiate a model and run a test.
        // Actually, newer SDKs don't expose listModels easily on the generic client.
        // Instead we will try to generate content with a few common names and see which one works.

        const candidates = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`✅ SUCCESS!`);
            } catch (error) {
                console.log(`❌ FAILED (${error.message.split('[')[0]})`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
