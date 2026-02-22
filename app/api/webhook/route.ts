import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { getOctokit, getPRDiff } from "@/lib/github";
import { analyzeDiff } from "@/lib/analysis";
import prisma from "@/lib/prisma";

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET || "development-secret",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const event = req.headers.get("x-github-event") || "ping";
  console.log(`📨 Incoming Webhook! Event: ${event}`);

  const verified = await webhooks.verify(body, signature);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  console.log(`🔍 Webhook received! Event: ${event}, Action: ${payload.action}`);

  if (event === "pull_request") {
    const { action, pull_request, repository, installation } = payload;

    if (action === "opened" || action === "reopened" || action === "synchronize") {
      console.log(
        `🔍 Analyzing PR #${pull_request.number} in ${repository.full_name}`
      );

      const result = await processPullRequest(
        pull_request,
        repository,
        installation.id
      );

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function processPullRequest(
  pr: any,
  repo: any,
  installationId: number
) {
  const startTime = Date.now();
  try {
    console.log(`🔌 Using Installation ID: ${installationId}`);
    const octokit = getOctokit(installationId);

    // 1️⃣ Fetch diff
    const diffRaw = await getPRDiff(
      octokit,
      repo.owner.login,
      repo.name,
      pr.number
    );

    if (!diffRaw) {
      console.log("⚠️ No diff found");
      return { ok: false, error: "No diff found" };
    }

    // 2️⃣ Parse diff (Simple Regex Split)
    // Files start with "diff --git a/..."
    const fileDiffs = diffRaw.split('diff --git a/').slice(1).map(chunk => {
      const lines = chunk.split('\n');
      const file = lines[0].split(' ')[0]; // Extract filename
      return { file, content: chunk };
    });

    console.log(`📂 Found ${fileDiffs.length} files to review.`);

    let totalIssues = 0;
    let comments = [];

    // 3️⃣ Analyze each file
    for (const fileDiff of fileDiffs) {
      // Skip lock files
      if (fileDiff.file.includes('lock.json') || fileDiff.file.includes('.lock')) continue;

      try {
        const issues = await analyzeDiff(fileDiff, "");
        totalIssues += issues.length;

        for (const issue of issues) {
          // Post comment to GitHub
          await octokit.issues.createComment({
            owner: repo.owner.login,
            repo: repo.name,
            issue_number: pr.number,
            body: `**🤖 AI Review (${issue.severity})**\n\n${issue.message}\n\n\`\`\`suggestion\n${issue.fix_code}\n\`\`\``,
          });
          comments.push(issue);
        }
      } catch (error: any) {
        if (error?.status === 429 || error?.message?.includes("insufficient_quota")) {
          console.warn(`⚠️ OpenAI Quota Exceeded for ${fileDiff.file}. Skipping.`);
          comments.push({
            severity: "CRITICAL",
            message: "Analysis skipped due to API quota exceeded.",
            file: fileDiff.file,
            line: 0,
            fix_code: "" // Add missing property
          });
        } else {
          console.error(`❌ Failed to analyze ${fileDiff.file}:`, error);
        }
      }
    }

    // 4️⃣ UPSERT Repository (PARENT)
    const repositoryRecord = await prisma.repository.upsert({
      where: {
        githubId: repo.id.toString(), // Convert to String
      },
      update: {
        name: repo.name,
        owner: repo.owner.login,
      },
      create: {
        githubId: repo.id.toString(), // Convert to String
        name: repo.name,
        owner: repo.owner.login,
        installId: installationId,
      },
    });

    // 5️⃣ UPSERT Pull Request (CHILD)
    const pullRequestRecord = await prisma.pullRequest.upsert({
      where: {
        githubId: pr.id.toString(), // Convert to String
      },
      update: {
        title: pr.title,
      },
      create: {
        githubId: pr.id.toString(), // Convert to String
        number: pr.number,
        title: pr.title,
        repoId: repositoryRecord.id,
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 6️⃣ CREATE Review (CHILD of BOTH)
    await prisma.review.create({
      data: {
        prId: pullRequestRecord.id,
        repoId: repositoryRecord.id,
        status: comments.length > 0 ? "REVIEWED_WITH_ISSUES" : "APPROVED",
        summary: `Analyzed ${fileDiffs.length} files. Found ${comments.length} issues.`,
        issues: JSON.stringify(comments), // Store issues as JSON
        issuesFound: comments.length,
        duration: duration,
      },
    });

    console.log(`✅ Review saved for PR #${pr.number} (Duration: ${duration}ms)`);
    return { ok: true };

  } catch (error: any) {
    console.error("🔥 PR processing failed:", error);
    return { ok: false, error: error.message };
  }
}
