# AI App Launch System

This machine is set up so Codex and OpenClaw can help build, test, deploy, and manage multiple apps from one working system.

## Main Local Tools

- Codex Desktop with Codex CLI
- OpenClaw local gateway
- Docker Desktop
- Docker Compose
- Docker MCP Toolkit
- Git and GitHub SSH workflow
- Vercel CLI workflow
- Supabase project workflow
- Playwright browser testing through MCP

## Codex MCP Servers

- `computer-use`: desktop/app control through Codex.
- `filesystem`: scoped access to Desktop, Documents, Downloads, YourMasterHomeopathy, and innate-wellness.
- `playwright`: browser testing, page inspection, UI flow testing, and screenshots.
- `openclaw`: bridge to OpenClaw through MCP.
- `MCP_DOCKER`: Docker MCP gateway using the `general` profile.
- `github`: GitHub remote MCP entry.
- `supabase`: Supabase remote MCP entry scoped to Tongue Test project in read-only mode.
- `vercel`: Vercel remote MCP entry. Still requires OAuth login.

## OpenClaw MCP Servers

- `filesystem`: scoped access to the same main working folders.
- `playwright`: browser testing.
- `docker`: Docker MCP gateway using the `general` profile.
- `github`: GitHub remote MCP entry.
- `supabase`: Supabase remote MCP entry scoped to Tongue Test project in read-only mode.
- `vercel`: Vercel remote MCP entry.

## Docker MCP Profile

Profile name: `general`

Included servers:

- `context7`: current documentation lookup for libraries and frameworks.
- `sequentialthinking`: structured step-by-step reasoning for complex app setup and debugging.

## What This Helps With

- Build new apps faster.
- Inspect local projects and assets.
- Test web app flows in a browser.
- Use Docker-based tools when local services are needed.
- Coordinate Codex and OpenClaw.
- Keep future app setup more repeatable.

## Current Limitations

- Vercel MCP is configured but still needs OAuth login approval.
- Supabase MCP is currently read-only for safety.
- Google Drive MCP is not connected yet because it requires account authorization.
- Stripe, RevenueCat, and Namecheap are best managed through their dashboards/APIs unless reliable MCP servers are added later.

## Useful Verification Commands

```bash
codex mcp list
openclaw mcp list
docker --version
docker compose version
docker mcp profile list
docker mcp profile show general
```

