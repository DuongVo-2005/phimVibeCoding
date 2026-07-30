# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] - 2026-07-30

### Added
- **Episode Management** (`backend/src/episodes`, admin UI in `EpisodeManagement.tsx`) — admin CRUD + reorder for a film's episodes via a new, independent `episodes` collection (`GET/POST /films/:filmId/episodes`, `PATCH/DELETE /episodes/:id`, `PATCH /episodes/:id/order`). Intentionally decoupled from the pre-existing embedded `Film.episodes` used by the crawler and the public watch page — see *Known Limitations*.
- **In-app Notifications** (`backend/src/notifications`, `NotificationBell.tsx`, `/user/thong-bao`) — `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`, `DELETE /notifications/:id`, all scoped server-side to the current user.
- **Email Verification** (`backend/src/mail`, `backend/src/auth`, `/xac-thuc-email`) — `POST /auth/send-verification-email`, `POST /auth/resend-verification-email`, `GET /auth/verify-email?token=`; first real outbound-email infrastructure (`MailService`, SMTP via `nodemailer`), with a dev-only console-log fallback when `MAIL_HOST` is unset.
- **Admin Dashboard** (`backend/src/dashboard`, `AdminDashboardView.tsx`) — `GET /dashboard/{overview,charts,top-lists,recent-activity}`, aggregation-based stats (no per-item N+1 queries).
- **Real File Upload** (`backend/src/uploads`, `ImageUpload.tsx`) — `POST /uploads/image` (multipart, memory-storage, 5MB policy limit / 10MB hard Multer cap, jpeg/png/webp allow-list), `DELETE /uploads`. Additive to the existing URL-text inputs on poster/thumbnail/avatar fields, not a replacement.
- `PUBLIC_BASE_URL`, `FRONTEND_URL`, `JWT_EMAIL_VERIFICATION_SECRET`, `JWT_EMAIL_VERIFICATION_EXPIRES`, and the `MAIL_*` block added to `backend/.env.example`.

### Fixed
- `UsersService.updatePassword` threw `ConflictException` (409) for an incorrect current password instead of `UnauthorizedException` (401) — inconsistent with the identical failure case in `AuthService.login`. (`backend/src/users/users.service.ts`)
- A backend e2e test (`isActive=false` filter) still asserted the *old, buggy* behavior of a cast bug that had already been fixed in a prior release — the app was correct, the test was stale and passing for the wrong reason. Corrected the assertion to check the actually-fixed, correct behavior. (`backend/test/users-admin.e2e-spec.ts`)
- One backend ESLint error (`prefer-const` on a never-reassigned `let`). (`backend/src/categories/ophim-category-sync.service.ts`)

### Changed
- `backend/README.md`: corrected the module folder-structure listing (was missing 11 modules added since it was last written, including a stale `types/` entry from before the categories rename); added a one-line note that `MAIL_HOST` can stay empty for local dev.
- Bumped `backend/package.json` and `frontend/package.json` to `1.1.0`.

## [1.0.0] - undated (see git history)

Backfilled summary from the previous `RELEASE_NOTES.md` for historical context — see that file's git history for the full document.

### Added
Full admin panel (Movie/Category/Country/Actor/Director/Comment moderation/User/Role & Permission/Avatar management) and public Forgot/Reset Password.

### Fixed
`sourceSlug` unique-index conflict on category creation; `isActive` filter cast bug (users & categories); ReDoS-able unescaped regex on search endpoints; shadowed `max-w-*` Tailwind scale; broken label/input association in `Input`/`Select`; duplicate-key React warning on merged category lists; `HlsPlayer.tsx` formatting drift.
