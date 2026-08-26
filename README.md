# Overtime — الفريق اللي ما عندك / The team you don't have

A bilingual (Arabic RTL / English) marketplace connecting Qatar's one-person
companies with remote independent professionals — accounting & invoicing,
virtual assistance, and essential marketing — priced in Qatari Riyal, with
escrow-style payments designed around QCB-licensed gateways and contracts
built to track Qatar Labour Law No. 9 of 2026.

This is the MVP web app from the product spec: marketplace (post task →
compare offers → escrow → deliver → release) plus monthly retainer packages,
a provider app, and an admin panel.

## Stack

- **Next.js 16** (App Router, server components + server actions) + **Tailwind 4**
- **Prisma 6** on SQLite for development — the schema is written to port to
  PostgreSQL unchanged (spec §9)
- Full i18n from day one: cookie-based `ar`/`en` locale, RTL/LTR layout,
  Eastern Arabic numeral formatting via `Intl`
- Modular payment seam: `src/lib/payments/gateway.ts` defines the
  `PaymentGateway` interface; the mock gateway runs the demo, and Dibsy/Fatora
  adapters slot in behind the same interface once a QCB-licensed partner and
  the permitted escrow structure are confirmed (spec §7)

## Getting started

```bash
npm install
cp .env.example .env
npx prisma db push      # create the SQLite database
npm run db:seed         # categories, packages, contract template, demo accounts
npm run dev
```

### Demo accounts (OTP is always `123456`)

| Role | Login |
|---|---|
| Client (صاحب عمل) | `+97455551234` |
| Provider — verified accountant | `+97455550001` |
| Provider — VA | `+97455550002` |
| Provider — pending verification | `+97455550003` |
| Admin | `admin@overtime.qa` |

New phone numbers / emails go through registration (choose client or provider).

## What's implemented

**Client app** — OTP login, onboarding survey with category suggestion,
dashboard, post task, compare offers (with verified badge + ratings), accept &
pay into escrow (contract snapshot generated from the admin template), in-task
chat with attachment links, approve delivery → release payment, disputes,
mutual reviews, retainer subscribe/cancel with hours tracking, wallet &
payment history.

**Provider app** — profile builder, "موثّق" verification request, browse open
tasks by category, submit/update offers, active & completed tasks, deliver
work, earnings (available vs pending release, 12% commission) and withdrawal
requests, availability & category settings.

**Admin panel** — user list, verification approve/reject, dispute resolution
(release to provider / refund client — moves the escrow), revenue report
(gross volume, commissions, MRR, active subscriptions), category & package
management, and the contract template editor — so the standard contract can be
updated the day the executive regulations of Law 9/2026 are issued, without a
code change. Signed contracts are immutable snapshots.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm run db:push` | sync Prisma schema to the database |
| `npm run db:seed` | seed demo data (idempotent) |
| `npm run e2e` | end-to-end smoke test (needs a running server on :3100 and Chromium; set `CHROME_PATH`) |

## Deliberately out of MVP scope

Real SMS/WhatsApp OTP delivery, real payment gateway credentials, file
uploads (attachments are links), recurring billing jobs, push notifications,
and the mobile app (spec recommends web-first). The seams for each are in
place.

> هذه نسخة تجريبية للتخطيط التقني وليست استشارة قانونية — راجع مختصاً بقانون
> العمل والفينتك القطري قبل الإطلاق الفعلي (spec §7).
