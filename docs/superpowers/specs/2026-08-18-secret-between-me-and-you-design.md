# Secret page (`/secret-between-me-and-you`) — Design

**Date:** 2026-08-18  
**Status:** Approved

## Goal

Unlisted student page for an easter-egg flow: claim once per account, first claim redirects to a YouTube rickroll, later visits show the QR for the quest **“Find an Easter Egg in the Website!”**.

## Requirements

| Decision | Choice |
|---|---|
| Route | `/secret-between-me-and-you` (unlisted; not in Navbar/BottomNav) |
| Auth | Must be logged in → else redirect `/login` |
| Claim scope | Once per student (`SecretClaim` row, unique `studentId`) |
| First click | Mark claimed → redirect to YouTube |
| Later visits | Show quest QR from `Quest.qrCode` |
| QR storage | On existing Quest titled `Find an Easter Egg in the Website!` (`qrCode` data-URL column) |
| Warning | Large “don’t share with anyone else” copy |
| Shell | `PageWrapper` (header + footer nav) |

YouTube URL:

`https://www.youtube.com/watch?v=DLzxrzFCyOs&list=RDDLzxrzFCyOs&start_radio=1`

## Data

### `SecretClaim`

- `id` text PK  
- `studentId` text unique FK → `Student.id` ON DELETE CASCADE  
- `claimedAt` timestamptz default now()  
- RLS on, no policies (service-role only), matching other tables  

### Quest QR seed

One-shot script reads `public/images/qr-find-an-easter-egg-in-the-website!.png`, writes a `data:image/png;base64,…` into that quest’s `qrCode`, then the file can be removed from `public/` so it is not a static asset. Does not regenerate `qrToken` (assumes the PNG already matches the quest’s live token, or admin fixes token separately).

## API

- `GET /api/secret` — session required → `{ claimed, qrCode | null }`  
- `POST /api/secret/claim` — session required → insert claim if missing → `{ youtubeUrl }` (idempotent if already claimed: still returns URL / 200 with `alreadyClaimed`)

## UI

- Logged-in page with game styling  
- Big warning text  
- Unclaimed: wood/pixel button “Claim secret code”  
- Claimed: QR `<img>` from API `qrCode`  

## Out of scope

- Linking from dashboard/nav  
- Points / auto-complete quest on claim  
- Admin UI for the claim table  
