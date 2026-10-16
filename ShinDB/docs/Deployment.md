# ShinDB — Production Deployment Guide

> **Version**: 1.0.0  
> **Status**: Verified for Production  
> **Architecture**: Next.js 16 App Router (Standalone) + Prisma ORM + MySQL 8.0  

---

## 1. Overview & Architecture

ShinDB is architected as an optimized, high-performance full-stack application leveraging Next.js 16 App Router with standalone output and Prisma ORM connecting to a MySQL database.

```
                           ┌─────────────────────────┐
                           │   HTTPS / Reverse Proxy │ (Nginx / Caddy / Cloudflare)
                           │   (Port 443 / 80)       │
                           └────────────┬────────────┘
                                        │ Forward to :3000
                                        ▼
                           ┌─────────────────────────┐
                           │   ShinDB Web Container  │ (Next.js 16 Standalone)
                           │   /api/health           │
                           │   /api/track, /auth, etc│
                           └────────────┬────────────┘
                                        │ MySQL Wire Protocol
                                        ▼
                           ┌─────────────────────────┐
                           │   MySQL 8.0 Database    │
                           │   Volume: shindb_mysql  │
                           └─────────────────────────┘
```

---

## 2. Option A: Self-Hosted Deployment (Docker Compose)

The recommended self-hosted method runs ShinDB and MySQL as coordinated containers with health checks and persistent volume storage.

### Prerequisites

- Linux Server (Ubuntu 22.04 LTS or Debian 12 recommended)
- Docker Engine 24.0+ & Docker Compose v2+
- Domain name pointed to server IP (for SSL)

### Step-by-Step Setup

1. **Clone Repository & Prepare Environment**:
   ```bash
   git clone <REPO_URL> shindb
   cd shindb
   cp .env.production.example .env.production
   ```

2. **Configure Production Variables**:
   Edit `.env.production` with secure database passwords, your public URL, and optional provider keys:
   ```bash
   MYSQL_USER="shindb_admin"
   MYSQL_PASSWORD="<STRONG_PASSWORD>"
   MYSQL_ROOT_PASSWORD="<STRONG_ROOT_PASSWORD>"
   NEXT_PUBLIC_APP_URL="https://shindb.yourdomain.com"
   ALLOW_REGISTRATION="true" # Set to 'false' post-launch for invite-only mode
   ```

3. **Build & Start Containers**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run Prisma Migrations & Seed Initial Catalog**:
   ```bash
   docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
   docker compose -f docker-compose.prod.yml exec app npx prisma db seed
   ```

5. **Verify System Health**:
   ```bash
   curl -I http://localhost:3000/api/health
   # Expected: HTTP/1.1 200 OK
   ```

---

## 3. Reverse Proxy & SSL Configuration

### Using Caddy (Recommended for Simplicity)

Create `/etc/caddy/Caddyfile`:
```caddy
shindb.yourdomain.com {
    reverse_proxy localhost:3000
}
```
Reload Caddy: `sudo systemctl reload caddy`. Automatic HTTPS via Let's Encrypt will be provisioned.

### Using Nginx

```nginx
server {
    server_name shindb.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Run `sudo certbot --nginx -d shindb.yourdomain.com` for SSL certificates.

---

## 4. Option B: Cloud Platform Deployment (Vercel / Railway)

### Vercel + Managed Database (Aiven / PlanetScale / Railway MySQL)

1. **Database Provisioning**:
   - Provision a MySQL 8.0 instance on Aiven, Railway, or PlanetScale.
   - Note down the connection string: `mysql://<user>:<password>@<host>:<port>/<database>?sslaccept=strict`.

2. **Deploy to Vercel**:
   - Push repository to GitHub/GitLab.
   - Import project into Vercel.
   - Set environment variables in Vercel Project Settings:
     - `DATABASE_URL`: Your managed MySQL connection string
     - `NEXT_PUBLIC_APP_URL`: Your Vercel domain
     - `ALLOW_REGISTRATION`: `true`
     - `TMDB_API_KEY`: TMDB API key
     - `RAWG_API_KEY`: RAWG API key

3. **Run Migrations on Remote DB**:
   From your local environment with `.env` configured to the remote connection:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 5. Operations, Maintenance & Monitoring

### Health Monitoring Endpoint
- **URL**: `GET /api/health`
- **Output**:
  ```json
  {
    "status": "ok",
    "service": "shindb",
    "version": "1.0.0",
    "timestamp": "2026-10-16T01:30:00.000Z",
    "uptime": 3600,
    "database": {
      "status": "healthy",
      "latencyMs": 2
    },
    "registrationOpen": true,
    "responseTimeMs": 4
  }
  ```

### Database Backups
Automate daily backups with `crontab`:
```bash
0 3 * * * docker compose -f /path/to/shindb/docker-compose.prod.yml exec mysql mysqldump -u root -p"<ROOT_PASS>" shindb | gzip > /backups/shindb_$(date +\%F).sql.gz
```

### Application Upgrades
To deploy updates with minimal downtime:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d --no-deps app
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```
