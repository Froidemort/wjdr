#!/usr/bin/env node
// Agent hook + pre-commit scanner: keeps secrets and .env out of the model context.
// Never prints matched values, only the rule name.
const fs = require('node:fs');
const process = require('node:process');

const SECRET_RULES = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['openai/stripe-style key', /\bsk[-_](live|test|proj)?[-_]?[A-Za-z0-9]{20,}/],
  ['github token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/],
  ['aws access key', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{20,}/],
  ['slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['credentials in url', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]{3,}@/i],
  [
    'secret assignment',
    /\b[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PASSWD|API_?KEY|SERVICE_ROLE|PRIVATE_KEY)[A-Z0-9_]*\s*[=:]\s*["']?[A-Za-z0-9_\-/+.=]{16,}/,
  ],
];

// `.env`, `.env.local`, `.env.production`...; `.env.example|sample|template` stay readable.
const ENV_PATH = /(^|[\s"'`=:\\/(,[])\.env(?!\.(example|sample|template|dist)\b)(\.[\w.-]+)?(?=$|[\s"'`;|&)\\/,\]])/i;
const ENV_DUMP = /(^|[;&|(\s])(printenv|env|export\s+-p|declare\s+-x|compgen\s+-e)(\s*$|\s*[;&|)])/;

// Files the agent must not alter: the guards themselves.
const PROTECTED = /(^|[\s"'`=:\\/])(\.github\/hooks\/|\.pre-commit-config\.yaml|\.vscode\/settings\.json)/;
const WRITE_TOOL = /edit|create|replace|write|delete|rename|patch|insert|move/i;
const SHELL_TOOL = /terminal|bash|shell|command/i;
const SHELL_WRITE = /(^|[^<>])>{1,2}(?!&)|\b(sed\s+-i|tee|rm|mv|cp|chmod|truncate|ln|perl\s+-i|git\s+(checkout|restore|rm|apply|stash))\b/;
// Free-text fields describe the call; they are not executed.
const META_KEYS = new Set(['explanation', 'goal', 'description']);

const findSecret = (text) => SECRET_RULES.find(([, re]) => re.test(text))?.[0];

const leaves = (value) =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.entries(value)
          .filter(([key]) => !META_KEYS.has(key))
          .flatMap(([, v]) => leaves(v))
      : [];

const flatten = (value) => (typeof value === 'string' ? value : leaves(value).join('\n'));

function scanFiles(files) {
  let failed = false;
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rule = findSecret(text);
    if (rule) {
      console.error(`${file}: possible secret (${rule})`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function handle(event) {
  const name = event.hook_event_name;

  if (name === 'PreToolUse') {
    const input = event.tool_input ?? {};
    const text = flatten(input);
    const tool = String(event.tool_name ?? '');
    if (PROTECTED.test(text)) {
      const writes = SHELL_TOOL.test(tool) ? SHELL_WRITE.test(text) : WRITE_TOOL.test(tool);
      if (writes) deny('Blocked: hook, prek and settings files are user-owned; ask the user to edit them.');
    }
    if (ENV_PATH.test(text) || leaves(input).some((s) => ENV_DUMP.test(s))) {
      deny('Blocked: .env files and environment dumps must never be read.');
    }
    if (input.includeIgnoredFiles === true) {
      deny('Blocked: searching ignored files could expose .env.');
    }
    const rule = findSecret(text);
    if (rule) deny(`Blocked: tool input contains a secret (${rule}).`);
    return;
  }

  if (name === 'UserPromptSubmit') {
    const rule = findSecret(flatten(event.prompt));
    if (rule) {
      process.stdout.write(
        JSON.stringify({
          continue: false,
          stopReason: `Prompt contains a secret (${rule}). Remove it and resubmit; rotate it if it is real.`,
        }),
      );
    }
    return;
  }

  if (name === 'PostToolUse') {
    const rule = findSecret(flatten(event.tool_response));
    if (rule) {
      process.stdout.write(
        JSON.stringify({
          decision: 'block',
          reason: `Tool output contains a secret (${rule}). Do not repeat or use it; tell the user to rotate it.`,
        }),
      );
    }
  }
}

const args = process.argv.slice(2);
if (args[0] === '--files') {
  scanFiles(args.slice(1));
} else {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (raw += chunk));
  process.stdin.on('end', () => {
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      process.exit(0);
    }
    handle(event);
  });
}
