# Contributing

Thanks for wanting to improve AI Fitness Coach.

## Local Setup

```bash
npm install
npm run dev
```

The app works in mock mode by default. You do not need API keys to build, test, or demo the core flow.

## Before Opening A PR

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Keep changes focused. UI polish, provider adapters, demo reliability, and Butterbase persistence improvements are the highest-impact areas.

## Product Principles

- The demo must complete in under two minutes.
- Mock mode must keep working without credentials.
- API route contracts should stay stable.
- The interface should feel like premium fitness studio software, not an AI infrastructure dashboard.

## Good First Issues

- Add a real screenshot or demo GIF to the README.
- Move local JSON persistence to Butterbase tables.
- Add shareable member links with simple access controls.
- Improve provider diagnostics for real video generation.
