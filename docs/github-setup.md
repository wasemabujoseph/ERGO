# GitHub Repository Preparation & Setup

This guide walks you through preparing and pushing the **ErgoFlow AI** codebase to GitHub for version control and automated deployments.

---

## 🔒 1. Security Check

Before adding any files, ensure that sensitive configuration parameters and credentials are NOT tracked by Git.

Verify that the `.gitignore` contains the following exclusions:
```gitignore
# Environment files
.env.local
.env.development.local
.env.test.local
.env.production.local
*.local

# Dependencies
node_modules/

# Build outputs
dist/
.next/
build/
```

> [!IMPORTANT]
> Never commit your active API keys or actual Google script deployment URLs to public files. Always use `.env.local` for local secrets and configure production values directly in your hosting dashboard.

---

## 🛠️ 2. Git Initialization

Run the following commands in your terminal from the root folder of the project (`new-one-ergo` / project root):

1. **Initialize Git repository**:
   ```powershell
   git init
   ```

2. **Add all files to stage**:
   ```powershell
   git add .
   ```

3. **Check the status to ensure excluded files are ignored**:
   ```powershell
   git status
   ```
   *Make sure `node_modules/`, `dist/`, and `.env.local` are NOT listed in the changes to be committed.*

4. **Commit the files**:
   ```powershell
   git commit -m "feat: init cloud-ready ErgoFlow AI portal with Google Sheets and Cloudflare Pages configuration"
   ```

---

## 🚀 3. Push to GitHub

1. Create a new repository on your GitHub account (named `ergoflow-ai` or similar). Do NOT initialize it with a README, license, or gitignore (as we already have them).

2. Link your local project to the GitHub remote repository:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ergoflow-ai.git
   ```

3. Rename your default branch to `main` (if it isn't already):
   ```powershell
   git branch -M main
   ```

4. Push the branch to GitHub:
   ```powershell
   git push -u origin main
   ```

---

## 🤖 4. Continuous Integration (CI/CD)

Once your codebase is on GitHub, you can link it directly to Cloudflare Pages. Whenever you push new commits to the `main` branch:
*   Cloudflare Pages detects the push automatically.
*   It spins up a serverless runner, fetches your latest code, installs dependencies (`npm install`), runs the build script (`npm run build`), and deploys the new version globally in seconds.
