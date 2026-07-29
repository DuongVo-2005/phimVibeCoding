# RoPhim — Release Notes

**Scope of this release:** Admin panel completion (Movie/Category/Country/Actor/Director/Comment/User/Role-Permission/Avatar management), Forgot/Reset Password, and a full production-hardening + security audit pass.

---

## Features

### Admin — Movie Management
- Movie List: search, filter (status/category/country/year), sort, pagination — table on desktop, card list on mobile.
- Create Movie / Edit Movie (relational selects for country/category/director/actor via search-to-select; director/actor use server-side search+pagination, category/country use full lists).
- Delete Movie (confirm dialog, hard delete — no restore, matches existing backend behavior).

### Admin — Category Management
List / Create / Edit / Delete, filter by active/inactive status.

### Admin — Country Management
List / Create / Edit / Delete. Editing a country's name also changes its public URL slug (existing backend behavior, surfaced with an on-screen warning).

### Admin — Actor Management
List (server-side search + pagination) / Create / Edit / Delete.

### Admin — Director Management
List (server-side search + pagination) / Create / Edit / Delete. Newly created directors are immediately selectable in the Movie Create/Edit form.

### Admin — Comment Moderation
List all comments (paginated) with poster/user context, Hide/Show toggle, Delete.

### Admin — User Management
List (search, filter by role/status, pagination) / Create / Change role (user↔admin) / Lock-Unlock account / Delete. The currently logged-in admin's own row is protected from self-role-change, self-lock, and self-delete (matches backend enforcement).

### Admin — Role & Permission Management
Roles: List / Create / Edit / Delete, with system roles (`admin`, `user`) protected from rename/delete. Permission assignment per role via a checklist grouped by resource. Permissions themselves are read-only in the UI (see *Known limitations*).

### Admin — Avatar Management
Avatar Types and Avatar Images: Create / Delete (backend has no Update endpoint for either). Images are entered as URLs, not uploaded files.

### Public — Forgot / Reset Password
`/quen-mat-khau` (request reset) and `/dat-lai-mat-khau?token=...` (set new password), linked from the Login page. Full request → reset → login-with-new-password loop verified end-to-end against a real backend.

### Layout fix
Admin shell (`AdminShell`) mobile layout corrected — the sidebar/top-nav no longer collapses the content column to ~28px width on small screens.

---

## Fixed Bugs

| # | Area | Bug | Fix |
|---|---|---|---|
| 1 | Backend — Categories | `POST /categories` always failed with 500 on the second manually-created category onward (`sourceSlug` unique+sparse index conflict caused by an incorrect `default: null` on the schema field). | Removed the default; added a one-time migration to strip the stray `sourceSlug: null` from existing documents. |
| 2 | Backend — Users & Categories filters | `?isActive=true` and `?isActive=false` returned identical results — `@Type(() => Boolean)` casts any non-empty string (including `"false"`) to `true`. | Replaced with the same explicit `@Transform` pattern already used correctly by `films`' `isPublished` filter. |
| 3 | Backend — Search endpoints | `GET /users?search=` and `GET /actors?letter=` built a `RegExp` directly from unescaped user input — ReDoS risk (catastrophic backtracking) and potential 500s on regex metacharacters. | Added `escapeRegExp()` utility, applied at both call sites. |
| 4 | Frontend — `max-w-{sm,md,lg,xl}` (TECH-DEBT-001) | A project-wide custom Tailwind spacing token (`--spacing-sm/md/lg/xl`) silently shadows Tailwind's default `max-w-*` scale, e.g. `max-w-sm` resolves to ~12px instead of 24rem. Found live (not just in already-documented comments) in `ConfirmDialog`, `AdminCountryListView`, `HeroBanner`, `ActorHero`, `RoleGuard` — in the `ConfirmDialog` case this pushed the confirm button outside the viewport, making Delete unclickable. | Replaced with explicit arbitrary values (`max-w-[24rem]` etc.), matching the project's own established workaround convention. |
| 5 | Frontend — `Input.tsx` / `Select.tsx` | Controlled inputs used without `react-hook-form`'s `register()` (no `id`/`name` supplied) rendered a `<label>` with no `for` attribute — completely broken accessible-name association. | Added a `useId()` fallback so every instance always has a stable, unique `id`. |
| 6 | Frontend — Category admin list | Merging separately-fetched "active" and "inactive" category queries could transiently show the same document twice (React duplicate-key warning) during cache refetch races — root cause was bug #2 above. | De-duplicated the merged list by `_id`. |
| 7 | Code quality | `HlsPlayer.tsx` had pre-existing Prettier formatting drift (unrelated to this release's feature work). | Reformatted, no behavior change. |

---

## Known Limitations

- **No real file upload.** Poster/thumbnail/banner/trailer/episode/avatar fields are all plain URL text inputs. There is no `UploadModule`, no Multer, no cloud storage integration anywhere in the backend.
- **Episodes cannot be edited after a movie is created.** `UpdateFilmDto` explicitly omits `episodes`; the admin Edit Movie form has no episode management UI as a direct consequence.
- **No email delivery.** `forgotPassword` generates a real reset token but only logs it server-side (dev-only); there is no SMTP/SES integration, so end users cannot currently receive the email in any environment as deployed today.
- **Permissions catalog is read-only in the admin UI** by design — `permissions.controller.ts` supports full CRUD, but Permissions are a fixed catalog matching real `@RequirePermission()` guards in code; letting an admin create/delete arbitrary permission records via UI would produce entries that don't gate anything, or silently break an in-use guard.
- **`users` collection has no index on `role` or `isActive`.** Current data volume makes this a non-issue; flagged for follow-up if the user base grows significantly.
- **Playwright coverage is Chromium-only** (`playwright.config.ts` defines a single `chromium` project) — Firefox/WebKit/Safari have not been exercised by the automated suite.

---

## Backend Blockers (require backend work, out of scope for this release)

1. **Episode Management** — no endpoint to update episodes after film creation.
2. **Dashboard** — no stats/analytics/overview endpoints exist at all.
3. **Notification** — no module; only a forward-looking `notifications:*` permission key is seeded for a future module.
4. **Verify Email** — no `verify-email` endpoint, no `isEmailVerified` field on the `User` schema.
5. **Real file Upload** — no `UploadModule`; `implementation_roadmap.md` documents this as a planned-but-unbuilt backend phase.

---

## Breaking Changes

- **`GET /categories?isActive=false` and `GET /users?isActive=false` now actually filter to inactive records.** Previously both `true` and `false` silently behaved as `true` (bug #2). Any existing client code that depended on the old (broken) behavior — e.g. assumed `isActive=false` was a no-op — will now see different, correct results.
- **Search endpoints now treat regex metacharacters as literal text.** `GET /users?search=` and `GET /actors?letter=` previously interpreted characters like `(`, `.`, `*` as regex syntax (undocumented, unintended); they are now escaped and matched literally. Any client relying on the old regex-injection behavior (there is no known legitimate use case) will see different results for search strings containing those characters.

No REST endpoint was removed, renamed, or had its request/response shape changed.

---

## Migration Notes

- **Run once, before or immediately after deploying this release:**
  ```
  cd backend
  npm run migrate:categories-source-slug
  ```
  Idempotent and safe to re-run. It removes the stray `sourceSlug: null` field left on manually-created categories by the pre-fix schema (bug #1), which is required for `POST /categories` to work correctly for more than one manually-created category.
- No other data migrations are required. All other fixes/features are additive (new collections were not introduced; existing schemas were not restructured).

---

## Tested Environments

- **OS:** Windows 11
- **Node.js:** v25.2.0
- **Backend:** NestJS 10.4.4, Mongoose 8.6.3, TypeScript 5.5.4, MongoDB 7 (via Docker, `mongo:7` image)
- **Frontend:** Next.js 16.2.11 (Turbopack), React 19.2.4, TanStack Query 5.101, NextAuth 4.24, Tailwind CSS 4, TypeScript 5
- **E2E:** Playwright 1.61 — **Chromium only** (see *Known limitations*)
- **Pipeline (final run, this release):** Prettier ✅ · TypeScript (frontend + backend) ✅ · Production build ✅ · ESLint ✅ · Jest 9/9 ✅ · Playwright 36/36 ✅
- **Manual QA:** performed against a live backend + live MongoDB using real accounts and real HTTP requests throughout (no mocked data, no hand-crafted JWTs) for every feature listed above, plus a final 14-point regression pass (public: homepage/search/detail/watch/actor/register/login/favorite/history/profile/comment/rating; admin: dashboard) with zero console errors, zero 5xx responses, and zero horizontal-overflow at mobile/desktop breakpoints.

---

## Production Deployment Notes

- **Database:** Backend expects `MONGODB_URI` (default `mongodb://localhost:27017/rophim`). `backend/docker-compose.yaml` provides a `mongodb` (mongo:7) + `api` service pair; the `api` service there is a separate deployment path from running `npm run start:dev`/`start:prod` directly — pick one, don't run both against the same port.
- **First-time setup on a fresh database**, in order:
  1. `npm run seed:admin` — creates the initial admin account (`ADMIN_PASSWORD` env var required).
  2. `npm run seed:rbac` — seeds the permission catalog and syncs role→permission assignments (safe to re-run any time a new permission key is added to the catalog).
  3. `npm run migrate:categories-source-slug` — see *Migration Notes* above.
- **Environment variables:** `.env` is git-ignored in both `backend/` and `frontend/` (verified not tracked). Ensure secrets (`JWT` signing keys, `ADMIN_PASSWORD`, `MONGODB_URI`) are provided via the deployment environment, not committed.
- **`NEXT_PUBLIC_SITE_URL`** should be set to the real production origin — it's used by `sitemap.xml`/`robots.txt` generation.
- **`/admin/**` and `/user/**` are already excluded from `robots.txt` and `sitemap.xml`** — no action needed, verified during this audit.
- **Email/SMTP is not configured.** If Forgot Password needs to work for real end users before general availability, SMTP/SES integration must be added to `auth.service.ts` first (see *Known limitations*).
- **No file storage/CDN is configured** — if real image/video uploads are required before release, that's backend Phase 8 work (Upload module) plus corresponding frontend form changes; out of scope here.

---

*This document was generated as part of a Final Project Audit pass. No source code was modified as part of writing this file.*
