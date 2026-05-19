# Cloudflare Pages Frontend Deployment

This guide documents the steps required to deploy the compiled Vite frontend to **Cloudflare Pages** and configure the environment variable integration.

---

## 🏗️ 1. Prerequisites

1. Your code must be pushed to a **GitHub repository** (see [GitHub Setup Guide](github-setup.md)).
2. You must have a **Cloudflare account** (free tier is fully sufficient).

---

## 🚀 2. Deploying via Cloudflare Dashboard

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. On the left navigation pane, select **Workers & Pages** -> **Pages** tab.
3. Click the **Create a project** button, then select **Connect to Git**.
4. Log in with your GitHub account, select your repository (e.g. `ergoflow-ai`), and click **Begin setup**.
5. Configure the Build Settings:
   *   **Project name**: `ergoflow-ai` (or your custom sub-domain name).
   *   **Production branch**: `main`
   *   **Framework preset**: Choose **`Vite`** (or select **`None`**).
   *   **Build command**: **`npm run build`**
   *   **Build output directory**: **`dist`**
   *   **Root directory**: Leave blank `/` (since the project is in the root directory).

---

## ⚙️ 3. Environment Variables Configuration

Before hitting "Save and Deploy", configure the environment variables that connect the frontend to your Google Sheets backend:

1. Click on the **Environment variables (advanced)** toggle.
2. Add the following production keys and their respective values (obtained from your Google Sheets backend deployment):
   *   **`NEXT_PUBLIC_GOOGLE_SCRIPT_URL`**: `https://script.google.com/macros/s/.../exec`
   *   **`NEXT_PUBLIC_GOOGLE_SHEET_ID`**: `your-google-sheet-id`
   *   **`NEXT_PUBLIC_APP_ENV`**: `production`

> [!IMPORTANT]
> Because these are exposed to the client in the compiled bundle, they must be prefixed with `NEXT_PUBLIC_` (which is mapped to Vite via our custom `envPrefix` in `vite.config.js`).

3. Click **Save and Deploy**.

---

## 🔄 4. Post-Deployment Verification

1. Once the build process finishes (typically takes less than a minute), Cloudflare will issue a unique project subdomain:
   `https://ergoflow-ai.pages.dev`
2. Visit the URL to confirm the dashboard loaded.
3. Open Developer Tools (`F12` -> Console) to verify that no compilation or configuration errors exist.
4. Try submitting a REBA/RULA postural form or creating an Engineering Change Request (ECR) to verify it propagates correctly to your active Google Sheets document.
