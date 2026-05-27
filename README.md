# Ajanvaraus

Dark modern reservation-system starter built with Next.js and a file-backed data store.

## Run

```bash
npm install
npm run dev
```

## Default login

- Username: `admin`
- Password: `admin`

## Seed data

- Host: `host` / `host123`
- Client: `client` / `client123`

## Notes

- Data persists in `data/app-data.json`.
- Invite-based client signup is available at `/signup`.
- This is the first implementation slice; reservation rules, notifications, analytics, and approvals are wired into the model and UI foundation, with more workflow hardening to follow.
