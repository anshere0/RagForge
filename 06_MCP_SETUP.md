# MCP Setup — Tools to Connect for This Build

A quick note on framing: an AI coding agent can't truly "configure these on
its own" — connecting an MCP server requires you to authenticate it (an
OAuth flow or an API key), since these tools act on your real accounts. What
the agent *can* do is use these tools once you've connected them, and it can
tell you exactly which ones it needs and why. If you're using Claude Code,
this is done through its MCP config; if you're on claude.ai or the Claude
app, you'd connect these as connectors and the agent will offer to use them
mid-task.

Here's what's actually useful for this specific project, roughly in the
order you'll need them:

## 1. Filesystem — already built in
If you're using Claude Code, file read/write/edit in your project folder is
native, not a separate MCP server. Nothing to set up.

## 2. GitHub MCP
Lets the agent create the repo, commit, open PRs, and manage issues directly
instead of you copy-pasting `git` commands. Worth connecting from Phase 0 —
you'll want version history from the very first commit, especially once
you're cloning/adapting the template per client.

## 3. Supabase MCP
Lets the agent create tables, run migrations, inspect the schema, and query
data directly against your actual Supabase project instead of you pasting
SQL into the dashboard by hand. Very useful for Phase 0 (setting up the
`clients`/`documents`/`chunks`/`conversations`/`messages`/`leads` tables) and
for debugging retrieval issues later ("show me the chunks stored for client
X" is a real query you'll want to run often).

## 4. Vercel MCP
Lets the agent trigger deployments and check deployment/build logs directly,
which speeds up the debug loop when something works locally but breaks in
production (common with env vars). Useful from Phase 0 onward.

## 5. Playwright MCP (optional, useful from Phase 1 onward)
Lets the agent actually open a browser, load your test page with the
embedded widget, click it, and check that it renders and responds — a real
end-to-end check instead of you manually clicking through it every time.
Especially handy once the website crawler (Phase 2) needs testing against
real live pages.

## Not needed for this project
Skip anything to do with Slack/Teams/Notion/Google Drive MCPs for now —
those map to Phase 4 upsell integrations, and by the time you're building
those, you'll know exactly which client needs which one. Connecting them
now is speculative setup for features you may never build.

## How to actually connect these
Search terms if you're setting these up yourself: "Supabase MCP server",
"GitHub MCP server", "Vercel MCP", "Playwright MCP server" — each has an
official or well-maintained community server. If you're doing this inside
claude.ai or the Claude app rather than Claude Code, just ask Claude to
check available connectors for these and it'll walk you through connecting
them.
