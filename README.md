# AI Fitness Coach for Gyms

**Live Demo**: [https://ai-fitness-coach-spread.butterbase.dev/](https://ai-fitness-coach-spread.butterbase.dev/)

A Next.js demo app for gym owners to create personalized 5-video onboarding plans for new members.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, create a gym profile, add a member, and watch the plan generate. By default the app uses local file-backed persistence and mock AI/video generation so the full demo loop works without paid API credits.

## Real API Mode

Copy `.env.example` to `.env.local`, fill in keys, and set:

```bash
USE_REAL_ZAI=true
USE_REAL_VIDEO=true
```

The app keeps a local fallback for demos when the upstream video service is unavailable or quota-limited.

## Core Routes

- `POST /api/gyms`
- `POST /api/members`
- `POST /api/generate-plan`
- `POST /api/generate-video`
- `GET /api/plans/:planId`
- `POST /api/webhooks`

## Notes

The generated `.env.example` intentionally does not include real credentials. If any API keys were shared in planning docs, rotate them before deploying.
