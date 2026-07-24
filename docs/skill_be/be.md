# SEO_ALL_BE Project Structure

## Root Directory
- `.github/`: CI/CD workflows.
- `.husky/`: Git hooks for linting and formatting.
- `dist/`: Compiled production code.
- `docs/`: Project documentation.
- `public/`: Static files served at the root path.
- `scripts/`: Maintenance and utility scripts.
- `src/`: Source code.
- `skill/`: Project-specific skills and competencies.

## Source Code Structure (`src/`)
- `common/`: Shared services, decorators, filters, guards, interceptors, and pipes.
  - `services/database.service.ts`: Transaction-aware database handler.
- `config/`: Application, database, CORS, and timezone configurations.
- `cronjods/`: Scheduled tasks and automation logic.
- `database/`: Migrations and seeds.
- `entities/`: TypeORM entity definitions.
- `system-modules/`: Vertical slices of business logic.
  - `system-management/`: Users, Roles, Permissions, Auth, Settings.
  - `business/`: SEO Flows, Links, Statistics.
  - `ticket-domain/`: Domains, Suppliers.
  - `seolatop/`: Tasks, Projects, Budgets.
  - `cloud/`: VPS, Cloud Accounts, Orders.
  - `seomarket88/`: Marketing UI and Payments.
  - `common/`: Shared domain modules (Producers, Files).
- `app.module.ts`: Main entry point module.
- `main.ts`: Application bootstrap.

## Important Scripts
- `npm run start:dev`: Start development server.
- `npm run db:create`: Initialize database.
- `npm run migration:run`: Execute pending migrations.
- `npm run permissions:sync`: Synchronize `@Permission` decorators with DB.
- `npm run seed:run`: Populate initial system data.
