# OP Onboarding Pages

Static GitHub Pages frontend for OP Onboarding.

The application has no bundled onboarding records. After authentication it reads all workspace content and assets from `https://bara-shaban.workers.dev`.

## Local check

```bash
npm ci
npm run check
```

Push to `main` to publish through the GitHub Actions Pages workflow. In the repository settings, choose **GitHub Actions** as the Pages source.
