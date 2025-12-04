# CoinDrop System Overview

- Purpose: Personal finance management with budgets, wallets, transactions, savings, education content, and AI assistance.
- Stack: React + Vite frontend; Express + Mongoose backend; MongoDB; Cloudinary for images; JWT auth; Winston logging.
- Key Domains: Auth, Wallets, Budgets, Transactions, Categories, Savings Accounts & Goals, Savings Rules, Education posts, Reports, Images, AI chatbot.

## Architecture

```
-------------------+           HTTP/JSON           +---------------------+
|      Frontend     |  Axios (`src/api/userAxios`)  |       Backend       |
| React + Redux     +-------------------------------> Express API         |
| Vite build        |                               | Mongoose + MongoDB  |
-------------------+                               | Cloudinary uploads  |
        |                                           | JWT auth middleware |
        | React Router (`src/routes.jsx`)           | Rate limiting       |
        v                                           | Validation layer    |
   UI Components                                    +----------+----------+
        |                                                       |
        | Redux slices (`src/slices/*`)                         |
        v                                                       v
   Services (`src/services/*`)                         Models (`backend/models/*`)
```

## Modules

- Backend API base: `server.js` mounts under `/api/*` (backend/server.js:52)
- Auth & profile: `backend/routes/authRoutes.js`, `backend/routes/profileRoutes.js`
- Finance: wallets, budgets, transactions, categories
- Savings: accounts, goals, automation rules
- Content: education posts, images
- AI: `zhipuaiRoutes` with context services
- Reports: generation and download endpoints

## Data Flow

- Frontend services call REST endpoints; responses hydrate Redux slices.
- JWT stored in `localStorage`; auto-refresh via interceptor (`src/api/userAxios.js`:32).
- Mongoose models enforce schema; controllers implement business logic.

## Quick Links

- API Overview: `/documentation/api_overview.md`
- Backend Architecture: `/documentation/backend.md`
- Frontend Architecture: `/documentation/frontend.md`
- Services Layer: `/documentation/services.md`
- Data Models: `/documentation/data_models.md`
- Security: `/documentation/security.md`
- Environment: `/documentation/environment.md`
- Deployment: `/documentation/deployment.md`
