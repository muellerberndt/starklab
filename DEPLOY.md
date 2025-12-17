# Deploying to floatingpragma.io/starklab

Since you want to host this at `floatingpragma.io/starklab` (a subdirectory), **GitHub Pages** is the easiest and cheapest (free!) way.

## 1. Prepare GitHub
Since `floatingpragma.io` is your custom domain, you likely want one of two setups:

### Scenario A: You already have a "User Site" for `floatingpragma.io`
If you already have a repository named `muellerberndt.github.io` (or similar) serving your main website:
1.  Create a **new repository** named `starklab` (or `stark-lab`).
2.  Push this code to that repository.
3.  Go to **Settings > Pages**.
4.  Your site will automatically be available at `floatingpragma.io/starklab` because it's a "Project Site" under your user account!

### Scenario B: This is your first/only site
If you don't have a main site yet, you still create the repository (e.g., `stark-lab`), configure the custom domain in settings, and it will work.

## 2. Deploy Script
We have already configured `vite.config.ts` with `base: '/starklab/'`.

Now, run these commands to deploy:

```bash
# 1. Initialize git if you haven't
git init
git add .
git commit -m "Initial commit"

# 2. Rename the branch to main
git branch -M main

# 3. Add your remote (replace with your actual URL)
git remote add origin https://github.com/muellerberndt/stark-lab.git

# 4. Install the deploy tool
npm install gh-pages --save-dev
```

Add this script to your `package.json`:

```json
"scripts": {
  "deploy": "gh-pages -d dist"
}
```

Then simply run:

```bash
npm run build
npm run deploy
```

## Summary
1.  **Repo Name**: Create a repo named `stark-lab` (or whatever matches your desired URL path).
2.  **Config**: I have already set `base: '/starklab/'` in the code.
3.  **Domain**: Ensure `floatingpragma.io` is configured in your GitHub account or main User Repository settings.
