import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// Try GEMINI_API_KEY first, then OPENAI_API_KEY (in case user just replaced the value)
const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
    });
} else {
    console.warn("⚠️ No API Key found for Gemini (GEMINI_API_KEY or OPENAI_API_KEY)");
}

export interface Issue {
    file: string;
    line: number;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    type: 'BUG' | 'SECURITY' | 'STYLE' | 'PERFORMANCE';
    message: string;
    fix_code: string;
}

export async function analyzeDiff(fileDiff: { file: string; content: string }, context: string = ""): Promise<Issue[]> {
    if (!model) {
        console.error("❌ Gemini model not initialized. Missing API Key.");
        throw new Error("Missing API Key for AI Analysis");
    }

    const prompt = `Review the following specific file changes.

FILE: ${fileDiff.file}
REPO CONTEXT: ${context}

CHANGES (Git Diff):
${fileDiff.content}

Task: Identify bugs, security vulnerabilities, performance issues, and style violations.
Focus on high-impact issues. Ignore minor formatting.

Return a valid JSON array of objects (no markdown, just raw JSON).
Each object must have:
- severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
- type: "BUG" | "SECURITY" | "STYLE" | "PERFORMANCE"
- message: string (Concise description)
- fix_code: string (The corrected code snippet)
- line: number (The line number in the NEW file where the issue is. Infer from diff headers if possible, else 0)

Example:
[
  { "severity": "HIGH", "type": "BUG", "message": "Infinite loop detected", "fix_code": "while(x < 10) { ... }", "line": 15 }
]

Output JSON only. No other text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) return [];

        // Robust JSON Extraction: Find the first '[' and the last ']'
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');

        if (start === -1 || end === -1) {
            console.error("❌ Invalid JSON response from Gemini (No array found):", text);
            return [];
        }

        const jsonString = text.substring(start, end + 1);
        const data = JSON.parse(jsonString);

        // Handle if data is wrapped in an object { "issues": [...] } or just an array [...]
        let issues = [];
        if (Array.isArray(data)) {
            issues = data;
        } else if (data.issues && Array.isArray(data.issues)) {
            issues = data.issues;
        }

        return issues.map((i: any) => ({ ...i, file: fileDiff.file }));
    } catch (e) {
        console.error(`Failed to analyze ${fileDiff.file}`, e);
        throw e; // Throw so that webhook/route.ts can handle 429/Quota errors
    }
}
