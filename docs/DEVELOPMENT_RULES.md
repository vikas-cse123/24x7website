# DEVELOPMENT_RULES

Strict development rules for **24x7Chhutti**. Apply these to every change.

## Core rules
- **Keep changes focused.** Make the smallest appropriate change for the task.
- **Avoid unnecessary dependencies.** Only install what is actually needed, and
  prefer mature, widely-used packages.
- **Reuse components.** Build and use reusable components rather than duplicating
  markup.
- **Avoid duplicated logic.** Factor shared logic into services/hooks/utilities.
- **Validate API input.** Validate all request bodies/params/queries server-side.
- **Handle errors properly.** Use the central error-handling middleware and the
  consistent response envelope.
- **Never commit secrets.** No keys, passwords, or tokens in code or committed
  files.
- **Keep `.env.example` updated.** Whenever environment variables change, update
  `.env.example`.
- **Avoid destructive database operations.** No drops/clears/removes without
  approval.
- **Document architectural decisions.** Log changes in `docs/DECISIONS.md`.
- **Test important functionality.** Verify important behaviour before claiming it
  works.
- **Do not claim something works unless verified.** Report honestly what was and
  was not verified.
- **Do not mark unfinished work as completed.** Keep status accurate in docs.
- **Do not delete existing project assets without approval.** This includes
  `logo.jpg` and any working code.

## Hard rules (never violate)
- Never switch MongoDB to PostgreSQL.
- Never switch React/Vite to Next.js.
- Never replace Express.
- Never replace the selected stack without approval.
- Never rewrite working functionality unnecessarily.
- Never delete existing functionality just because another implementation is
  preferred.
- Never delete, rename, replace, or modify `logo.jpg`.

## Before significant changes
1. Read `AGENTS.md`.
2. Read the relevant docs in `docs/`.
3. Read `docs/CURRENT_STATE.md`.
4. Inspect the existing implementation.
5. Understand the current architecture.
6. Make the smallest appropriate change.
7. Verify the change.
8. Update documentation when necessary.
9. Update `CURRENT_STATE.md` after meaningful milestones.
