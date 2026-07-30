# RoPhim — Release Notes

## v1.1.0

**Scope of this release:** Five new modules (Upload, Dashboard, Verify Email, Notifications, Episode Management) that close out all five "Backend Blockers" flagged in the prior release's audit, plus a full release-readiness audit pass (source hygiene, security, database, frontend, backend code quality, regression, pipeline).

---

## Features

### Real File Upload (Phase 31)
`POST /uploads/image` (multipart, admin-only, `uploads:create` permission) accepts jpeg/png/webp up to 5MB (10MB hard Multer safety cap), stores via memory buffer (nothing touches disk until validated), returns a public URL under `PUBLIC_BASE_URL/uploads/...`. `DELETE /uploads` removes a file by URL, with path-containment validation against traversal. Additive to the existing poster/thumbnail/avatar URL-text inputs, not a replacement — admins can still paste an external URL instead of uploading (`ImageUpload.tsx`).

### Admin Dashboard (Phase 32)
`GET /dashboard/{overview,charts,top-lists,recent-activity}` — all aggregation-based (single `Promise.all` of independent `countDocuments`/`aggregate` calls, or one `aggregate()` with `$group`+`$lookup`; no per-item N+1 queries anywhere). `AdminDashboardView.tsx` renders 4 independently-loading/erroring widgets with their own retry/empty states.

### Verify Email (Phase 33)
First real outbound-email infrastructure in the project (`MailService`, SMTP via `nodemailer`, dedicated `JWT_EMAIL_VERIFICATION_SECRET`). `POST /auth/send-verification-email`, `POST /auth/resend-verification-email`, `GET /auth/verify-email?token=` (200 success / 400 invalid / 409 already-verified / 410 expired — deliberately distinct statuses so the frontend doesn't have to parse Vietnamese error strings). Falls back to a dev-only console-logged token when `MAIL_HOST` is unset, matching the pre-existing forgot-password pattern. `VerifyEmailStatus.tsx` / `EmailVerificationStatus.tsx` handle all 5 resulting UI states.

### In-app Notifications (Phase 34)
`GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`, `DELETE /notifications/:id` — every query and mutation is scoped server-side to `@CurrentUser()`; cross-user access attempts get a 404 (not 403, to avoid confirming the notification exists for someone else). `NotificationBell.tsx` in the header + a full list view at `/user/thong-bao`.

### Episode Management (Phase 35)
Admin CRUD + reorder for a film's episodes (`EpisodeManagement.tsx`, embedded in the Edit Movie page, fully independent from the movie-save form). Backed by a **new, separate `episodes` collection** — `GET/POST /films/:filmId/episodes`, `PATCH/DELETE /episodes/:id`, `PATCH /episodes/:id/order`. `displayOrder` is always server-computed; duplicate `episodeNumber` within a film is rejected at both the app layer and via a DB unique compound index.

> **Architecture note (deliberate, approved):** this collection is intentionally decoupled from the pre-existing embedded `Film.episodes` array that the crawler writes and the public watch page (`/xem-phim/[slug]`) reads. Admin-managed episodes are **not yet visible to end users** — a future migration phase must decide whether/how to reconcile the two. Do not treat this as an oversight; it was scoped out of Phase 35 explicitly.

---

## Fixed Bugs

| # | Area | Bug | Fix |
|---|---|---|---|
| 1 | Backend — `users.service.ts` | `updatePassword` threw `ConflictException` (409) for an incorrect current password — a credential mismatch, not a resource-state conflict. Inconsistent with the identical "wrong password" case in `AuthService.login`, which correctly throws `UnauthorizedException` (401). | Changed to `UnauthorizedException`, matching the established codebase pattern. Added a regression unit test (`users.service.spec.ts`). Verified no frontend code branches on the old status code. |
| 2 | Test suite — `users-admin.e2e-spec.ts` | A test named itself after a *previously fixed* bug (`isActive=false` cast-to-`true`) but its assertion still checked for the **old, buggy** behavior — passing for the wrong reason instead of verifying the actual fix. Live-server testing during this audit confirmed the app itself is correct (`isActive=false` genuinely returns 0/N filtered results, not the same set as `isActive=true`). | Corrected the assertion to check the real, correct behavior (response contains the inactive user, and every returned item has `isActive === false`) — now a genuine regression test instead of a stale, misleading one. |
| 3 | Code quality | One backend ESLint error: `let added = 0` in `ophim-category-sync.service.ts`'s `syncOne()` was never reassigned. | Changed to `const`. |

No other bugs were found that met the fix bar (proven + under 20 lines + no architecture change). Everything else found during the audit is listed below as a **Known Limitation** or **Recommendation** — deliberately *not* silently changed, per this release's explicit scope constraints (no new features, no architecture changes, no unproven API changes).

---

## Security Audit

Full review of every new/changed file in this release (path traversal, IDOR, RBAC bypass, JWT/token handling, email/template injection, ReDoS reintroduction, secrets-on-disk) — **zero HIGH/MEDIUM findings.** Notably: upload path-containment check is correctly ordered (resolve-then-check-prefix); notification queries are scoped server-side, not client-input-scoped; dashboard/episodes RBAC guards are registered globally and verified as actually enforced (not just decorator presence); email-verification JWTs use a dedicated required secret with no fallback; the project's `escapeRegExp()` convention was not bypassed anywhere in the new modules.

---

## Known Limitations

Carried over, still true:
- **Permissions catalog is read-only in the admin UI** by design.
- **`users` collection has no index on `role`/`isActive`** — flagged again this release (still a non-issue at current data volume).
- **Playwright coverage is Chromium-only.**

New or updated this release:
- **`forgotPassword` still does not use the new `MailService`** — it remains dev-only console-logged, by explicit scope decision during Phase 33 (only the email-verification flow was wired to real SMTP). If Forgot Password needs to work for real end users, this is a small, well-contained follow-up (reuse `MailService.send()`, already written generically for exactly this).
- **No cascade-delete or referential guard for `Film`/`User` deletion** anywhere in the codebase — deleting a `Film` orphans `Episode`/`Comment`/`Rating`/`Favorite`/`History`/`Playlist.films[]`/`FilmReport` documents; deleting a `User` orphans `Comment`/`Favorite`/`History`/`Rating`/`Playlist`/`Notification` documents. Pre-existing, not introduced this release, but not previously documented. `categories`/`roles`/`permissions` deletion correctly guards or cascades — `countries`/`directors`/`actors` deletion does neither, silently leaving dangling ObjectId refs on `Film`. **Recommendation:** needs a product decision (block-if-referenced vs. cascade vs. soft-delete) before being fixed — out of scope for this audit's "small proven fixes only" mandate.
- **Upload module (Phase 31) has zero automated test coverage** — no unit spec, no e2e spec. Manually verified this release via live smoke test against the real server: upload → public fetch (200, correct `Content-Type`, correct `Cross-Origin-Resource-Policy: cross-origin` header) → delete → re-fetch (404) → invalid file type correctly rejected (400). **Recommendation:** add `uploads.e2e-spec.ts` before this module sees further changes.
- **Missing DB indexes for some sort/filter fields**, all confirmed by reading the actual query call sites: `Film.isHot` and `Film.commentCount` (unindexed, used for homepage "hot"/"most commented" sorts), `Film.updatedAt` (used by `findLatestSeries`), `User.createdAt`/`Film.createdAt` (used by the new Dashboard "recent" widgets). Not urgent at current data volume; flagged for the same follow-up as the pre-existing `users.role`/`users.isActive` index gap.
- **`Film.sourceSlug` is written by the crawler but never queried** — effectively a dead field. Low priority.
- Minor, non-blocking frontend polish gaps found this audit (none are behavioral bugs): `/dien-vien`, `/dien-vien/[slug]`, `/dang-nhap`, `/dang-ky` have no page metadata (sibling routes do); sitemap.ts doesn't include actor/category/country detail pages (robots.txt does allow them); `NotificationBell`'s dropdown (`w-80`, unclamped) can clip on ~320–375px viewports; a couple of icon-only/hover-only affordances in the new Dashboard chart and Notification components have weak keyboard/touch accessibility. None were fixed in this pass (see scope constraints above) — listed for a follow-up polish pass.

**All 5 "Backend Blockers" from the previous release's audit are now resolved** (Episode Management, Dashboard, Notification, Verify Email, Real File Upload) — this section is intentionally empty going into v1.1.0.

---

## Breaking Changes

- **`PATCH /users/me/password` now returns `401 Unauthorized` (was `409 Conflict`) when `currentPassword` doesn't match.** Any client-side code keyed specifically to the old 409 status for this endpoint will need updating. The frontend (`ChangePasswordForm.tsx`) was verified to only use the generic error message, not the status code, so no frontend change was needed.
- No REST endpoint was removed or had its request/response *shape* changed.

---

## Migration Notes

**No new data migration is required for this release.** `Episode` and `Notification` are both brand-new collections with no legacy data to backfill. `User.isEmailVerified` (new field, defaults via schema) is only ever read off already-hydrated documents, never used as a raw Mongo query filter — so it avoids the exact "default not persisted, breaks queries" class of bug that motivated 3 of the 5 pre-existing migration scripts. Worth revisiting if `isEmailVerified` is ever turned into a query filter later.

All 5 pre-existing migration scripts (`migrate:categories`, `migrate:film-refs`, `migrate:films-stabilization`, `migrate:comments-hidden`, `migrate:categories-source-slug`) remain stale/inert — already-applied, current schemas match their end-state, kept only for upgrading older deployments. No action needed on a fresh v1.1.0 database beyond the existing seed steps.

---

## Tested Environments

- **OS:** Windows 11
- **Node.js:** v25.2.0 (note: `jest-environment-node` on this Node version requires `NODE_OPTIONS=--no-experimental-webstorage` to run — a Node/Jest environment interaction, not a project bug; unrelated to this release's code)
- **Backend:** NestJS 10, Mongoose 8, TypeScript 5, MongoDB 7 (Docker, `mongo:7`)
- **Frontend:** Next.js 16 (Turbopack), React 19, TanStack Query 5, NextAuth 4, Tailwind CSS 4, TypeScript 5
- **Pipeline (this release):**
  - Prettier: clean on all files touched this release (40 pre-existing files elsewhere in `backend/src`/`test` have CRLF-only formatting drift, untouched by this release, not introduced by it)
  - TypeScript: 0 errors (backend + frontend)
  - Production build: clean (backend `nest build`; frontend `next build` — 38 routes generated, 0 errors)
  - ESLint: 0 errors on all files touched this release (backend's 1 real error, `prefer-const`, fixed — see Fixed Bugs; frontend 0 errors/0 warnings repo-wide)
  - Jest: **266/266 backend unit tests**, **290/290 backend e2e tests**, **32/32 frontend unit tests** — all passing
  - Playwright: **36/36** (Chromium)
- **Manual QA:** performed against a live backend + live MongoDB using real accounts and real HTTP requests (no mocked data, no hand-crafted JWTs) — real `/auth/login` and the real Forgot Password flow were used to obtain admin credentials for browser testing. Covered: full Episode Management lifecycle in a real browser (create/edit/publish-toggle/reorder/delete, verified via screenshots and zero console errors); full Upload lifecycle via live HTTP (upload/public-fetch/delete/re-fetch-404/reject-invalid-type); smoke-tested at least one endpoint per module across all 15 required areas (Public, Auth, Movie, Category, Country, Actor, Director, Comment, User, Role, Permission, Upload, Dashboard, Verify Email, Notification, Episode).

---

## Production Deployment Notes

- **New required/optional environment variables this release** (see `backend/.env.example`): `PUBLIC_BASE_URL` (used to build absolute upload URLs), `FRONTEND_URL` (used to build the email-verification link), `JWT_EMAIL_VERIFICATION_SECRET`/`JWT_EMAIL_VERIFICATION_EXPIRES` (required — no fallback default), and the `MAIL_*` block (`MAIL_HOST/PORT/SECURE/USER/PASS/FROM` — optional; leave `MAIL_HOST` empty to keep the dev-only console-log fallback for both verify-email and forgot-password tokens).
- **Uploaded files are stored on local disk** (`backend/uploads/`, served statically at `/uploads/...`, outside `apiPrefix`) — this is **not** durable/shared storage. On any multi-instance or ephemeral-filesystem deployment (containers without a persistent volume, horizontal scaling), uploaded images will be lost or inconsistent across instances. Mount a persistent volume at `backend/uploads/` at minimum; a real object-storage integration (S3-compatible) is a larger follow-up, not in scope here.
- **`helmet()`'s `Cross-Origin-Resource-Policy` is now set to `cross-origin`** (was the default `same-origin`) — required so the frontend origin can actually load images from `/uploads/...`. This was already effectively necessary for cross-origin API calls generally (`enableCors` was already permissive); verify your production CORS/CORP posture still matches your actual deployment topology (same-origin reverse proxy vs. separate frontend/backend domains).
- Everything else from the previous release's deployment notes (`MONGODB_URI`, `docker-compose.yaml` mongodb+api pair, first-time seed order, `.env` git-ignored, `NEXT_PUBLIC_SITE_URL`, `/admin/**`+`/user/**` excluded from robots/sitemap) is unchanged and still accurate.

---

*This document reflects a Final Release Audit pass for v1.1.0. Three small, verified bug fixes were applied during the audit (see Fixed Bugs) — everything else identified is listed as a Known Limitation/Recommendation and was deliberately left unchanged per this release's scope constraints (no new features, no architecture changes, no unproven API changes). See `CHANGELOG.md` for the terse version.*
