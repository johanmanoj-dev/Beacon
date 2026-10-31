# Agent Guidelines & Operational Rules

## 1. Git & Version Control Policy (Strict)
- **DO NOT automatically commit, push, or pull**: Never run `git commit`, `git push`, `git pull`, or branch switching commands automatically.
- All Git operations must be left strictly to the user, or executed **only** when explicitly requested in a prompt.
- Do not add pre-commit hooks or automated scripts that alter Git status without user confirmation.

## 2. Hackathon Architecture & Team Division
- **Repository Root**: `e:\odoo\Becon`
- **Team**: Johan, Elsa, Goutham (8-hour hackathon timeframe).
- **Directory Isolation (Zero Merge Conflicts)**:
  - **Johan (`feature/johan-core-subs`)**:
    - Backend: `com.brightloop.auth`, `com.brightloop.catalogue`, `com.brightloop.subscriptions`
    - Frontend: `frontend/src/features/catalogue/`
  - **Elsa (`feature/elsa-billing-payments`)**:
    - Backend: `com.brightloop.billing`, `com.brightloop.invoices`, `com.brightloop.taxes`, `com.brightloop.discounts`, `com.brightloop.payments`
    - Frontend: `frontend/src/features/billing/`
  - **Goutham (`feature/goutham-ui-portal`)**:
    - Backend: `com.brightloop.analytics`
    - Frontend: `frontend/src/components/ui/`, `frontend/src/features/portal/`, `frontend/src/features/analytics/`, `frontend/src/layout/`

## 3. Technology & Compliance Rules (`rules.md`)
- **Database**: Local MySQL running on XAMPP (`localhost:3306`), database `brightloop_db`.
- **No Third-Party Cloud BaaS**: Zero reliance on Firebase, Supabase, MongoDB Atlas, Clerk, or Stripe.
- **Dynamic Data Exchange Only**: All UI tables, metrics, and forms must communicate with dynamic database-backed REST endpoints (`/api/v1/...`). Never hardcode static JSON mocks in frontend components.
- **UI Design System**: Clean, professional B2B SaaS light theme (Navy `#0F172A` / `#1E3A8A` primary, Slate `#F8FAFC` background, white surface cards, Inter typography, restrained status badges).
- **Validation**: Strict inline validation and clear error feedback on user inputs (client and server).
