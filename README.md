# AI Code Reviewer for GitHub Pull Requests 

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![OpenAI](https://img.shields.io/badge/AI-Gemini--2.5--flash-green)

A production-ready GitHub App that automatically reviews Pull Requests using LLMs and RAG. It provides threaded, context-aware comments on bugs, security vulnerabilities, and style violations, acting as an always-on senior engineer for your repo.

## Features

-   **Context-Aware Analysis**: Uses RAG (LanceDB) to understand your repo's specific architecture and conventions before reviewing.
-   **Intelligent Diffs**: Parses Git diffs to comment on specific lines with suggested fixes.
-   **Security First**: Proactively flags potential security risks (SQLi, XSS, hardcoded secrets).
-   **Threaded Comments**: Posts actionable feedback directly on the PR timeline.
-   **Dashboard**: View review metrics, historical data, and aggregate stats.

## Tech Stack

-   **Frontend**: Next.js 15 (App Router), TailwindCSS
-   **Backend**: Next.js API Routes (Serverless), Webhooks
-   **Database**: SQLite (via Prisma) - *Easy to swap for Postgres/Turso*
-   **Vector DB**: LanceDB (Embedded)
-   **AI**: OpenAI GPT-4o-mini
-   **Integration**: Octokit, GitHub Webhooks

## Installation & Setup

### Prerequisites
-   Node.js 18+
-   A GitHub Account
-   OpenAI API Key

### 1. Clone & Install
```bash
git clone https://github.com/your-username/ai-code-reviewer.git
cd ai-code-reviewer
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in the details:
```bash
cp .env.example .env
```
-   `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`: From your GitHub App settings.
-   `OPENAI_API_KEY`: Your OpenAI key.

### 3. Create GitHub App
1.  Go to **Developer Settings** -> **GitHub Apps** -> **New GitHub App**.
2.  **Webhook URL**: `https://your-deployed-domain.com/api/webhook` (Use `smee.io` for local dev).
3.  **Permissions**:
    -   `Pull Requests`: Read & Write
    -   `Contents`: Read
4.  Subscribe to `pull_request` events.

### 4. Run Locally
```bash
# Database setup
npx prisma db push

# Start server
npm run dev
```

## How It Works (Architecture)

1.  **Webhook Trigger**: GitHub sends a `pull_request` payload to `/api/webhook`.
2.  **Diff Parsing**: The system fetches the PR diff and parses it into file chunks.
3.  **RAG Context**: (Optional) Relevant repo documentation is retrieved from LanceDB to provide context (e.g., "We use snake_case for database columns").
4.  **LLM Analysis**: GPT-4o-mini analyzes the code changes + context to identify issues.
5.  **Feedback Loop**: Issues are posted as review comments on GitHub.

## Why Use This? 

This project demonstrates:
-   **System Design**: Handling async webhooks and serverless constraints.
-   **AI Engineering**: Implementing RAG and prompt engineering for code analysis.
-   **Product Quality**: Clean UI, typed codebase, and robust error handling.
-   **Real-world Impact**: Solves a genuine developer friction point (code review fatigue).

---

Built with ❤️ by Ishaan 
