# ShinDB — Production Launch Runbook 🚀

> **Version**: 1.0.0  
> **Status**: Ready for Production Launch  
> **Target Release**: `v1.0.0 STABLE`  

---

## 1. Pre-Launch Verification Checklist

Before opening the platform for operators, verify each item:

- [ ] **Infrastructure Health**:
  - Container status: `docker compose -f docker-compose.prod.yml ps` all in `healthy` state.
  - Health check: `curl -s https://<DOMAIN>/api/health` returns status `200 OK` with database `healthy`.
- [ ] **Database Integrity**:
  - Prisma migrations applied: `npx prisma migrate status` reports schema in sync.
  - Master catalog populated with 365 baseline media records across anime, manga, games, movies, and series.
  - Base operator `SENPAI_09` seeded with initial personal logs intact.
- [ ] **API Keys & Integrations**:
  - TMDB API key active and verified for movie/series metadata.
  - RAWG API key active and verified for game discovery.
  - AniList GraphQL public queries verified for anime/manga.
- [ ] **Network & Security**:
  - SSL/TLS certificate active (HTTPS valid).
  - Production `NEXT_PUBLIC_APP_URL` matches public domain.
  - Cookies configured with `secure: true` in production environment.

---

## 2. Launch Execution Runbook

### Step 1: Pre-Flight Smoke Test
Run the automated smoke test suite to validate all system modules under simulated production conditions:
```bash
npx tsx scripts/test-phase5-smoke.ts
```
Ensure all tests pass with 0 errors.

### Step 2: Open Operator Enrollment Window
To allow initial trusted operators to create their accounts:
1. Ensure `ALLOW_REGISTRATION="true"` in `.env.production`.
2. Reload or deploy the application:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
3. Have operators register via `https://<DOMAIN>/register`.
4. Verify new operators can browse the master catalog and 1-click `[+ ADD TO MY LOGS]`.

### Step 3: Seal System (Invite-Only Lockdown)
Once all designated operators have registered:
1. Update `.env.production`:
   ```bash
   ALLOW_REGISTRATION="false"
   ```
2. Apply changes:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
3. Test that registration returns `403 Forbidden` (`REGISTRATION_DISABLED`).
4. Existing operators can continue to log in via `/login` and manage their trackers.

---

## 3. Post-Launch Operational Monitoring

| Component | Check | Expected Metric | Action on Failure |
|-----------|-------|-----------------|-------------------|
| Web Health | `GET /api/health` | HTTP 200, db latency < 10ms | Check container logs: `docker compose logs -f app` |
| MySQL DB | `mysqladmin ping` | mysqld is alive | Check disk space: `df -h`, restart MySQL container |
| Auth Flow | Session refresh | Cookies set with 24h/30d | Check token clock skew, secret matching |
| Airing Sync | `POST /api/track/sync` | Syncs unannounced counts | Check external rate limits (Kitsu, TVmaze) |

---

## 4. Rollback & Disaster Recovery Runbook

If a critical failure occurs during launch:
1. **Restore Previous Container Image**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   # Rollback git commit
   git checkout <PREVIOUS_STABLE_TAG>
   docker compose -f docker-compose.prod.yml up -d --build
   ```
2. **Restore Database from Backup**:
   ```bash
   gunzip < /backups/shindb_backup.sql.gz | docker compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p"<ROOT_PASS>" shindb
   ```
3. **Verify Health**:
   ```bash
   curl -I https://<DOMAIN>/api/health
   ```
