#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_REMOTE = "origin";

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function run(command, options = {}) {
  return execSync(command, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    cwd: repoRoot,
  })?.trim();
}

const runInteractive = (command) => run(command, { stdio: "inherit" });

async function createPrompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function packageJson() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
}

function getNextVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;

    case "minor":
      return `${major}.${minor + 1}.0`;

    case "major":
      return `${major + 1}.0.0`;
  }
}

async function getReleaseType() {
  const oldVersion = packageJson().version;

  console.log(`
Current version: ${oldVersion}

  1. Patch → ${getNextVersion(oldVersion, "patch")}
  2. Minor → ${getNextVersion(oldVersion, "minor")}
  3. Major → ${getNextVersion(oldVersion, "major")}
`);

  const choice = await createPrompt("Select release type [1-3]: ");

  const releaseType = {
    1: "patch",
    2: "minor",
    3: "major",
  }[choice];

  if (!releaseType) fail("Invalid choice.");

  return releaseType;
}

function getReleaseNotes(currentTag) {
  let previousTag = "";

  try {
    previousTag = run(`git describe --tags --abbrev=0 "${currentTag}^"`);
  } catch {
    // first release
  }

  return previousTag
    ? run(`git log --pretty=format:"- %s (%h)" ${previousTag}.."${currentTag}^"`)
    : run(`git log --pretty=format:"- %s (%h)"`);
}

function parseGithubRemote(remote) {
  let match = remote.match(/^git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);

  if (!match) {
    match = remote.match(/^https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
  }

  if (!match) {
    throw new Error(`Unsupported GitHub remote: ${remote}`);
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

async function githubRequest(method, apiPath, body) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) throw new Error("GITHUB_TOKEN is missing. Start node with --env-file=.env");

  const remoteUrl = run(`git remote get-url ${DEFAULT_REMOTE}`);

  const { owner, repo } = parseGithubRemote(remoteUrl);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.github.com",
        method,
        path: `/repos/${owner}/${repo}${apiPath}`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "release-script",
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`GitHub API ${res.statusCode}\n${data}`));
            return;
          }

          resolve(data ? JSON.parse(data) : {});
        });
      },
    );

    req.on("error", reject);

    if (body) req.write(JSON.stringify(body));

    req.end();
  });
}

async function verifyRemoteHeadChecks(remoteSha) {
  console.log("Checking GitHub check runs...");

  const checks = await githubRequest("GET", `/commits/${remoteSha}/check-runs`);

  //if (!checks.check_runs || checks.check_runs.length === 0) {
  //  fail(`No check runs found for ${DEFAULT_REMOTE}/HEAD.`);
  //}

  if (checks.total_count === 0) console.warn("No checks configured");

  const failures = [];

  for (const check of checks.check_runs) {
    if (check.status !== "completed") {
      failures.push(`${check.name}: ${check.status}`);
      continue;
    }

    if (!["success", "neutral", "skipped"].includes(check.conclusion)) {
      failures.push(`${check.name}: ${check.conclusion}`);
    }
  }

  if (failures.length) fail(`Checks failed:\n${failures.join("\n")}`);

  console.log("✅ All checks passed");
}

async function createGithubRelease(tagName, releaseNotes) {
  await githubRequest("POST", "/releases", {
    tag_name: tagName,
    name: tagName,
    body: releaseNotes,
    draft: true,
    prerelease: false,
  });
}

async function main() {
  console.log("Starting release\n");

  // check we are on the default branch
  const currentUpstreamRef = run('git rev-parse --abbrev-ref "@{push}"');
  const defaultRemoteRef = run(`git symbolic-ref --short refs/remotes/${DEFAULT_REMOTE}/HEAD`);
  if (currentUpstreamRef !== defaultRemoteRef) {
    fail(
      `Current branch pushes to ${currentUpstreamRef}. Switch to the default branch that pushes to ${defaultRemoteRef} before release`,
    );
  }

  // update the remote tracking branch
  const defaultRemoteBranch = defaultRemoteRef.replace(`${DEFAULT_REMOTE}/`, "");
  runInteractive(`git fetch ${DEFAULT_REMOTE} ${defaultRemoteBranch}`);

  // check local branch is synced with its remote tracking branch
  const localHead = run("git rev-parse HEAD");
  const remoteHead = run(`git rev-parse ${defaultRemoteRef}`);
  if (localHead !== remoteHead) {
    fail(
      `Local HEAD does not match ${defaultRemoteRef}. Sync local branch with remote before release`,
    );
  }

  // check working tree is clean
  const status = run("git status --porcelain");
  if (status) fail("Working tree is not clean.");

  // check all ci check have been passed
  await verifyRemoteHeadChecks(remoteHead);

  // bump version
  const releaseType = await getReleaseType();
  console.log(`Bumping ${releaseType} version...`);
  runInteractive(`pnpm version ${releaseType} --no-git-tag-version`);

  // add to index
  runInteractive("git add package.json");
  if (fs.existsSync(path.join(repoRoot, "pnpm-lock.yaml"))) {
    try {
      runInteractive("git add pnpm-lock.yaml");
    } catch {}
  }

  // get new version and tag name
  const newVersion = packageJson().version;
  const tagName = `v${newVersion}`;

  // commit and tag
  runInteractive(`git commit -m "chore: bump version to ${newVersion}"`);
  runInteractive(`git tag -a ${tagName} -m "version ${newVersion}"`);

  // push commit and tag
  console.log("Pushing commit and tag...");
  runInteractive(`git push ${DEFAULT_REMOTE} HEAD:${defaultRemoteBranch} ${tagName}`);

  try {
    console.log("Creating GitHub release...");
    await createGithubRelease(tagName, getReleaseNotes(tagName));
  } catch (error) {
    console.error("\n❌ Failed to create GitHub release");

    console.error("Rolling back bumping commit and tag...");

    const newLocalHeadParent = run('git rev-parse "HEAD^"');
    const newRemoteHeadParent = run(`git rev-parse "${defaultRemoteRef}^"`);
    const newTagCommitParent = run(`git rev-parse "${tagName}^"`);

    if (
      newLocalHeadParent === newRemoteHeadParent &&
      newLocalHeadParent === localHead &&
      newLocalHeadParent === newTagCommitParent
    ) {
      runInteractive(`git reset --hard "HEAD^"`);
      runInteractive(`git push -f ${DEFAULT_REMOTE} HEAD:${defaultRemoteBranch} :${tagName}`);
      runInteractive(`git tag -d ${tagName}`);
    }

    throw error;
  }

  console.log(`\n✅ Release completed: ${tagName}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (args.length === 1 && args[0] === "--release-only") {
  const tagName = `v${packageJson().version}`;
  createGithubRelease(tagName, getReleaseNotes(tagName)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  console.error(`Unknown args: ${args}`);
  process.exit(1);
}
