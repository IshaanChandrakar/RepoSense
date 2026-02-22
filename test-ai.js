const fs = require('fs');
const path = require('path');

// Load .env manually BEFORE requiring the library
const envPath = path.resolve(__dirname, '.env');
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/) || envContent.match(/OPENAI_API_KEY=(.*)/);
    if (match && match[1]) {
        process.env.GEMINI_API_KEY = match[1].trim().replace(/^["']|["']$/g, '');
        console.log("🔑 API Key loaded from .env");
    }
} catch (e) {
    console.error("⚠️ Could not read .env file");
}

// NOW require the library
const { analyzeDiff } = require('./lib/analysis');

// Mock a diff with a clear security vulnerability (eval)
const fakeDiff = {
    file: "bad_code.js",
    content: `
  function processInput(input) {
-   console.log(input);
+   eval(input); // CRITICAL BUG
  }
  `
};

async function run() {
    console.log("🧪 Testing AI Analysis on 'bad_code.js'...");
    try {
        const issues = await analyzeDiff(fakeDiff, "Test Repo");
        console.log("---------------------------------------------------");
        console.log("RAW RESULTS:");
        console.log(JSON.stringify(issues, null, 2));
        console.log("---------------------------------------------------");

        if (issues.length > 0) {
            console.log("✅ AI SUCCESSFULLY CAUGHT THE BUG!");
        } else {
            console.log("❌ AI FAILED TO CATCH THE BUG (Returned 0 issues).");
        }
    } catch (error) {
        console.error("🔥 ERROR:", error);
    }
}

run();
