# Database & Transaction Management Skill

## Overview
Proficiency in managing PostgreSQL databases using TypeORM with a focus on transaction integrity and centralized data access.

## Core Competencies
- **Transaction-Aware Service**: Utilizing `DatabaseService` for all CRUD operations instead of direct repository injection.
- **Transaction Pattern**: Using `withTransaction` to ensure atomicity across multiple entity operations.
- **Migration-Driven Schema**: Managing database changes through structured TypeORM migrations.
- **Seeding**: Implementing database seeds for initial system setup (e.g., Super Admin creation).

## Key Files & Patterns
- `src/common/services/database.service.ts`: Centralized database access.
- `src/database/migrations/`: Timestamped schema changes.
- `src/database/seeds/`: Initial data population scripts.
- `src/config/database.config.ts`: Database connection settings.
