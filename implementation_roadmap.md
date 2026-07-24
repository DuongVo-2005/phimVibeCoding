# RoPhim — Implementation Roadmap

Official implementation plan. Synthesized from [`project.md`](project.md), [`backend.md`](backend.md), [`frontend.md`](frontend.md), [`api_design.md`](api_design.md) (Revision 4), and [`database_schema.md`](database_schema.md) (Revision 2).

This is a **backend-first roadmap**: every phase's checklist (DTOs/Services/Controllers/Guards/Swagger/tests) is NestJS-shaped because that's where `api_design.md`/`database_schema.md` did the detailed design work. Frontend (Next.js, per `frontend.md`) has no code in the repo yet — each phase below ends with a **Frontend unlock** line naming which page(s) from `project.md` §5 become buildable once that phase ships, so this stays one coherent plan without inventing Next.js-shaped deliverables the source docs don't cover.

---

## 0. How to read this document

- **Complexity**: Low / Medium / High — engineering risk + size, not calendar time.
- **Depends on**: phases that must ship first. Phases without a listed dependency on each other **can run in parallel** across engineers.
- **Status tags** on modules: `EXISTING` (already implemented, this phase only adds a delta), `NEW` (no code exists yet), `MIGRATION` (existing collection/field changes shape — needs a data migration, not just new code).
- Every phase assumes the global infra already in place today: `ConfigModule`, `DatabaseModule`, `ScheduleModule`, `ThrottlerModule`, `JwtAuthGuard`/`RolesGuard`/`@Public()`/`@Roles()`, `HttpExceptionFilter`, `TransformInterceptor`, `PaginationQueryDto`/`PaginatedResponseDto`. These are **not** re-listed per phase as "Guards" unless a phase changes them.

### Implementation order & dependency map

| # | Phase | Depends on | Complexity | Can parallelize with |
|---|---|---|---|---|
| 1 | Foundation Hardening | — | Low | — |
| 2 | RBAC Foundation | 1 | High | — |
| 3 | Taxonomy Migration (Categories/Countries/Directors) | 2 | High | 6 |
| 4 | Films Core Update | 3 | High | — |
| 5 | Episodes + Notifications | 4 | Medium | 6, 8 |
| 6 | Comments/Ratings/Film Reports Moderation | 2 | Medium | 3, 5, 8 |
| 7 | Favorites/Histories/Playlists Regression | 4 | Low | 8, 9 |
| 8 | Avatars PATCH + Upload | 2 | Medium | 5, 6, 7 |
| 9 | Crawler/CrawlerHistory Permission Rollout + Categories Cron | 3, 2 | Low | 7, 8 |
| 10 | Dashboard Admin | 2, 3, 4, 6, 9 | Medium | — |
| 11 | Release Hardening | all | Medium | — |

---

## Current State Baseline (already implemented — do not rebuild)

Per `api_design.md`'s `EXISTING` markers, these already work in `backend/src` and are **not** rebuilt by any phase below — phases only apply the specific deltas called out in each section:

`AuthModule` (register/login/refresh/logout/forgot/reset), `UsersModule` (self-service `me` routes), `FilmsModule` (public browse/detail/top/hot/latest-series/related/view + admin CRUD), `ActorsModule` (full), `TypesModule` (base CRUD + hot — becomes `Categories` in Phase 3), `CommentsModule` (create/vote/delete/listings), `RatingsModule` (full), `FavoritesModule` (full), `HistoriesModule` (full), `PlaylistsModule` (full), `AvatarsModule` (base CRUD minus `PATCH`), `FilmReportsModule` (create/list/status), `CrawlerModule` (3 sync-trigger endpoints + `CrawlerSchedulerService` cron), `CrawlerHistoryModule` (read-only history), global guards/filters/interceptors, `p-limit`-based crawler concurrency (no BullMQ/Redis — a deliberate, documented deviation from `backend.md`'s original Redis/BullMQ plan, kept as-is; see Phase 11 for reconciling that doc).

---

## Phase 1 — Foundation Hardening

**Objective:** close the two small, low-risk correctness gaps found in `api_design.md`'s final audit before building anything new on top of Auth, and get test infrastructure ready for every later phase's integration tests.

- **Modules:** `AuthModule` (`EXISTING`, delta only).
- **DB collections involved:** `users` (no schema change, behavioral check only).
- **APIs to implement:** none new — modify `POST /auth/login` behavior only.
- **DTOs:** none new.
- **Services:** `AuthService.login` — add `isActive` check (403 `Tài khoản đã bị vô hiệu hoá`, before password comparison result is used to decide the response) per `api_design.md` §4.
- **Controllers:** `AuthController` — no route change, only underlying service behavior.
- **Guards:** none new.
- **Validation:** apply the `api_design.md` §3.2 password-length rule (`min 8`) to `RegisterDto`/`ResetPasswordDto`/`UpdatePasswordDto` if not already enforced identically.
- **Swagger:** add `@ApiResponse({status:403, description:'Account deactivated'})` on `POST /auth/login`.
- **Unit tests:** `AuthService.login` — deactivated user → 403; wrong password → 401; both distinguishable by status code and message.
- **Integration tests:** e2e login flow covering active/deactivated/wrong-password/wrong-email. **Infra task:** install `mongodb-memory-server` as a devDependency (currently referenced by `scratch-boot-test.js` but never installed — every phase's integration tests need this to run against an ephemeral Mongo instead of a shared dev DB).
- **Done criteria:** deactivated-account login returns 403 with the exact §3.1 message; e2e suite runs green against `mongodb-memory-server` in CI without a live external Mongo.
- **Frontend unlock:** none new (login page already fully specified) — but the FE auth flow should handle the new 403 case distinctly from 401.

---

## Phase 2 — RBAC Foundation

**Objective:** stand up the full Role/Permission system from `api_design.md` §2 as additive infrastructure alongside the existing `@Roles(ADMIN)` mechanism (nothing existing breaks), then retrofit `@RequirePermission()` onto every already-existing admin endpoint so every later phase can adopt it from day one instead of retrofitting per-module later.

- **Modules:** `RolesModule` (`NEW`), `PermissionsModule` (`NEW`), `UsersModule` (`EXISTING`, delta: admin CRUD + role assignment).
- **DB collections involved:** `roles` (`NEW`), `permissions` (`NEW`), `role_permissions` (`NEW`), `users` (`MIGRATION` — add `roleIds`, backfill every existing user to `[<seeded "user"|"admin" role id>]` based on their current `role` enum value).
- **APIs to implement:**
  - Roles: `GET/POST /roles`, `GET/PATCH/DELETE /roles/:id`, `GET/PUT /roles/:id/permissions`, `GET /roles/:id/users` (§22).
  - Permissions: `GET/POST /permissions`, `GET/PATCH/DELETE /permissions/:id` (§23).
  - Users: `POST /users`, `GET /users`, `GET /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/status`, `DELETE /users/:id`, `GET/PUT /users/:id/roles`, `DELETE /users/:id/roles/:roleId` (§5.2, §5.3).
- **DTOs:** `CreateRoleDto`, `UpdateRoleDto`, `SetRolePermissionsDto`, `CreatePermissionDto`, `UpdatePermissionDto`, `CreateUserByAdminDto`, `UpdateUserRoleDto`, `UpdateUserStatusDto`, `SetUserRolesDto`, `QueryUserDto` (extends `PaginationQueryDto`, + `search?/role?/isActive?`).
- **Services:** `RolesService` (CRUD, `isSystem` delete/rename guard, permission-set replace), `PermissionsService` (CRUD, `key` regex + immutability, cascade-delete from `role_permissions`), `UsersService` (extend existing with admin CRUD + role assignment + last-role/self-lockout guards), `PermissionResolverService` *(new shared service)* — resolves `userId → roleIds → role_permissions → permission keys`, with a short (~60s) per-user in-memory/cache TTL so this isn't a full join on every request.
- **Controllers:** `RolesController`, `PermissionsController`, `UsersController` (extended).
- **Guards:** **`PermissionsGuard`** *(new, global `APP_GUARD`, registered alongside — not replacing — `RolesGuard`)* + **`@RequirePermission('resource:action')`** decorator. Retrofit task: add `@RequirePermission()` to every already-existing admin endpoint (Films, Actors, Types, Avatars, FilmReports, Crawler, CrawlerHistory admin routes) using the permission keys already assigned to them in `api_design.md`'s per-module tables — a mechanical, low-risk decorator-only change since `@Roles(ADMIN)` stays in place underneath.
- **Validation:** `SetRolePermissionsDto.permissionIds` / `SetUserRolesDto.roleIds` — non-empty array of valid ObjectIds; `PermissionsModule.key` regex `^[a-z][a-z-]*:[a-z][a-z-]*$` (§3.2).
- **Swagger:** new `@ApiTags('roles')`, `@ApiTags('permissions')`; document the 403 "missing permission" response (§3.1) as a shared `@ApiResponse` on every `@RequirePermission()`-guarded route.
- **Unit tests:** `PermissionResolverService` (roles→permissions resolution, cache hit/miss), `RolesService` (system-role delete/rename block, last-permission-on-admin guard), `PermissionsService` (key immutability, cascade delete), `UsersService` (self-lockout prevention, last-role guard, `PUT /users/:id/roles` replace semantics).
- **Integration tests:** seed script runs idempotently (re-running doesn't duplicate roles/permissions); a request to an `@RequirePermission()` route with a JWT whose user has no matching permission → 403; full round-trip create-role → assign-permissions → assign-role-to-user → user can now hit the gated route.
- **Done criteria:** every existing user document has non-empty `roleIds` after migration; seeded `admin`/`user` roles carry exactly the permission sets defined in `api_design.md` §2.3/§2.4; zero regressions in existing `@Roles(ADMIN)`-gated endpoints (guard runs additively, doesn't yet *require* `@RequirePermission()` on routes that don't have it).
- **Frontend unlock:** Admin dashboard's user/role/permission management screens (not in `project.md`'s original 7 design pages — net-new admin UI, tracked separately from the public-site page list).

---

## Phase 3 — Taxonomy Migration: Categories, Countries, Directors

**Objective:** land the `types`→`categories` rename + Ophim sync, and the two brand-new normalized entities, *before* touching `Films` (Phase 4 needs all three to exist as valid ref targets).

- **Modules:** `CategoriesModule` (`MIGRATION` from `TypesModule`), `CountriesModule` (`NEW`), `DirectorsModule` (`NEW`).
- **DB collections involved:** `categories` (`MIGRATION` — rename `types` collection, add `description/seoTitle/seoDescription/source/sourceSlug/sourceUpdatedAt/isActive`, backfill `isActive:true` for all existing rows), `countries` (`NEW`), `directors` (`NEW`), `crawler_history` (write target for the new `ophim-categories` source).
- **APIs to implement:**
  - Categories: `GET /categories`, `GET /categories/hot`, `GET /categories/:slug`, `POST/PATCH/DELETE /categories(/:id)`, `POST /categories/sync`, `POST /categories/sync/:slug`, `GET /categories/sync/history` (§8).
  - Countries: `GET /countries`, `GET /countries/:slug`, `POST/PATCH/DELETE /countries(/:id)` (§9).
  - Directors: `GET /directors` (paginated), `GET /directors/:slug` (+filmography), `POST/PATCH/DELETE /directors(/:id)` (§10).
- **DTOs:** `CreateCategoryDto`, `UpdateCategoryDto`, `QueryCategoryDto`; `CreateCountryDto`, `UpdateCountryDto`; `CreateDirectorDto`, `UpdateDirectorDto`, `QueryDirectorDto` (extends `PaginationQueryDto` + `search?`).
- **Services:** `CategoriesService` (CRUD + `findOrCreateByName` for internal use by the Films mapper), `OphimCategorySyncService` *(new)* — fetches `https://ophim1.com/the-loai`, upserts by `sourceSlug`, **never** overwrites `slug/description/seoTitle/seoDescription/isActive/isHot` on update (§1.3/§4.3 of `database_schema.md`), writes one `crawler_history` row per run; `CountriesService` (CRUD + `findOrCreateByName`); `DirectorsService` (CRUD + `findOrCreateByName`, mirrors `ActorsService`).
- **Controllers:** `CategoriesController`, `CountriesController`, `DirectorsController`.
- **Guards:** `@RequirePermission('categories:read'|'create'|'update'|'delete'|'sync')`, `'countries:*'`, `'directors:*'` (Phase 2's guard, used from day one — see Phase 2's rationale).
- **Validation:** `CreateCategoryDto.seoTitle` ≤70 chars, `seoDescription` ≤160 chars (§3.2, soft); `slug`-bearing DTOs never accept `slug` directly (server-derived from `name`).
- **Swagger:** `@ApiTags('categories')`, `@ApiTags('countries')`, `@ApiTags('directors')`; document `POST /categories/sync`'s `SyncResultResponseDto` shape identically to the existing Crawler module's.
- **Unit tests:** `OphimCategorySyncService` — insert path, update path (asserts admin fields untouched), 404 on `sync/:slug` for a slug absent both locally and upstream, network-failure path (whole run → `FAILED` in `crawler_history`, existing categories untouched); delete-blocked-while-referenced for all three new services.
- **Integration tests:** rename migration script run against a snapshot of existing `types` data → all documents present as `categories` with `isActive:true`, no data loss; `GET /categories/hot` returns only `isHot:true` rows; full sync against a mocked Ophim response upserts correctly on a second run without duplicating.
- **Done criteria:** `types` collection no longer exists post-migration (renamed, not duplicated); `films.categories` (renamed field, prepped for Phase 4) not yet touched in this phase; Categories/Countries/Directors each pass the same "full CRUD + delete-blocked-while-referenced" bar already established by Actors.
- **Frontend unlock:** `moviecategory.html` (danh sách phim theo thể loại/quốc gia) gains real Country/Director filter data; new admin screens for managing Categories/Countries/Directors.

---

## Phase 4 — Films Core Update

**Objective:** apply every Films-module change from `api_design.md` §6 in one pass, since they interact (query param renames, new refs, new state) — this is the highest-risk phase (heavily-trafficked module + a real data migration) and must land after Phase 3 provides valid ref targets.

- **Modules:** `FilmsModule` (`EXISTING`, `MIGRATION` on 3 fields).
- **DB collections involved:** `films` — rename `types`→`categories` field (ref target already migrated in Phase 3), migrate `country: string`→`countries: ObjectId[]` and `director: string`→`directors: ObjectId[]` (resolve-or-create against Phase 3's new collections for every distinct string value found across existing film documents), add `isPublished: boolean default true`.
- **APIs to implement:** `GET /films` (renamed params `category`/`format`, new `country`/`director`/`isPublished` filters), `GET /films/top` (+`metric` param), `GET /films/most-commented` *(new)*, all other Films routes unchanged in shape but now implicitly filter `isPublished:true` for Public callers.
- **DTOs:** `QueryFilmDto` updated (rename `type→category`, old `category→format`, add `country?/director?/isPublished?`), `CreateFilmDto`/`UpdateFilmDto` updated field names (`categories/countries/directors`), `FilmSummaryResponseDto`/`FilmDetailResponseDto` updated to populate the renamed/new ref fields.
- **Services:** `FilmsService` — migration script (`migrateFilmTaxonomyRefs`, one-off, run once) that reads every film's legacy `country`/`director` strings, calls `CountriesService.findOrCreateByName`/`DirectorsService.findOrCreateByName`, and rewrites the field; `findAll`/`findOne`/etc. updated for the new implicit `isPublished` filter (Public) vs explicit query param (Admin); new `findMostCommented()` (sort `commentCount` desc); `findTop()` extended with `metric` switch (`view` vs `ratingAvg`, tie-broken by `ratingCount`).
- **Controllers:** `FilmsController` — route signatures unchanged, query parsing updated.
- **Guards:** `@RequirePermission('films:read'|'create'|'update'|'delete')` (read is unenforced/Public per §2.3, kept for catalog completeness).
- **Validation:** `sortBy` whitelist enforcement (§3.2) — only `createdAt|view|ratingAvg|releaseYear` accepted, 400 otherwise; `isPublished` query param parsed as boolean, Admin-only (400 if a non-admin caller somehow passes it — defense in depth on top of it simply being ignored for Public).
- **Swagger:** update all Films endpoint docs for renamed/added query params; add `@ApiQuery` for `metric`, `isPublished`.
- **Unit tests:** `findMostCommented` sort correctness; `findTop` both metrics + tie-break; migration script — a film with `country:"Việt Nam, Hàn Quốc"` correctly splits/resolves to two `Country` refs (need a defined splitting rule — comma-separated, trimmed); `isPublished` default-true filter applied for Public, bypassable only for Admin.
- **Integration tests:** run the migration against a seeded dataset with duplicate/near-duplicate country strings ("Việt Nam" / "Viet Nam") — decide and test the dedup rule (case+diacritic-insensitive slug match); `GET /films?isPublished=false` returns 403/empty for a non-admin token; `PATCH /films/:id {isPublished:false}` immediately removes it from `GET /films/most-commented`, `/top`, `/hot`, `/latest-series`, `/related` without deleting any dependent comment/rating/history/favorite/playlist-entry.
- **Done criteria:** zero orphaned `country`/`director` strings left unresolved after migration (or an explicit reviewed exceptions list); all public film-listing endpoints provably exclude unpublished films; existing e2e smoke tests (crawler sync → films populated) still pass unmodified, since the crawler's own field-mapping needs a corresponding update to write `countries`/`directors` refs instead of joined strings (coordinate with `OphimMapperService` — **note:** this is a change to what the crawler *writes*, not its fetch/upsert *logic*, consistent with the "don't change crawler business logic" precedent from earlier work — only the target field shape changes).
- **Frontend unlock:** `moviedentail.html` (chi tiết phim) can render clickable country/director links to their own pages; homepage "bình luận sôi nổi" widget backed by real data.

---

## Phase 5 — Episodes Nested Resource + Notifications

**Objective:** give admins a real episode-editing surface, and stand up Notifications so the new `new_episode` trigger has somewhere to land.

- **Modules:** `Episodes` *(new nested routes inside `FilmsModule`, no separate module)*, `NotificationsModule` (`NEW`).
- **DB collections involved:** `films.episodes` (no schema change, new mutation path only), `notifications` (`NEW`).
- **APIs to implement:** `POST /films/:slug/episodes`, `PATCH /films/:slug/episodes/:serverName`, `DELETE /films/:slug/episodes/:serverName` (§7); `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`, `POST /notifications/broadcast` (§19).
- **DTOs:** `CreateEpisodeServerDto`, `UpdateEpisodeServerDto`, `EpisodeItemDto`; `QueryNotificationDto`, `BroadcastNotificationDto`, `NotificationResponseDto`.
- **Services:** `FilmsService` — `addEpisodeServer`/`updateEpisodeServer`/`removeEpisodeServer` using positional array operators (`$push`/arrayFilters `$set`/`$pull`), never whole-array replace; `NotificationsService` — CRUD + `notifyFavoritedUsers(filmId, type)` helper; hook this helper into **both** `FilmsService.addEpisodeServer` (manual path) **and** `CrawlerService.syncFilmDetail` (automatic path, additive call only — no change to its fetch/map/upsert logic, same precedent as the `CrawlerHistory` logging hook).
- **Controllers:** `FilmsController` (3 new nested routes), `NotificationsController` (new).
- **Guards:** `@RequirePermission('films:update')` for episode mutation; `'notifications:read'|'manage'|'broadcast'`.
- **Validation:** `serverName` uniqueness within a film (409 on duplicate `POST`); `BroadcastNotificationDto` — at least a `title`+`message`, `targetUserIds` optional array of valid ObjectIds.
- **Swagger:** `@ApiTags('notifications')`; document the episode endpoints under the existing Films tag (nested resource, not a separate tag).
- **Unit tests:** duplicate `serverName` → 409; `notifyFavoritedUsers` — creates exactly one notification per favoriting user, zero if the film has no favorites; broadcast with no `targetUserIds` → all users (bounded/batched, not one unbounded insert).
- **Integration tests:** add episode to a film favorited by 3 users → 3 `notifications` rows created with `type:'new_episode'`; unread-count decrements correctly after `read-all`.
- **Done criteria:** episode mutations never touch unrelated fields on the film document (verified via a positional-op-only code review checklist); crawler-driven episode updates also produce notifications (parity between manual and automatic paths).
- **Frontend unlock:** `watchmovie.html` episode-server admin editing (admin-only tooling); notification bell/dropdown UI (net-new component per `frontend.md`'s Zustand global UI state).

---

## Phase 6 — Comments / Ratings / Film Reports Moderation

**Objective:** land every moderation/CRUD-completeness gap found in the final audit. Independent of Phases 3–5 (only needs Phase 2's guard), so can run in parallel with them.

- **Modules:** `CommentsModule` (`EXISTING`, delta), `RatingsModule` (`EXISTING`, no change — included for regression coverage only), `FilmReportsModule` (`EXISTING`, delta).
- **DB collections involved:** `comments` (`MIGRATION` — add `isHidden:boolean default false`), `film_reports` (`MIGRATION` — enum add `rejected`).
- **APIs to implement:** `PATCH /comments/:id` *(new)*, `PATCH /comments/:id/visibility` *(new)*, `GET /comments` *(admin moderation feed, if not already shipped)*; `DELETE /film-reports/:id` *(new)*.
- **DTOs:** `UpdateCommentDto{content}`, `SetCommentVisibilityDto{isHidden}`, `QueryCommentDto` (admin variant: `filmId?/userId?`).
- **Services:** `CommentsService` — `update` (author-only, 15-min window, 409 past window, sets `isEdited` on the response), `setVisibility` (admin), `findAllForModeration`; all public listing queries updated to exclude `isHidden:true`; `FilmReportsService` — `remove(id)`.
- **Controllers:** `CommentsController`, `FilmReportsController`.
- **Guards:** `@RequirePermission('comments:update')` (owner-checked in service), `'comments:moderate'`, `'film-reports:delete'`.
- **Validation:** comment content 1–2000 chars (§3.2) on both create and edit; edit-window check is a business rule (409), not a DTO validator.
- **Swagger:** document the 409 edit-window-expired response; document `isHidden`'s effect on `GET /comments/film/:filmId` etc.
- **Unit tests:** edit inside/outside window; hide/unhide toggling excludes/includes from public listing; `rejected` status transition allowed from any prior status (not just `pending`).
- **Integration tests:** a hidden comment's replies remain visible and correctly threaded (hiding the parent doesn't cascade-hide children — confirm this is the intended rule, or make it cascade if not); deleting a report the admin already `rejected` still works (delete isn't gated by status).
- **Done criteria:** every Comments/FilmReports endpoint in `api_design.md` §12/§17 is implemented and permission-gated; regression suite for Ratings (unchanged) still green.
- **Frontend unlock:** comment edit/report-management admin UI; "(đã chỉnh sửa)" badge on edited comments.

---

## Phase 7 — Favorites / Histories / Playlists Regression

**Objective:** these three modules have **zero** designed changes in `api_design.md` rev 4 — this phase is deliberately regression-testing only, triggered by Phase 4's `isPublished` field landing (a favorited/watched/playlisted film can now be unpublished without disappearing from the user's own list).

- **Modules:** `FavoritesModule`, `HistoriesModule`, `PlaylistsModule` (all `EXISTING`, no code changes expected beyond the item below).
- **DB collections involved:** `favorites`, `histories`, `playlists` — no schema change.
- **APIs to implement:** none new.
- **DTOs:** none new — confirm `FavoriteResponseDto`/`HistoryResponseDto`/`PlaylistDetailResponseDto`'s populated film field surfaces `isPublished` so the client can gray out an unpublished entry instead of it silently vanishing.
- **Services:** no logic change — verify `populate('film')` calls don't implicitly filter by `isPublished` (a user's own history/favorites/playlist must still show unpublished films they'd already interacted with).
- **Controllers:** no change.
- **Guards:** no change (already correctly scoped to owner in Phase 0 baseline).
- **Validation:** no change.
- **Swagger:** add `isPublished` to the documented shape of the populated `film` sub-object in these 3 modules' response DTOs.
- **Unit tests:** none new beyond confirming existing coverage still passes against the Phase 4 schema shape.
- **Integration tests:** unpublish a film → it still appears in a user's `GET /favorites`/`GET /histories/recent`/`GET /playlists/:id` (populated with `isPublished:false`) but disappears from all public film-discovery endpoints (cross-check against Phase 4's done criteria).
- **Done criteria:** full regression pass on all three modules against the post-Phase-4 `films` schema; no accidental behavior change.
- **Frontend unlock:** confirms `userdasboard.html`'s favorites/history/playlist sections can safely render an "unavailable" state for unpublished films instead of erroring.

---

## Phase 8 — Avatars PATCH + Upload Module

**Objective:** close the Avatars CRUD gap and stand up real asset uploads so Avatars (and later, Films/Actors/Directors admin forms) stop requiring hand-typed external URLs.

- **Modules:** `AvatarsModule` (`EXISTING`, delta), `UploadModule` (`NEW`).
- **DB collections involved:** `type_avatars`, `img_avatars` (no schema change). Upload is intentionally **stateless** — no new collection by default (§1.8/§24 of `api_design.md` explicitly deferred an optional audit-log collection until there's a real need).
- **APIs to implement:** `PATCH /avatars/types/:id`, `PATCH /avatars/images/:id` *(new)*; `POST /uploads/image`, `DELETE /uploads` *(new)*.
- **DTOs:** `UpdateTypeAvatarDto`, `UpdateImgAvatarDto`; `UploadResponseDto`, `DeleteUploadDto`.
- **Services:** `AvatarsService` — `updateType`/`updateImage`; `UploadService` *(new)* — validates mimetype whitelist (`image/jpeg|png|webp`) and size cap (5MB), strips EXIF, stores to disk/S3-compatible target, returns a URL.
- **Controllers:** `AvatarsController` (extended), `UploadController` (new, uses `FileInterceptor` from `@nestjs/platform-express`, already a dependency).
- **Guards:** `@RequirePermission('avatars:manage')`, `'uploads:create'|'delete'`.
- **Validation:** file mimetype/size checks happen in the service (can't be expressed as a `class-validator` decorator on a multipart body) — must still return the standard 400 envelope on rejection, not a raw Multer error.
- **Swagger:** `@ApiTags('uploads')`, `@ApiConsumes('multipart/form-data')`, `@ApiBody` with a binary `file` schema.
- **Unit tests:** `UploadService` — rejects disallowed mimetype/oversized file with the correct 400 shape; `AvatarsService.updateImage` doesn't change `_id` (so existing `users.avatar` refs stay valid).
- **Integration tests:** upload → use returned URL in `POST /avatars/images` → `GET /avatars/images` reflects it; `PATCH` an avatar type's name doesn't break any user currently referencing an image under it.
- **Done criteria:** every Avatars sub-resource has full CRUD; Upload never persists a file outside the mimetype/size policy.
- **Frontend unlock:** admin content forms (Films poster/thumb, Actors/Directors avatar) can use a real file picker instead of a raw URL field.

---

## Phase 9 — Crawler Permission Rollout + Categories Cron Extension

**Objective:** small, low-risk cleanup — apply the `crawler:run`/`crawler:sync` permission split, and optionally wire the Categories sync into the existing scheduler.

- **Modules:** `CrawlerModule` (`EXISTING`, delta), `CrawlerHistoryModule` (`EXISTING`, no change).
- **DB collections involved:** `crawler_history` (no schema change — already supports arbitrary `source` strings).
- **APIs to implement:** none new — permission annotations only on the 3 existing sync endpoints.
- **DTOs:** none new.
- **Services:** *(optional, explicitly deferred by `api_design.md` §8.3 — not required to ship)* extend `CrawlerSchedulerService`'s `sources` array with a 4th entry (`ophim-categories`, schedule from a new `OPHIM_SYNC_CATEGORIES_CRON` env var) calling `OphimCategorySyncService` from Phase 3 — the array is already built to make this a one-entry change.
- **Controllers:** `CrawlerController` — add `@RequirePermission('crawler:run')` to `POST /crawler/sync/films`, `@RequirePermission('crawler:sync')` to `POST /crawler/sync/film` and `POST /crawler/sync/types`.
- **Guards:** as above.
- **Validation:** none new.
- **Swagger:** no change beyond the already-standard 403 response note.
- **Unit tests:** guard unit test confirming each of the 3 endpoints requires its specific permission key, not just "any admin permission."
- **Integration tests:** *(if the optional cron extension ships)* confirm the new scheduled job registers at boot alongside the existing two, logs identically, and writes to `crawler_history` with `source:'ophim-categories'`.
- **Done criteria:** permission split applied and tested; cron extension either shipped-and-tested or explicitly deferred with a tracked follow-up ticket (not silently dropped).
- **Frontend unlock:** none (internal/admin-only, already covered by existing Crawler admin tooling).

---

## Phase 10 — Dashboard Admin Module

**Objective:** the read-only aggregation layer over everything else — deliberately last among the "new module" phases since it depends on Users (2), Categories/Countries/Directors (3), Films (4), Comments/FilmReports (6), and CrawlerHistory (9) all being in their final shape.

- **Modules:** `DashboardModule` (`NEW`).
- **DB collections involved:** none new — reads `users`, `films`, `comments`, `film_reports`, `crawler_history` via aggregation only.
- **APIs to implement:** `GET /dashboard/overview`, `GET /dashboard/stats`, `GET /dashboard/top-films`, `GET /dashboard/top-users`, `GET /dashboard/recent-activity`, `GET /dashboard/crawler-summary` (§25).
- **DTOs:** `DashboardOverviewResponseDto`, `DashboardStatBucketResponseDto`, `TopUserResponseDto`, `ActivityItemResponseDto`, `QueryDashboardStatsDto{granularity,limit}`, `QueryTopUsersDto{metric,from?,to?}`.
- **Services:** `DashboardService` — one aggregation pipeline per endpoint (`$group`/`$dateTrunc` for `stats`; `$group` by `user` over comments/ratings/histories for `top-users`; simple `countDocuments`/`find().sort().limit()` for the rest); no new denormalized counters added at this stage (§25 business rule — revisit only if read volume demands it).
- **Controllers:** `DashboardController`.
- **Guards:** `@RequirePermission('dashboard:view')` on every route.
- **Validation:** `granularity` restricted to `day|month`; `metric` restricted to its enumerated set per endpoint; `from`/`to` valid ISO 8601 and `from <= to`.
- **Swagger:** `@ApiTags('dashboard')`; document each response DTO shape precisely since these are aggregation results, not simple schema passthroughs.
- **Unit tests:** each aggregation pipeline against a seeded in-memory dataset with known expected output (this is the highest-value test category here — aggregation bugs are silent/wrong-number bugs, not exceptions).
- **Integration tests:** `stats` with `granularity=day&limit=7` vs `granularity=month&limit=12` both correct against a seeded multi-month dataset; `crawler-summary` reflects a mix of `ophim-films`/`ophim-types`/`ophim-categories` sources correctly without per-source code.
- **Done criteria:** every number on `/dashboard/overview` independently verifiable against a raw `countDocuments()` on the same seeded dataset; response times acceptable without caching (caching is a documented future optimization, not a blocker).
- **Frontend unlock:** the admin dashboard landing page — the single highest-value net-new admin screen, and the last major piece before general release.

---

## Phase 11 — Release Hardening

**Objective:** cross-cutting pass across every module before calling the API "done" — not new features, verification and consistency.

- **Modules:** all.
- **DB collections involved:** all — final index-creation audit (every index named in `database_schema.md` Revision 2 actually exists in the deployed DB, including ones added mid-roadmap like `films.isPublished`, `users.roleIds`).
- **APIs to implement:** none new.
- **DTOs:** audit every Response DTO against `api_design.md` for accidental field leaks (esp. `UserResponseDto` never including `password`/`resetPasswordToken(Expires)`/`refreshTokenHash` — re-verify after the Phase 2 migration touched `users`).
- **Services:** none new.
- **Controllers:** none new.
- **Guards:** full sweep confirming every Admin-only endpoint in `api_design.md` has both `@Roles(ADMIN)` *and* its `@RequirePermission()` key (no endpoint left on the old mechanism only).
- **Validation:** apply the full §3.2 validation quick-reference table as a checklist against every DTO; confirm `ObjectId` fail-fast validation is applied globally (custom pipe), not per-DTO ad hoc.
- **Swagger:** full spec regenerated and diffed against `api_design.md`'s ~95 endpoints — zero missing, zero extra ("no redundant API" from the original brief, verified mechanically at the end).
- **Unit tests:** coverage report reviewed for gaps introduced across Phases 1–10.
- **Integration tests:** full e2e suite run end-to-end (register → login → browse → favorite → comment → rate → admin-moderate → dashboard-reflects-it) as one coherent smoke scenario, not just per-module tests in isolation.
- **Done criteria:**
  - `database_schema.md`/`api_design.md` vs actual deployed schema/routes: zero drift (the staleness flagged in `api_design.md` §1.12/§0.4 is resolved by this point since the docs were the spec all along).
  - `backend.md`'s original Redis/BullMQ plan explicitly reconciled in docs (either implemented, or `backend.md` updated to reflect the deliberate `p-limit`-only deviation already shipped — pick one, don't leave it ambiguous).
  - Security pass: rate limits present on login/register/forgot-password/comment-create/report-create; `helmet`+CORS whitelist confirmed in prod config; no endpoint returns a raw stack trace on error (verified via `HttpExceptionFilter`).
  - Seed scripts (`admin` user, RBAC roles/permissions, initial Categories sync) run cleanly on a fresh database.
- **Frontend unlock:** general availability — every page in `project.md` §5 plus the net-new admin screens (Roles/Permissions, Categories/Countries/Directors, Notifications, Dashboard, Upload) has a complete, stable backend contract to build against.

---

## Appendix — Complexity rationale (why each High is High)

- **Phase 2 (RBAC):** introduces a second, cross-cutting auth guard that every future admin endpoint must correctly wire; migrates every existing user document; a mistake here is a security bug (wrong permission grant), not a UI bug.
- **Phase 3 (Taxonomy):** renames a live collection (`types`→`categories`) with existing production-shaped data, plus a real external HTTP integration (Ophim) with its own failure modes (network down, upstream shape drift, partial results).
- **Phase 4 (Films Core):** the single most heavily-referenced collection in the schema; migrating free-text `country`/`director` into resolved refs requires a deduplication/normalization decision (near-duplicate strings) that has real data-quality consequences if gotten wrong, and it's the one module every other module (Favorites, Histories, Playlists, Comments, Ratings) reads through `populate()`.

Everything else is Medium or Low because it's either purely additive (new collection, no migration, no cross-cutting guard) or genuinely read-only (Dashboard).
