@AGENTS.md

# Overtime

Bilingual (ar-RTL/en) Next.js 16 marketplace MVP. Key seams:

- `src/lib/i18n.ts` — all UI strings live in the `ar`/`en` dictionaries; add
  keys to BOTH. Locale comes from the `locale` cookie (default `ar`).
- `src/lib/enums.ts` — status strings stored in SQLite (no native enums).
- `src/lib/payments/` — `gateway.ts` is the only place that talks to payment
  providers; `escrow.ts` holds the domain logic. Never hold funds directly.
- Server actions in `src/app/actions/*`; pages are server components.
- Contract templates are DB content edited from `/admin/contract`; accepted
  offers snapshot the template into `Contract.body` — never mutate those.

Workflow: `npx prisma db push && npm run db:seed` after schema changes;
`npm run lint && npm run build` before committing. OTP is `123456` in dev.
