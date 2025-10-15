# GitHub Actions Deployment for TanStack Start + Cloudflare Workers

**Link:** https://gist.github.com/slawton3/509f61c8e764e544d063cdd93b53c363

**Type:** GitHub Gist (Guide)

## Overview
Comprehensive guide for deploying TanStack Start applications to Cloudflare Workers using GitHub Actions. Includes secure secret management and CI/CD pipeline setup.

## Key Features
- **CI/CD Pipeline:** Complete GitHub Actions workflow
- **Secure Deployment:** Proper secret management
- **TanStack Start:** Specific configuration for the framework
- **Cloudflare Workers:** Optimized deployment process
- **Step-by-step Guide:** Detailed implementation

## Repository Stats
- **Stars:** 20 ⭐
- **Forks:** 1
- **Last Updated:** April 2025
- **Author:** slawton3

## Technologies Covered
- **Framework:** TanStack Start
- **Deployment:** Cloudflare Workers
- **CI/CD:** GitHub Actions
- **Security:** Cloudflare API tokens
- **Build:** Vite + Vinxi

## Setup Process
1. **Cloudflare API Token:** Create token with Workers permissions
2. **GitHub Secrets:** Add CF_API_TOKEN and CF_ACCOUNT_ID
3. **Workflow File:** Create `.github/workflows/deploy.yml`
4. **App Config:** Update `app.config.ts` for Workers
5. **Dependencies:** Install `@cloudflare/vite-plugin` and `unenv`

## GitHub Actions Workflow
```yaml
name: Deploy to Cloudflare Workers
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
```

## Configuration Requirements
```typescript
// app.config.ts
import { cloudflare } from 'unenv'

export default defineConfig({
  server: {
    preset: 'cloudflare-module',
    unenv: cloudflare,
  },
  // ... other config
})
```

## Security Considerations
- **API Tokens:** Use Cloudflare API tokens (not global keys)
- **Permissions:** Minimal required permissions
- **Secrets:** Store in GitHub repository secrets
- **Branch Protection:** Deploy only from main branch

## Use Cases
- Automated deployments
- Preview deployments
- Multi-environment setups
- Team collaboration workflows
- Production CI/CD pipelines

## Pros
- ✅ Complete CI/CD solution
- ✅ Security best practices
- ✅ TanStack Start specific
- ✅ Step-by-step instructions
- ✅ Production ready

## Cons
- ❌ GitHub Actions specific
- ❌ Cloudflare focused only
- ❌ No other deployment platforms

## Integration with Stack
- **TanStack Start:** Primary framework
- **Hono:** Can be integrated for API routes
- **ShadCN:** Frontend components (separate)
- **Cloudflare Workers:** Direct deployment

## Learning Curve
- **Beginner:** Medium (requires GitHub Actions knowledge)
- **Intermediate:** Low (good documentation)
- **Advanced:** Low (standard practices)

## Community & Maintenance
- Popular gist (20 stars)
- Recent updates (April 2025)
- Active community
- Well-documented

## Best For
- Teams using GitHub for development
- Projects requiring automated deployment
- Organizations with CI/CD needs
- Production applications
- Multi-developer teams

## Last Updated
April 2025

## Recommendation
Essential resource for any serious TanStack Start + Cloudflare Workers project. Provides production-ready deployment automation with security best practices.