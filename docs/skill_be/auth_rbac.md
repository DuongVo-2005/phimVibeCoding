# Authentication & RBAC Skill

## Overview
Implementation of secure authentication flows and granular Role-Based Access Control (RBAC).

## Core Competencies
- **JWT Authentication**: Secure token-based access with global guards.
- **Permission Decorators**: Using `@Permission()` on controller methods for declarative access control.
- **Permission Syncing**: Automated registration of permissions into the database via `npm run permissions:sync`.
- **2FA Integration**: Supporting Two-Factor Authentication (TOTP) for enhanced security.
- **IP Whitelisting**: Restricting access based on user-specific IP whitelist configurations.

## Key Files & Patterns
- `src/system-modules/system-management/auth/`: Core authentication logic.
- `PermissionAction` & `Permission` decorator: Defining access rules.
- `src/system-modules/system-management/roles/`: Role management and module association.
