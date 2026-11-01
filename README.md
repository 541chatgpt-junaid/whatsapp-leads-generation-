# JM Lead Dashboard

JM Digital Marketing ke liye lead generation CRM — Next.js 14.

## Kya hai is me
- Overview stats: total leads, kitne msg bheje, kitne replies, reply rate, hot leads, follow-up due
- Today's WhatsApp cap tracker: aaj bheje / 10
- Har lead ka full record: business, person, WhatsApp, city/country, niche, source, website/GMB status, gap/observation
- Outreach record: kis date ko, kis channel se, Variant A/B, kya msg bheja
- Reply record: reply kab aya, type, lead ne exactly kya kaha
- Demo record: status, link, personalized hai ya nahi, price demo ke sath clear tha ya nahi, closing question
- Deal record: quoted price, next action, follow-up date/count, notes, puri timeline/history
- Views: All Leads (cards), Pipeline/Kanban, Follow-up Due, Hot Leads
- Search + filter (country / stage), New lead add, kisi bhi lead ko edit/delete, CSV export
- Data browser ke localStorage me auto-save hota hai (seed data pehli dafa load hota hai — aapke asal Oct 2026 leads)

## Chalana
```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy (aapka Vercel workflow)
Is folder ko apne Vercel + Claude Code setup me import/deploy kar dein — `npm run build` verified hai.

## Note
Ye single-user dashboard hai — data isi browser/device par save hota hai. Agar kabhi multi-device / login wala version chahiye ho to backend (Supabase waghera) add karna hoga.
