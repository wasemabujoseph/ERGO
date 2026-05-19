# ErgoFlow AI — Enterprise Ergonomics Governance Portal

ErgoFlow AI is a high-fidelity, cloud-hosted SaaS prototype designed to assess, audit, and track workplace ergonomics using standard compliance metrics (REBA, RULA, NIOSH Lifting Equation, Push/Pull Force) and Gemini-powered visual diagnostics.

This repository is optimized for **lightweight cloud deployment** without complex database servers (e.g. PostgreSQL/Prisma). Instead, it uses **Cloudflare Pages** for static frontend hosting and **Google Sheets** as a lightweight serverless database, mediated by a **Google Apps Script Web App API Proxy**.

---

## 🏗️ Architecture

```mermaid
graph TD
  A[Client Browser (Vite/React)] -->|GET/POST CORS Requests| B(Google Apps Script API Web App)
  B -->|Append/Update/Read| C[Google Sheet Database]
  D[Client Browser (Vite/React)] -->|POST Image & Posture Task| E[Gemini API]
  A -->|Fallback Mode| F[LocalStorage Cache]
```

1. **Frontend**: React 19 SPA powered by Vite 8 and Tailwind CSS v4.
2. **Hosting**: Cloudflare Pages (fully serverless and static, served from edge).
3. **Database**: Google Sheets (Workstations, Assessments, CorrectiveActions, AIInsights, etc.).
4. **API Proxy**: Google Apps Script acting as a lightweight, secure CORS-enabled API gateway.
5. **AI Vision Wizard**: Native Gemini 1.5 Flash API calls for blueprint CAD postural checks (direct client-side key config).
6. **Resiliency**: Built-in fallback to `localStorage` caches if Google Sheets credentials are not configured or offline.

---

## 📂 Project Structure

```
├── .env.example              # Template environment variables
├── .env.local                # Local environment overrides
├── .gitignore                # Production-ready git ignore paths
├── package.json              # React, Recharts & Tailwind configuration
├── vite.config.js            # Vite build rules & envPrefix loader
├── wrangler.toml             # Cloudflare Pages deployment configuration
├── docs/                     # Step-by-step deployment manuals
│   ├── github-setup.md
│   ├── cloudflare-pages-deploy.md
│   └── google-sheets-backend.md
├── src/
│   ├── App.jsx               # Main React dashboard & views
│   ├── main.jsx              # App mount point
│   ├── index.css             # Tailwind v4 globals
│   ├── lib/
│   │   └── googleSheets.ts   # Sheets communications client
│   └── services/             # API abstraction services
│       ├── workstations.service.ts
│       ├── assessments.service.ts
│       ├── corrective-actions.service.ts
│       └── ai-insights.service.ts
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
# Google Sheets Integration
NEXT_PUBLIC_GOOGLE_SHEET_ID=your-google-sheet-id-here
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/your-deployment-id/exec
NEXT_PUBLIC_APP_ENV=development
```

*Note: Vite config is customized to expose `NEXT_PUBLIC_` prefixed environment variables to the browser bundle.*

---

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the development server**:
   ```bash
   npm run dev
   ```
3. **Build the production bundle**:
   ```bash
   npm run build
   ```
   *Output compiles to `dist/`, ready for Cloudflare deployment.*

---

## 🚀 Deployment Guides

For step-by-step instructions on setting up each component, refer to the documentation files in the `docs/` folder:

*   [GitHub Preparation & CI/CD](docs/github-setup.md)
*   [Google Sheets Database & Apps Script API](docs/google-sheets-backend.md)
*   [Cloudflare Pages Deployment](docs/cloudflare-pages-deploy.md)
