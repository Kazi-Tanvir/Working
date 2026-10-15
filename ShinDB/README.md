# ShinDB // Obsidian-Style Universal Media Tracker

> **Cyber-Neobrutalist unified media tracking console** for Anime, Manga, Video Games, Movies, and TV Series with multi-tenant isolation, real-time external discovery (AniList, TMDB, RAWG, TVmaze), and multi-season tracking.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ recommended
- **MySQL Server**: v8.0+ running locally or remotely

---

### 2. Configure Environment (`.env`)
Create or edit your `.env` file in the project root:

```env
# Database Connection (MySQL)
DATABASE_URL="mysql://root:password@localhost:3306/shindb"

# Optional External API Keys (Enables live external search)
TMDB_API_KEY="your_tmdb_api_key_here"      # For Movies & TV Series: https://www.themoviedb.org/settings/api
RAWG_API_KEY="your_rawg_api_key_here"      # For Video Games: https://rawg.io/apidocs
# AniList GraphQL works out-of-the-box for Anime & Manga without an API key!

# Google OAuth Authentication (Optional)
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### 3. Install & Generate Prisma Client

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client (no migration needed if database already exists)
npx prisma generate
```

> **Note**: Database schema is already defined in `prisma/schema.prisma`. If you ever need to inspect or browse your database tables in the browser, run:
> ```bash
> npm run db:studio
> ```

---

### 4. Run the Application

#### Development Mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build:
```bash
# Build the application
npm run build

# Start the production server
npm start
```

---

## 🛠️ Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server (with Turbopack/Webpack) |
| `npm run build` | Generates Prisma client and creates production build |
| `npm start` | Starts Next.js production server |
| `npx prisma generate` | Regenerates Prisma Client types from `prisma/schema.prisma` |
| `npm run db:studio` | Launches Prisma Studio GUI at `http://localhost:5555` to browse data |
| `npm run lint` | Runs ESLint checks |

---

## 👤 User Accounts & Privacy

- **Standard Registration & Login**: Operators can enroll with email/username and password.
- **Google Authentication**:
  - Connect with Google OAuth directly from the login/register terminal.
  - **First-Time Google Sign-in**: When a user logs in via Google for the first time, ShinDB prompts them to claim their custom operator username at `/auth/choose-username`.
  - Discord authentication is scheduled for a future update (`[Soon]`).
- **Data Isolation**: Each registered user has their own private, isolated library (`user_media_entries`).
- Titles added by one account do not restrict or lock other accounts.
- Use the **Search Bar** or **+ New** button on any category page (`/anime`, `/manga`, `/games`, `/movies`, `/series`) to search and track titles.
