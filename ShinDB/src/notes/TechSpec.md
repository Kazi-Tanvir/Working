# ShinDB — Technical Specification

> **Version**: 1.0.0-draft  
> **Last Updated**: 2026-06-14  
> **Status**: Draft  
> **Companion Docs**: [PRD.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/PRD.md) · [DESIGN.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/DESIGN.md) · [SYS_Tracker.md](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/SYS_Tracker.md)

---

## Table of Contents

1. [Tech Stack Summary](#1-tech-stack-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Frontend Specification](#3-frontend-specification)
4. [Backend Specification](#4-backend-specification)
5. [API Gateway Design](#5-api-gateway-design)
6. [API Endpoint Reference](#6-api-endpoint-reference)
7. [Authentication System](#7-authentication-system)
8. [Database Design](#8-database-design)
9. [External API Integrations](#9-external-api-integrations)
10. [Caching Strategy](#10-caching-strategy)
11. [Error Handling](#11-error-handling)
12. [File Storage](#12-file-storage)
13. [Testing Strategy](#13-testing-strategy)
14. [Logging & Monitoring](#14-logging--monitoring)
15. [Development Environment](#15-development-environment)
16. [Deployment Configuration](#16-deployment-configuration)
17. [Environment Variables](#17-environment-variables)
18. [Security Considerations](#18-security-considerations)

---

## 1. Tech Stack Summary

### Core Technologies

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | Next.js (App Router) | 15.x | SSR/SSG support, file-based routing, React Server Components |
| **Frontend Styling** | Tailwind CSS | v3.x | Utility-first, rapid iteration, consistent design tokens. v3 chosen over v4 for maturity, plugin ecosystem, and stable documentation |
| **Backend Framework** | Hono | 4.x | Lightweight (~14KB), Web Standards API, excellent TypeScript inference, edge-ready. Chosen over Express for its modern API and significantly better performance in microservices |
| **ORM** | Prisma | 6.x | Mature tooling (Prisma Studio, migrations, introspection), large community, excellent TypeScript support |
| **Database** | PostgreSQL | 16+ | ACID compliance, JSON support, array types, robust indexing |
| **Cache** | Redis | 7.x | Session storage, search result caching, stats caching |
| **Validation** | Zod | 3.x | Runtime validation with TypeScript type inference, composable schemas |
| **Data Fetching** | TanStack Query (React Query) | 5.x | Automatic caching, background refetching, optimistic updates, devtools. Ideal for a dashboard-heavy app with frequent data mutations |
| **Build System** | Turborepo | 2.x | Monorepo task orchestration with caching |
| **Package Manager** | pnpm | 9.x | Workspace support, strict dependency resolution, disk-efficient |
| **Runtime** | Node.js | 20 LTS | Long-term support until April 2026, stable native fetch, mature ESM support |
| **Language** | TypeScript | 5.8+ | Relaxed strict mode for v1.0 (see §1.2) |

### Supporting Libraries

| Purpose | Library | Version | Used By |
|---------|---------|---------|---------|
| Password hashing | bcrypt | 5.x | auth-service |
| JWT | jsonwebtoken | 9.x | auth-service, api-gateway |
| HTTP client (backend) | Native `fetch` | Built-in | All services (Node 20 native fetch — zero dependencies, sufficient for inter-service calls and external APIs) |
| HTTP client (frontend) | `@sys-tracker/api-client` | Internal | web |
| Image hosting | Cloudinary | SDK 2.x | user-service (avatars) |
| Logging | Pino | 9.x | All services (extremely fast JSON logger, near-zero overhead, structured logs for easy parsing) |
| Testing | Vitest | 3.x | All packages (Vite-native, fast HMR, ESM-first — aligns with the modern tooling in the stack) |
| Linting | ESLint | 9.x | All packages |
| Formatting | Prettier | 3.x | All packages |

### TypeScript Configuration

Relaxed strict mode for v1.0 — prioritizing development velocity over exhaustive type safety. Can be progressively tightened.

```jsonc
// packages/config/typescript/base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,

    // Relaxed strict settings (tighten in v1.1+)
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

---

## 2. Architecture Overview

### Monorepo Structure

ShinDB is a **Turborepo-powered monorepo** with 6 deployable apps and 6 shared packages. The complete folder structure is documented in [SYS_Tracker.md §4](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/SYS_Tracker.md#L315).

```
sys-tracker/
├── apps/
│   ├── web/                    # Next.js frontend           :3000
│   ├── api-gateway/            # Hono API gateway            :4000
│   ├── auth-service/           # Hono auth microservice      :4001
│   ├── tracker-service/        # Hono media CRUD service     :4002
│   ├── user-service/           # Hono profiles & friends     :4003
│   └── search-service/         # Hono search aggregator      :4004
│
├── packages/
│   ├── types/                  # @sys-tracker/types — shared TypeScript interfaces
│   ├── ui/                     # @sys-tracker/ui — shared React components
│   ├── utils/                  # @sys-tracker/utils — formatters, validators, constants
│   ├── db/                     # @sys-tracker/db — Prisma client & schema
│   ├── config/                 # @sys-tracker/config — ESLint, TS, Tailwind configs
│   └── api-client/             # @sys-tracker/api-client — type-safe frontend API client
│
└── tooling/                    # Scripts, Docker configs
```

### Service Communication Pattern

```
┌─────────────┐
│   Browser    │
└──────┬──────┘
       │ HTTPS
┌──────▼──────┐
│  web (Next) │  SSR + Client-side
│    :3000    │
└──────┬──────┘
       │ HTTP (API calls via @sys-tracker/api-client)
┌──────▼──────┐
│ api-gateway │  JWT validation, routing, CORS, rate limiting
│    :4000    │
└──┬───┬───┬──┘
   │   │   │   HTTP (internal, no auth — gateway pre-validates)
   ▼   ▼   ▼
┌────┐┌────┐┌────┐┌────┐
│auth││trkr││user││srch│
│4001││4002││4003││4004│
└──┬─┘└──┬─┘└──┬─┘└──┬─┘
   │     │     │     │
   ▼     ▼     ▼     ▼
┌──────────┐  ┌─────────┐  ┌──────────────────┐
│PostgreSQL│  │  Redis   │  │ AniList/TMDB/RAWG│
└──────────┘  └─────────┘  └──────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Backend framework** | Hono over Express | 4-10x faster, Web Standards API, native TypeScript, lightweight (~14KB vs Express ~200KB). Perfect for microservices where each service is small and focused |
| **ORM** | Prisma over Drizzle | Prisma Studio for visual DB browsing, mature migration system, better error messages, larger ecosystem of guides/tutorials. Tradeoff: slightly larger bundle, less raw SQL control |
| **Data fetching** | TanStack Query | Dashboard constantly shows stale-while-revalidate data. TanStack Query's cache invalidation, background refetching, and mutation hooks are essential for a data-dense tracking app |
| **CSS** | Tailwind v3 | v3 is the stable, battle-tested version. v4 is too new and has breaking config changes. Tailwind utilities mapped to DESIGN.md tokens via a shared preset |
| **API protocol** | REST (JSON) | Simple, debuggable, well-understood. The app has predictable CRUD operations — no need for GraphQL's query flexibility or tRPC's tight coupling |
| **No real-time** | Polling/manual refresh | For 5-20 users, real-time adds complexity (WebSocket servers, connection management) with minimal benefit. Dashboard data refreshes via TanStack Query's `refetchInterval` |
| **Single database** | All services share PostgreSQL | At 5-20 users, database-per-service is over-engineering. Logical separation via table ownership (see §8) achieves the same boundaries without operational complexity |
| **No CI/CD** | Manual deployments | For v1.0, manual deploys are acceptable. CI/CD can be added in v1.1 via GitHub Actions |

---

## 3. Frontend Specification

### 3.1 Next.js Configuration

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // AniList cover images
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: 'img.anili.st' },
      // TMDB poster images
      { protocol: 'https', hostname: 'image.tmdb.org' },
      // RAWG game images
      { protocol: 'https', hostname: 'media.rawg.io' },
      // Cloudinary (avatar uploads)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  transpilePackages: [
    '@sys-tracker/ui',
    '@sys-tracker/utils',
    '@sys-tracker/types',
    '@sys-tracker/api-client',
  ],
};

export default nextConfig;
```

### 3.2 Tailwind Configuration

Tailwind v3 is configured with a shared preset that maps DESIGN.md tokens:

```javascript
// packages/config/tailwind/preset.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Core Palette
        bg: {
          primary: '#0a0a0f',
          secondary: '#111118',
          tertiary: '#1a1a24',
          elevated: '#16161e',
        },
        border: {
          default: '#2a2a3a',
          subtle: '#1e1e2e',
          focus: '#8b5cf6',
        },
        text: {
          primary: '#e8e8f0',
          secondary: '#8888a0',
          muted: '#555566',
          accent: '#a78bfa',
        },
        // Media Type Accents
        accent: {
          anime: '#8b5cf6',
          manga: '#f97316',
          games: '#10b981',
          movies: '#06b6d4',
          series: '#06b6d4',
        },
        // Status Colors
        status: {
          watching: '#22c55e',
          completed: '#3b82f6',
          plan: '#6b7280',
          'on-hold': '#eab308',
          dropped: '#ef4444',
        },
        // Functional
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#eab308',
        info: '#3b82f6',
        session: '#ef4444',
        lavender: '#a78bfa',
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", 'monospace'],
        sans: ["'Inter'", "'Outfit'", 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'navbar': '52px',
        'content-max': '1280px',
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.3)',
        elevated: '0 4px 12px rgba(0, 0, 0, 0.4)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-green': '0 0 12px rgba(34, 197, 94, 0.2)',
        'glow-red': '0 0 12px rgba(239, 68, 68, 0.2)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      aspectRatio: {
        poster: '2 / 3',
      },
      zIndex: {
        card: '10',
        navbar: '100',
        'modal-backdrop': '500',
        modal: '510',
        toast: '600',
        tooltip: '700',
      },
    },
  },
};
```

### 3.3 Routing Structure (App Router)

```
src/app/
├── layout.tsx                 # Root layout (providers, fonts, metadata)
├── page.tsx                   # Landing / redirect to dashboard
├── globals.css                # Tailwind directives + custom keyframes
│
├── (auth)/                    # Auth route group (no navbar)
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (dashboard)/               # Protected routes (navbar + layout)
│   ├── layout.tsx
│   ├── page.tsx               # Dashboard overview
│   ├── anime/page.tsx
│   ├── manga/page.tsx
│   ├── movies/page.tsx
│   ├── series/page.tsx
│   ├── games/page.tsx
│   ├── media/[type]/[id]/page.tsx   # Media detail
│   ├── friends/
│   │   ├── page.tsx                 # Friends list
│   │   └── [username]/page.tsx      # Friend's profile
│   ├── profile/page.tsx
│   └── settings/page.tsx
│
└── not-found.tsx
```

### 3.4 Client-Side State Management

| State Type | Solution | Scope |
|-----------|---------|-------|
| **Server state** (API data) | TanStack Query | Media entries, stats, user profiles, search results |
| **Auth state** | React Context (`AuthProvider`) | Current user, tokens, login/logout |
| **UI state** | React `useState` / `useReducer` | Modals, filters, sort order, search input |
| **Form state** | React Hook Form + Zod resolvers | Login, register, create/edit entry, profile settings |

### 3.5 TanStack Query Configuration

```typescript
// apps/web/src/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutes before data is considered stale
      gcTime: 1000 * 60 * 30,          // 30 minutes garbage collection
      refetchOnWindowFocus: true,       // Refresh when user returns to tab
      retry: 2,                         // Retry failed requests twice
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 3.6 Query Key Convention

```typescript
// Consistent query key structure for cache management
const queryKeys = {
  // Media entries
  entries: {
    all: ['entries'] as const,
    list: (type: MediaType, filters?: FilterParams) =>
      ['entries', type, filters] as const,
    detail: (id: string) => ['entries', id] as const,
    favorites: (type?: MediaType) => ['entries', 'favorites', type] as const,
  },
  // Stats
  stats: {
    all: ['stats'] as const,
    dashboard: ['stats', 'dashboard'] as const,
    byType: (type: MediaType) => ['stats', type] as const,
  },
  // Users
  users: {
    me: ['users', 'me'] as const,
    profile: (username: string) => ['users', username] as const,
  },
  // Friends
  friends: {
    all: ['friends'] as const,
    requests: ['friends', 'requests'] as const,
  },
  // Search
  search: (query: string, type?: MediaType) =>
    ['search', query, type] as const,
};
```

### 3.7 Media Cover Images

All external cover images rendered via `next/image` with:

```typescript
<Image
  src={entry.coverImage}
  alt={entry.title}
  width={200}
  height={300}
  className="aspect-poster object-cover rounded-md"
  loading="lazy"        // Intersection-observer-based lazy loading
  placeholder="blur"    // Shimmer placeholder during load
  blurDataURL={SHIMMER_PLACEHOLDER}  // Base64 dark shimmer
/>
```

**External domain whitelist**: `s4.anilist.co`, `image.tmdb.org`, `media.rawg.io`, `res.cloudinary.com`

### 3.8 Media List Loading Strategy

Large collections (200+ entries per type) use a progressive loading approach:

```
1. Initial Load    → Fetch first 50 entries (server-side or first client request)
2. Scroll Trigger  → IntersectionObserver loads next 50 entries batch
3. Full Dataset    → After all entries loaded, switch to client-side filter/sort
4. Render Perf     → react-window virtualizes the grid (only renders visible cards)
```

**Libraries**:
- `react-window` — virtualized grid rendering for 200+ items
- `react-intersection-observer` — scroll-triggered batch loading

---

## 4. Backend Specification

### 4.1 Hono Service Template

Every backend service follows the same structural template:

```typescript
// apps/{service-name}/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { pinoLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', pinoLogger());

// Health check (used by gateway for service discovery)
app.get('/health', (c) => c.json({ status: 'ok', service: 'SERVICE_NAME', uptime: process.uptime() }));

// Routes
app.route('/', routes);

// Global error handler
app.onError(errorHandler);

export default {
  port: Number(process.env.PORT) || 400X,
  fetch: app.fetch,
};
```

### 4.2 Service Responsibilities

| Service | Port | Tables Owned | External Dependencies |
|---------|------|-------------|----------------------|
| `api-gateway` | 4000 | None | All 4 services (HTTP proxy) |
| `auth-service` | 4001 | `users` (credentials) | PostgreSQL, Redis |
| `tracker-service` | 4002 | `media_entries`, `activity_log` | PostgreSQL |
| `user-service` | 4003 | `friendships` | PostgreSQL, Cloudinary |
| `search-service` | 4004 | None | Redis, AniList, TMDB, RAWG |

### 4.3 Request/Response Contracts

All backend services return responses in a consistent envelope:

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Paginated success response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Error response
interface ErrorResponse {
  success: false;
  error: {
    code: string;         // Machine-readable: "VALIDATION_ERROR", "NOT_FOUND", etc.
    message: string;      // Human-readable description
    details?: Record<string, string[]>;  // Field-level validation errors
  };
}
```

### 4.4 Service-Level Middleware Stack

Each service applies middleware in this order:

```
Request
  │
  ├── 1. CORS (hono/cors)
  ├── 2. Request logging (Pino)
  ├── 3. Body parsing (automatic in Hono)
  ├── 4. Route matching
  ├── 5. Zod schema validation (per-route)
  ├── 6. Controller logic
  ├── 7. Response serialization
  │
  └── Error handler (catches all thrown errors → ErrorResponse)
```

### 4.5 Zod Validation Pattern

```typescript
// apps/tracker-service/src/schemas/entry.schema.ts
import { z } from 'zod';

export const createEntrySchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(['anime', 'manga', 'movie', 'series', 'game']),
  status: z.enum([
    'watching', 'reading', 'playing',
    'completed', 'on_hold', 'dropped', 'plan_to_consume',
  ]),
  coverImage: z.string().url().optional().default(''),
  releaseYear: z.number().int().min(1900).max(2100).nullable().optional(),
  genres: z.array(z.string()).optional().default([]),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  progressCurrent: z.number().int().min(0).optional().default(0),
  progressTotal: z.number().int().min(0).nullable().optional(),
  progressUnit: z.enum(['ep', 'ch', 'hrs', 'mins']).optional().default('ep'),
  notes: z.string().max(2000).optional().default(''),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  externalId: z.string().optional(),
  externalSource: z.enum(['anilist', 'tmdb', 'rawg']).optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export const filterParamsSchema = z.object({
  type: z.enum(['anime', 'manga', 'movie', 'series', 'game']).optional(),
  status: z.enum([
    'watching', 'reading', 'playing',
    'completed', 'on_hold', 'dropped', 'plan_to_consume',
  ]).optional(),
  isFavorite: z.boolean().optional(),
  tag: z.string().optional(),
  sort: z.enum(['title', 'rating', 'createdAt', 'progress', 'releaseYear']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
});
```

### 4.6 Validation Middleware

```typescript
// Reusable Zod validation middleware for Hono
import { z, ZodSchema } from 'zod';
import type { Context, Next } from 'hono';

export const validate = <T extends ZodSchema>(schema: T, source: 'body' | 'query' = 'body') => {
  return async (c: Context, next: Next) => {
    const data = source === 'body' ? await c.req.json() : c.req.query();
    const result = schema.safeParse(data);

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: result.error.flatten().fieldErrors,
        },
      }, 400);
    }

    c.set('validatedData', result.data);
    await next();
  };
};
```

---

## 5. API Gateway Design

### 5.1 Gateway Responsibilities

The API gateway (`apps/api-gateway`) is the single entry point for all frontend requests. It handles:

| Responsibility | Implementation |
|---------------|----------------|
| **Request routing** | Path-based routing to downstream services |
| **JWT authentication** | Validates JWT on protected routes, attaches `userId` to forwarded headers |
| **CORS** | Configurable allowed origins |
| **Request logging** | Logs method, path, status, duration for all requests |
| **Error normalization** | Converts service errors to consistent `ErrorResponse` format |
| **Health aggregation** | `/health` endpoint checks all downstream services |

### 5.2 Routing Configuration

```typescript
// apps/api-gateway/src/config/services.ts
export const serviceConfig = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    prefix: '/auth',
    healthPath: '/health',
  },
  tracker: {
    url: process.env.TRACKER_SERVICE_URL || 'http://localhost:4002',
    prefix: '/media',
    healthPath: '/health',
  },
  user: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:4003',
    prefix: '/users',
    healthPath: '/health',
  },
  search: {
    url: process.env.SEARCH_SERVICE_URL || 'http://localhost:4004',
    prefix: '/search',
    healthPath: '/health',
  },
};
```

### 5.3 JWT Middleware (Gateway-Level)

```typescript
// apps/api-gateway/src/middleware/authenticate.ts
import { verify } from 'jsonwebtoken';
import type { Context, Next } from 'hono';

export const authenticate = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    }, 401);
  }

  try {
    const token = authHeader.slice(7);
    const payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Attach user info to forwarded headers
    c.req.raw.headers.set('X-User-Id', payload.sub);
    c.req.raw.headers.set('X-Username', payload.username);

    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Authentication token is invalid or expired' },
    }, 401);
  }
};
```

### 5.4 Request Proxying Pattern

```typescript
// Gateway proxies requests to downstream services
// It strips the prefix and forwards the rest of the path
//
// Frontend:  POST /media/entries      → tracker-service:  POST /entries
// Frontend:  GET  /users/friends      → user-service:     GET  /friends
// Frontend:  GET  /search?q=steins    → search-service:   GET  /search?q=steins
```

---

## 6. API Endpoint Reference

### 6.1 Auth Service (`/auth/*`)

| Method | Gateway Path | Service Path | Auth | Request Body | Response |
|--------|-------------|-------------|------|-------------|----------|
| `POST` | `/auth/register` | `/register` | ❌ | `{ username, email, password, displayName }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/login` | `/login` | ❌ | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/login/google` | `/login/google` | ❌ | `{ code }` (OAuth authorization code) | `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/login/discord` | `/login/discord` | ❌ | `{ code }` (OAuth authorization code) | `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/logout` | `/logout` | ✅ | None | `{ message: "Logged out" }` |
| `POST` | `/auth/refresh` | `/refresh` | ❌ | `{ refreshToken }` (or from httpOnly cookie) | `{ accessToken, refreshToken }` |
| `GET` | `/auth/me` | `/me` | ✅ | None | `{ user }` |
| `PUT` | `/auth/password` | `/password` | ✅ | `{ currentPassword, newPassword }` | `{ message }` |

### 6.2 Tracker Service (`/media/*`)

| Method | Gateway Path | Service Path | Auth | Description |
|--------|-------------|-------------|------|-------------|
| `GET` | `/media/entries` | `/entries` | ✅ | List entries with filters (query params: type, status, sort, order, page, pageSize, search, tag, isFavorite) |
| `GET` | `/media/entries/:id` | `/entries/:id` | ✅ | Get single entry by ID |
| `POST` | `/media/entries` | `/entries` | ✅ | Create a new media entry |
| `PUT` | `/media/entries/:id` | `/entries/:id` | ✅ | Update an existing entry (partial update) |
| `DELETE` | `/media/entries/:id` | `/entries/:id` | ✅ | Delete an entry |
| `PATCH` | `/media/entries/:id/progress` | `/entries/:id/progress` | ✅ | Increment or set progress (`{ action: "increment" | "set", value?: number }`) |
| `GET` | `/media/favorites` | `/entries/favorites` | ✅ | Get all favorite entries (optional type filter) |
| `PATCH` | `/media/entries/:id/favorite` | `/entries/:id/favorite` | ✅ | Toggle favorite status |
| `GET` | `/media/stats` | `/stats` | ✅ | Aggregated stats (total, per-type, status breakdown, mean scores) |
| `GET` | `/media/stats/:type` | `/stats/:type` | ✅ | Stats for a specific media type |
| `GET` | `/media/recent` | `/recent` | ✅ | Recently completed + currently active entries |
| `GET` | `/media/export` | `/export` | ✅ | Export all entries as JSON |

#### Entry List Query Parameters

```
GET /media/entries?type=anime&status=watching&sort=rating&order=desc&page=1&pageSize=50&search=steins
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | enum | — | Filter by media type |
| `status` | enum | — | Filter by tracking status |
| `sort` | enum | `createdAt` | Sort field |
| `order` | `asc`/`desc` | `desc` | Sort direction |
| `page` | int | `1` | Page number |
| `pageSize` | int | `50` | Items per page (max 100) |
| `search` | string | — | Text search on title |
| `tag` | string | — | Filter by tag |
| `isFavorite` | boolean | — | Filter favorites only |

### 6.3 User Service (`/users/*`)

| Method | Gateway Path | Service Path | Auth | Description |
|--------|-------------|-------------|------|-------------|
| `GET` | `/users/profile` | `/profile` | ✅ | Get own profile |
| `GET` | `/users/profile/:username` | `/profile/:username` | ✅ | Get another user's profile (must be friends) |
| `PUT` | `/users/profile` | `/profile` | ✅ | Update profile (displayName, bio, avatarUrl) |
| `POST` | `/users/profile/avatar` | `/profile/avatar` | ✅ | Upload avatar image (multipart/form-data → Cloudinary) |
| `GET` | `/users/friends` | `/friends` | ✅ | List accepted friends |
| `GET` | `/users/friends/requests` | `/friends/requests` | ✅ | List pending friend requests (incoming + outgoing) |
| `POST` | `/users/friends/request` | `/friends/request` | ✅ | Send friend request (`{ username }`) |
| `PUT` | `/users/friends/:id/accept` | `/friends/:id/accept` | ✅ | Accept a friend request |
| `PUT` | `/users/friends/:id/reject` | `/friends/:id/reject` | ✅ | Reject a friend request |
| `DELETE` | `/users/friends/:id` | `/friends/:id` | ✅ | Remove a friend |
| `GET` | `/users/search` | `/search` | ✅ | Search users by username (`?q=...`) |

### 6.4 Search Service (`/search/*`)

| Method | Gateway Path | Service Path | Auth | Description |
|--------|-------------|-------------|------|-------------|
| `GET` | `/search` | `/search` | ✅ | Search external APIs (`?q=...&type=anime&source=anilist`) |

#### Search Query Parameters

```
GET /search?q=steins+gate&type=anime
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | **required** | Search query (min 2 chars) |
| `type` | enum | — | Media type filter (determines which API to query) |
| `page` | int | `1` | Result page |

#### Search Response

```typescript
interface SearchResponse {
  success: true;
  data: SearchResult[];
  source: 'anilist' | 'tmdb' | 'rawg';
  cached: boolean;
  pagination: {
    page: number;
    hasNextPage: boolean;
  };
}
```

### 6.5 Gateway Health & Meta

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | ❌ | Aggregated health check of all services |
| `GET` | `/version` | ❌ | Returns app version (`{ version: "1.0.0" }`) |

---

## 7. Authentication System

### 7.1 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  API Gateway │────▶│ Auth Service  │
│              │     │              │     │              │
│ Stores:      │     │ Validates:   │     │ Issues:      │
│ - accessToken│     │ - JWT on all │     │ - JWT tokens │
│   (memory)   │     │   protected  │     │ - Refresh    │
│ - refreshTkn │     │   routes     │     │   tokens     │
│   (cookie)   │     │              │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                          ┌───────▼───────┐
                                          │  PostgreSQL   │
                                          │  (users)      │
                                          ├───────────────┤
                                          │  Redis        │
                                          │  (blacklist)  │
                                          └───────────────┘
```

### 7.2 JWT Token Structure

```typescript
// Access Token Payload
interface JwtPayload {
  sub: string;          // User UUID
  username: string;     // Username
  email: string;        // Email
  iat: number;          // Issued at (Unix timestamp)
  exp: number;          // Expires at (24h from iat)
  type: 'access';
}

// Refresh Token Payload
interface RefreshPayload {
  sub: string;          // User UUID
  iat: number;
  exp: number;          // 30 days from iat
  type: 'refresh';
  jti: string;          // Unique token ID (for blacklisting)
}
```

### 7.3 Token Lifecycle

| Event | Action |
|-------|--------|
| **Login** | Issue access token (24h) + refresh token (30d, httpOnly cookie) |
| **API Request** | Frontend sends access token in `Authorization: Bearer <token>` header |
| **Token Expired** | Frontend intercepts 401, calls `/auth/refresh` with refresh token |
| **Refresh** | Verify refresh token, issue new access + refresh tokens (rotation) |
| **Logout** | Blacklist refresh token in Redis (TTL = remaining expiry) |
| **Password Change** | Invalidate all refresh tokens for that user |

### 7.4 Password Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password on registration
const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verify password on login
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

### 7.5 OAuth Flow (Google & Discord)

Both OAuth providers follow the standard Authorization Code flow:

```
1. Frontend → Redirect to provider's auth URL
2. User → Grants permission
3. Provider → Redirects back with authorization code
4. Frontend → Sends code to POST /auth/login/{provider}
5. Auth Service → Exchanges code for provider tokens
6. Auth Service → Fetches user profile from provider
7. Auth Service → Find-or-create user in database
8. Auth Service → Issue JWT tokens
9. Frontend → Stores tokens, redirects to dashboard
```

#### OAuth Provider Configuration

| Provider | Auth URL | Token URL | Scopes |
|----------|---------|-----------|--------|
| **Google** | `https://accounts.google.com/o/oauth2/v2/auth` | `https://oauth2.googleapis.com/token` | `openid email profile` |
| **Discord** | `https://discord.com/api/oauth2/authorize` | `https://discord.com/api/oauth2/token` | `identify email` |

#### User Linking

- If a user with the same email already exists (from email registration), link the OAuth account
- If no user exists, create a new user with data from OAuth profile
- Username auto-generated from OAuth display name (with uniqueness check)

### 7.6 Registration Gating

```typescript
// auth-service checks this before allowing registration
if (process.env.ALLOW_REGISTRATION !== 'true') {
  return c.json({
    success: false,
    error: { code: 'REGISTRATION_DISABLED', message: 'Registration is currently closed' },
  }, 403);
}
```

---

## 8. Database Design

### 8.1 Prisma Schema

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───

enum MediaType {
  anime
  manga
  movie
  series
  game
}

enum MediaStatus {
  watching
  reading
  playing
  completed
  on_hold
  dropped
  plan_to_consume
}

enum ProgressUnit {
  ep
  ch
  hrs
  mins
}

enum FriendshipStatus {
  pending
  accepted
  blocked
}

enum AuthProvider {
  email
  google
  discord
}

// ─── MODELS ───

model User {
  id           String   @id @default(uuid())
  username     String   @unique @db.VarChar(30)
  email        String   @unique @db.VarChar(255)
  passwordHash String?  @map("password_hash") @db.VarChar(255)  // Nullable for OAuth-only users
  displayName  String   @map("display_name") @db.VarChar(50)
  avatarUrl    String?  @map("avatar_url")
  bio          String   @default("")
  authProvider AuthProvider @default(email) @map("auth_provider")
  providerId   String?  @map("provider_id")  // OAuth provider's user ID
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  mediaEntries      MediaEntry[]
  activityLogs      ActivityLog[]
  sentRequests      Friendship[] @relation("FriendRequester")
  receivedRequests  Friendship[] @relation("FriendAddressee")

  @@map("users")
}

model MediaEntry {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  title           String      @db.VarChar(300)
  type            MediaType
  status          MediaStatus @default(plan_to_consume)
  coverImage      String      @default("") @map("cover_image")
  releaseYear     Int?        @map("release_year")
  genres          String[]    @default([])
  rating          Int?        // 0-10 integer scale
  progressCurrent Int         @default(0) @map("progress_current")
  progressTotal   Int?        @map("progress_total")
  progressUnit    ProgressUnit @default(ep) @map("progress_unit")
  notes           String      @default("")
  isFavorite      Boolean     @default(false) @map("is_favorite")
  tags            String[]    @default([])
  startDate       DateTime?   @map("start_date") @db.Date
  endDate         DateTime?   @map("end_date") @db.Date
  rewatchCount    Int         @default(0) @map("rewatch_count")
  externalId      String?     @map("external_id") @db.VarChar(100)
  externalSource  String?     @map("external_source") @db.VarChar(20)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityLogs ActivityLog[]

  // Indexes
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([userId, type])
  @@index([userId, status])
  @@index([userId, isFavorite])

  @@map("media_entries")
}

model Friendship {
  id          String           @id @default(uuid())
  requesterId String          @map("requester_id")
  addresseeId String          @map("addressee_id")
  status      FriendshipStatus @default(pending)
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  // Relations
  requester User @relation("FriendRequester", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee User @relation("FriendAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)

  // Prevent duplicate friend requests
  @@unique([requesterId, addresseeId])

  // Indexes
  @@index([requesterId])
  @@index([addresseeId])
  @@index([status])

  @@map("friendships")
}

model ActivityLog {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  mediaEntryId String?  @map("media_entry_id")
  action       String   @db.VarChar(50)  // "added", "updated", "completed", "rated", "dropped", "started"
  metadata     Json?    // { old: {...}, new: {...} } — stores what changed
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  mediaEntry MediaEntry? @relation(fields: [mediaEntryId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([userId])
  @@index([createdAt(sort: Desc)])

  @@map("activity_log")
}
```

### 8.2 Table Ownership

Services only access their own tables. This is enforced at the application level (not DB-level permissions in v1.0):

| Service | Read Access | Write Access |
|---------|------------|--------------|
| `auth-service` | `users` | `users` |
| `tracker-service` | `users.id` (for FK), `media_entries`, `activity_log` | `media_entries`, `activity_log` |
| `user-service` | `users` (profile columns), `friendships` | `users` (profile columns), `friendships` |
| `search-service` | None | None (uses Redis only) |

### 8.3 Key Database Operations

#### Stats Aggregation Query

```sql
-- Dashboard statistics for a user
SELECT
  type,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status IN ('watching', 'reading', 'playing')) as active,
  COUNT(*) FILTER (WHERE status = 'plan_to_consume') as backlog,
  COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold,
  COUNT(*) FILTER (WHERE status = 'dropped') as dropped,
  ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 2) as mean_score,
  SUM(progress_current) as total_progress
FROM media_entries
WHERE user_id = $1
GROUP BY type;
```

### 8.4 Migration Strategy

```bash
# Generate migration from schema changes
pnpm --filter @sys-tracker/db prisma migrate dev --name <migration_name>

# Apply migrations in production
pnpm --filter @sys-tracker/db prisma migrate deploy

# Open Prisma Studio for visual DB browsing
pnpm --filter @sys-tracker/db prisma studio
```

---

## 9. External API Integrations

### 9.1 Provider Interface (Strategy Pattern)

Designed for extensibility — adding new providers (e.g., Jikan for MAL) requires only implementing the interface:

```typescript
// apps/search-service/src/providers/types.ts

interface SearchProvider {
  name: string;
  supportedTypes: MediaType[];
  search(query: string, type: MediaType, page?: number): Promise<SearchResult[]>;
}
```

### 9.2 AniList Provider

```typescript
// apps/search-service/src/providers/anilist.provider.ts

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
  query ($search: String, $type: MediaType, $page: Int) {
    Page(page: $page, perPage: 20) {
      pageInfo { hasNextPage }
      media(search: $search, type: $type, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        coverImage { large }
        startDate { year }
        genres
        episodes          # for anime
        chapters          # for manga
        meanScore
        description
      }
    }
  }
`;

// Maps to: MediaType.anime → AniList MediaType.ANIME
//          MediaType.manga → AniList MediaType.MANGA
```

### 9.3 TMDB Provider

```typescript
// apps/search-service/src/providers/tmdb.provider.ts

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Endpoints:
// Movies: GET /search/movie?query={q}&api_key={key}&page={page}
// Series: GET /search/tv?query={q}&api_key={key}&page={page}

// Cover image URL: TMDB_IMAGE_BASE + poster_path
```

### 9.4 RAWG Provider

```typescript
// apps/search-service/src/providers/rawg.provider.ts

const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Endpoint: GET /games?key={key}&search={q}&page={page}&page_size=20
// Cover image: result.background_image
```

### 9.5 Future Extensibility

To add a fallback API (e.g., Jikan for MAL):

```typescript
// 1. Create new provider implementing SearchProvider interface
// apps/search-service/src/providers/jikan.provider.ts

// 2. Register in provider registry
// apps/search-service/src/providers/registry.ts
const providers: SearchProvider[] = [
  anilistProvider,    // Primary for anime/manga
  jikanProvider,      // Fallback for anime/manga
  tmdbProvider,       // Primary for movies/series
  rawgProvider,       // Primary for games
];

// 3. Search aggregator tries primary first, falls back if error/empty
```

---

## 10. Caching Strategy

### 10.1 Redis Cache Layout

| Key Pattern | TTL | Service | Purpose |
|------------|-----|---------|---------|
| `refresh:{jti}` | Remaining token lifetime | auth-service | Refresh token blacklist (stores blacklisted JTIs) |
| `search:{type}:{query}:{page}` | 1 hour | search-service | External API search results |
| `stats:{userId}` | 5 minutes | tracker-service | Dashboard aggregated statistics |

### 10.2 TanStack Query Cache (Frontend)

| Query Key | Stale Time | GC Time | Refetch On |
|-----------|-----------|---------|------------|
| `entries` (list) | 5 min | 30 min | Window focus, mutation |
| `entries` (detail) | 5 min | 30 min | Window focus |
| `stats` | 5 min | 30 min | Entry mutation |
| `search` | 10 min | 60 min | Never (user-initiated) |
| `users/me` | 30 min | 60 min | Window focus |
| `friends` | 5 min | 30 min | Friend mutation |

### 10.3 Cache Invalidation Rules

| Event | Invalidate |
|-------|-----------|
| Entry created | `entries` list, `stats` |
| Entry updated | `entries` list, `entries` detail, `stats` |
| Entry deleted | `entries` list, `stats` |
| Favorite toggled | `entries` list, `entries` favorites |
| Progress updated | `entries` list, `entries` detail, `stats` |
| Profile updated | `users/me` |
| Friend accepted | `friends` |

---

## 11. Error Handling

### 11.1 Error Response Format

All errors follow the same structure across all services:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 11.2 Error Code Catalog

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body/params failed Zod validation |
| `BAD_REQUEST` | 400 | Malformed request (missing required fields, invalid format) |
| `UNAUTHORIZED` | 401 | Missing or invalid authorization header |
| `TOKEN_EXPIRED` | 401 | JWT access token has expired |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `FORBIDDEN` | 403 | User doesn't have permission for this action |
| `REGISTRATION_DISABLED` | 403 | Registration is currently closed |
| `NOT_FOUND` | 404 | Requested resource doesn't exist |
| `DUPLICATE_ENTRY` | 409 | Username or email already taken |
| `FRIEND_EXISTS` | 409 | Friend request already sent or friendship exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Downstream service is unreachable |
| `EXTERNAL_API_ERROR` | 502 | External API (AniList/TMDB/RAWG) returned an error |

### 11.3 Frontend Error Handling

```typescript
// @sys-tracker/api-client handles errors globally
// 401 → Attempt token refresh → Retry original request
// 401 after refresh → Redirect to login
// 4xx → Show toast with error.message
// 5xx → Show generic "Something went wrong" toast
```

### 11.4 Global Error Handler (Hono)

```typescript
// Shared across all services
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const errorHandler: ErrorHandler = (err, c) => {
  // Log the full error for debugging
  console.error(`[${c.req.method}] ${c.req.path}:`, err);

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: {
        code: err.message || 'HTTP_ERROR',
        message: err.message,
      },
    }, err.status);
  }

  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    }, err.statusCode);
  }

  // Unknown errors
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, 500);
};
```

---

## 12. File Storage

### 12.1 Avatar Uploads (Cloudinary)

| Setting | Value |
|---------|-------|
| **Provider** | Cloudinary |
| **Upload Folder** | `shindb/avatars/{userId}` |
| **Max File Size** | 5MB |
| **Accepted Formats** | JPEG, PNG, WebP, GIF |
| **Transformation** | Auto-crop to 256×256, face detection, quality auto |
| **Delivery** | Cloudinary CDN URL |

### 12.2 Upload Flow

```
1. Frontend    → POST /users/profile/avatar (multipart/form-data)
2. Gateway     → Proxy to user-service
3. User Service → Upload to Cloudinary SDK
4. Cloudinary  → Returns CDN URL
5. User Service → Update user.avatarUrl in PostgreSQL
6. Response    → { avatarUrl: "https://res.cloudinary.com/..." }
```

### 12.3 Cloudinary Configuration

```typescript
// apps/user-service/src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload with transformations
const result = await cloudinary.uploader.upload(filePath, {
  folder: `shindb/avatars/${userId}`,
  transformation: [
    { width: 256, height: 256, crop: 'fill', gravity: 'face' },
    { quality: 'auto', format: 'webp' },
  ],
  overwrite: true,
  unique_filename: false,
  resource_type: 'image',
});
```

### 12.4 Media Cover Images

Cover images are **NOT uploaded**. They are served directly from external API CDNs:
- AniList: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/...`
- TMDB: `https://image.tmdb.org/t/p/w500/...`
- RAWG: `https://media.rawg.io/media/games/...`

The `coverImage` field in `MediaEntry` stores the full URL. `next/image` handles optimization and caching.

---

## 13. Testing Strategy

### 13.1 Framework

**Vitest** is the primary testing framework. Chosen over Jest for:
- Native ESM support (aligns with the modern stack)
- Vite-powered HMR for fast test reruns
- Compatible with Jest's API (easy migration if needed)
- Built-in code coverage via `@vitest/coverage-v8`

### 13.2 Testing Levels

| Level | Scope | Tools | Priority |
|-------|-------|-------|----------|
| **Unit** | Individual functions, utilities, validators | Vitest | 🔴 P0 |
| **Integration** | API endpoint handlers with DB | Vitest + Prisma test utils | 🟡 P1 |
| **E2E** | Full user flows in browser | Deferred to v1.1 | 🟢 P2 |

### 13.3 What to Test (v1.0)

| Package/Service | Tests |
|----------------|-------|
| `@sys-tracker/utils` | All formatter and validator functions |
| `@sys-tracker/types` | Zod schema validation (valid + invalid inputs) |
| `auth-service` | Registration, login, JWT issuance, password hashing |
| `tracker-service` | CRUD operations, progress updates, stats aggregation |
| `user-service` | Friend request lifecycle, profile updates |
| `search-service` | Provider normalization, cache hit/miss |

### 13.4 Test Configuration

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', '*.config.*'],
    },
  },
});
```

---

## 14. Logging & Monitoring

### 14.1 Logging Framework

**Pino** — chosen for its near-zero overhead (~30% faster than Winston), JSON-structured output, and small footprint. Ideal for microservices where every millisecond counts.

### 14.2 Log Format

```jsonc
{
  "level": 30,           // INFO
  "time": 1717100000,
  "service": "tracker-service",
  "msg": "Entry created",
  "userId": "uuid-xxx",
  "entryId": "uuid-yyy",
  "mediaType": "anime",
  "duration": 45          // ms
}
```

### 14.3 Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| `fatal` | 60 | Unrecoverable errors, service crash |
| `error` | 50 | Operation failed (DB error, external API error) |
| `warn` | 40 | Non-critical issues (rate limit approaching, cache miss) |
| `info` | 30 | Standard operations (entry created, user logged in) |
| `debug` | 20 | Detailed diagnostic (query params, response bodies) |
| `trace` | 10 | Very verbose (Prisma queries, full request/response) |

### 14.4 Request Logging Middleware

```typescript
// All services log every request
// Logged: method, path, status, duration, userId (if authenticated)
// NOT logged: request bodies (may contain passwords), response bodies (too verbose)
```

### 14.5 Monitoring (v1.0)

- **Health endpoints**: Each service exposes `GET /health` returning `{ status: "ok", uptime: N }`
- **Gateway aggregation**: `GET /health` on the gateway checks all downstream services
- **No external monitoring** in v1.0 — rely on Docker logs / console output
- Future: Add Prometheus metrics + Grafana dashboard in v1.1

---

## 15. Development Environment

### 15.1 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Runtime |
| pnpm | 9.x | Package manager |
| Docker | 24+ | Local Postgres + Redis |
| Docker Compose | 2.x | Container orchestration |
| Git | 2.40+ | Version control |

### 15.2 Local Infrastructure (Docker Compose)

```yaml
# docker-compose.yml (development)
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: shindb_dev
      POSTGRES_USER: shindb
      POSTGRES_PASSWORD: shindb_dev_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru

volumes:
  pgdata:
```

### 15.3 First-Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd sys-tracker

# 2. Install dependencies
pnpm install

# 3. Start infrastructure
docker compose up -d

# 4. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 5. Generate Prisma client
pnpm --filter @sys-tracker/db prisma generate

# 6. Run database migrations
pnpm --filter @sys-tracker/db prisma migrate dev

# 7. Seed database (optional)
pnpm --filter @sys-tracker/db prisma db seed

# 8. Start all services
pnpm dev
```

### 15.4 Development Commands

```bash
# Start everything (Turborepo parallel)
pnpm dev

# Start specific service + dependencies
pnpm dev --filter=tracker-service...

# Build all
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test

# Test with coverage
pnpm test -- --coverage

# Database
pnpm --filter @sys-tracker/db prisma studio     # Visual DB browser
pnpm --filter @sys-tracker/db prisma migrate dev # Create migration
pnpm --filter @sys-tracker/db prisma db push     # Push schema changes (dev)
```

---

## 16. Deployment Configuration

### 16.1 Option A: Cloud Platform

| Component | Platform | Config |
|-----------|----------|--------|
| `web` | Vercel | Auto-deploys from `apps/web/`, framework preset: Next.js |
| `api-gateway` | Railway | Dockerfile, port 4000 |
| `auth-service` | Railway | Dockerfile, port 4001 |
| `tracker-service` | Railway | Dockerfile, port 4002 |
| `user-service` | Railway | Dockerfile, port 4003 |
| `search-service` | Railway | Dockerfile, port 4004 |
| PostgreSQL | Neon / Supabase | Managed, free tier |
| Redis | Upstash | Serverless, free tier |

### 16.2 Option B: Self-Hosted (Docker Compose)

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: shindb
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  api-gateway:
    build: { context: ., dockerfile: apps/api-gateway/Dockerfile }
    restart: unless-stopped
    ports: ["4000:4000"]
    depends_on: [postgres, redis]
    env_file: .env

  auth-service:
    build: { context: ., dockerfile: apps/auth-service/Dockerfile }
    restart: unless-stopped
    depends_on: [postgres, redis]
    env_file: .env

  tracker-service:
    build: { context: ., dockerfile: apps/tracker-service/Dockerfile }
    restart: unless-stopped
    depends_on: [postgres]
    env_file: .env

  user-service:
    build: { context: ., dockerfile: apps/user-service/Dockerfile }
    restart: unless-stopped
    depends_on: [postgres]
    env_file: .env

  search-service:
    build: { context: ., dockerfile: apps/search-service/Dockerfile }
    restart: unless-stopped
    depends_on: [redis]
    env_file: .env

  web:
    build: { context: ., dockerfile: apps/web/Dockerfile }
    restart: unless-stopped
    ports: ["3000:3000"]
    depends_on: [api-gateway]
    env_file: .env

volumes:
  pgdata:
```

### 16.3 Service Dockerfile Template

```dockerfile
# Multi-stage build for Hono services
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/SERVICE_NAME/package.json ./apps/SERVICE_NAME/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter=SERVICE_NAME...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter=SERVICE_NAME... build

FROM base AS runner
WORKDIR /app
COPY --from=build /app/apps/SERVICE_NAME/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 400X
CMD ["node", "dist/index.js"]
```

---

## 17. Environment Variables

### Complete Variable Reference

```bash
# ─── Database ───
DATABASE_URL="postgresql://shindb:password@localhost:5432/shindb_dev"

# ─── Redis ───
REDIS_URL="redis://localhost:6379"

# ─── JWT ───
JWT_SECRET="your-256-bit-secret-key-here"
JWT_ACCESS_EXPIRY="24h"
JWT_REFRESH_EXPIRY="30d"

# ─── OAuth: Google ───
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback/google"

# ─── OAuth: Discord ───
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
DISCORD_REDIRECT_URI="http://localhost:3000/auth/callback/discord"

# ─── External APIs ───
TMDB_API_KEY="your-tmdb-api-key"
RAWG_API_KEY="your-rawg-api-key"
# AniList: No API key required (public GraphQL API)

# ─── Cloudinary ───
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ─── Service URLs (used by api-gateway) ───
AUTH_SERVICE_URL="http://localhost:4001"
TRACKER_SERVICE_URL="http://localhost:4002"
USER_SERVICE_URL="http://localhost:4003"
SEARCH_SERVICE_URL="http://localhost:4004"

# ─── Frontend ───
NEXT_PUBLIC_API_URL="http://localhost:4000"

# ─── Feature Flags ───
ALLOW_REGISTRATION="true"

# ─── Environment ───
NODE_ENV="development"
```

---

## 18. Security Considerations

### 18.1 Authentication Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 salt rounds |
| JWT signing | HS256 with 256-bit secret |
| Token rotation | Refresh tokens are rotated on each use |
| Token blacklisting | Revoked refresh tokens stored in Redis |
| CORS | Restrictive origin whitelist (only the web app domain) |

### 18.2 Input Validation

| Layer | Protection |
|-------|-----------|
| Frontend | React Hook Form + Zod (client-side validation) |
| Gateway | Basic request format validation |
| Services | Zod schema validation on all inputs |
| Database | Prisma type enforcement + constraints |

### 18.3 Data Access Control

| Rule | Implementation |
|------|---------------|
| Users can only access their own entries | `WHERE user_id = $currentUserId` on all tracker queries |
| Friend profiles only visible to accepted friends | Check friendship status before returning profile data |
| Gateway forwards userId via headers | `X-User-Id` header set by gateway after JWT verification |
| Services trust the gateway | No re-verification of JWT in individual services |

### 18.4 What's NOT in v1.0 (Acceptable for Trusted Circle)

| Security Feature | Status | Notes |
|-----------------|--------|-------|
| Rate limiting | ❌ Deferred | Trusted small circle, no public access |
| CSRF protection | ❌ Deferred | JWT in Authorization header (not cookies) mitigates CSRF |
| Email verification | ❌ Deferred | Registration is invite-only |
| Account lockout | ❌ Deferred | Small user base |
| SQL injection | ✅ Protected | Prisma uses parameterized queries |
| XSS | ✅ Protected | React auto-escapes, no `dangerouslySetInnerHTML` |

---

> **This TechSpec is the engineering companion to the [PRD](file:///d:/02_CODE/04_WORKING/ShinDB/src/notes/PRD.md). It should be updated whenever architectural decisions change, and serves as the reference for all implementation work.**
