# FIFA 2026 Predictions — Entain Internal

A fun internal predictions platform for Entain employees to predict FIFA 2026 match outcomes using virtual "Entain Points".

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: JSON file storage
- **Auth**: JWT-based authentication

## Getting Started

### Backend

```bash
cd server
npm install
npm run seed   # Seeds the database with FIFA 2026 data
npm start      # Starts on http://localhost:3001
```

### Frontend

```bash
cd client
npm install
npm run dev    # Starts on http://localhost:5173
```

## Default Users (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@entaingroup.com | admin123 | admin |
| karan.desai@entaingroup.com | user123 | user |

## Features

- Predict FIFA 2026 match outcomes with Entain Points
- Company-wide leaderboard
- Match schedule with groups and knockout rounds
- Prediction history tracking
- Admin panel for managing matches and settling results
