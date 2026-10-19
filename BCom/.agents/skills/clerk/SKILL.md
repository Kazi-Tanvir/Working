---
name: clerk
description: Clerk authentication router. Use when user asks about Clerk CLI operations, adding authentication, setting up Clerk, custom sign-in flows, Swift or native iOS auth, native Android auth, Next.js patterns, React patterns, Vue patterns, Nuxt patterns, Astro patterns, TanStack Start patterns, Expo patterns, React Router patterns, Chrome Extension patterns, organizations, billing, subscriptions, payments, pricing, plans, seat-based pricing, feature entitlements, syncing users, testing, impersonating a user, or testing webhooks locally. Automatically routes to the specific skill based on their task.
license: MIT
metadata:
  version: 2.0.0
---

# Clerk Skills Router

## Version Detection

Check `package.json` to determine the Clerk SDK version. This determines which patterns to use:

| Package | Core 2 (LTS until Jan 2027) | Current |
|---------|----------------------------|---------|
| `@clerk/nextjs` | v5–v6 | v7+ |
| `@clerk/react` or `@clerk/clerk-react` | v5–v6 | v7+ |
| `@clerk/expo` or `@clerk/clerk-expo` | v1–v2 | v3+ |
| `@clerk/react-router` | v1–v2 | v3+ |
| `@clerk/tanstack-react-start` | < v0.26.0 | v0.26.0+ |

**Default to current** if the version is unclear or the project is new. Core 2 packages use `@clerk/clerk-react` and `@clerk/clerk-expo` (with `clerk-` prefix); current packages use `@clerk/react` and `@clerk/expo`.

All skills are written for the current SDK. When something differs in Core 2, it's noted inline with `> **Core 2 ONLY (skip if current SDK):**` callouts. The exception is `clerk-custom-ui`, which has separate `core-2/` and `core-3/` directories for custom flow hooks since those APIs are entirely different between versions.

---

## By Task

**Adding Clerk to your project** → Use `clerk-setup`
- Framework detection and quickstart
- Environment setup, API keys, temporary dev keys via `clerk init`
- Migration from other auth providers
- Native iOS and macOS apps in Xcode, through the iOS setup prompt

**Operating Clerk from the CLI** → Use `clerk-cli`
- Auth, linking, `doctor`, and environment pulls
- User, org, session, app, and instance management
- Impersonating a user (`clerk impersonate`) and local webhook testing (`clerk webhooks listen`)
- Feature toggles (`clerk enable orgs`, `clerk enable billing`)
- Backend, Platform, and Frontend API calls through `clerk api`
- Deploy handoff and deploy status verification

**Custom sign-in/sign-up UI** → Use `clerk-custom-ui`
- Custom authentication flows with Clerk components & hooks
