# Authentication System

This authentication system is designed to be flexible and work with multiple OAuth providers, removing vendor lock-in.

## Supported Providers

### 1. Replit Auth (Current)
- Works automatically on Replit platform
- Uses OpenID Connect (OIDC)
- No additional setup needed on Replit

### 2. Google OAuth
- Works anywhere (Vercel, Netlify, AWS, etc.)
- Set `AUTH_PROVIDER=google` in environment
- Register your app at [Google Cloud Console](https://console.cloud.google.com/)

### 3. GitHub OAuth
- Works anywhere
- Set `AUTH_PROVIDER=github` in environment  
- Register your app at [GitHub Developer Settings](https://github.com/settings/developers)

## Quick Migration Guide

### From Replit to Other Platforms

1. **Choose a new auth provider** (Google or GitHub)

2. **Set environment variables:**
   ```bash
   AUTH_PROVIDER=google  # or github
   
   # For Google:
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   
   # For GitHub:
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

3. **Update your routes.ts:**
   ```javascript
   import { setupAuth, isAuthenticated } from "./auth/universal-auth";
   ```

4. **Deploy** - Your app will automatically use the new provider

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add `https://yourdomain.com/api/auth/callback/google` to redirect URIs

### Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL to `https://yourdomain.com/api/auth/callback/github`
4. Copy Client ID and Client Secret

## Frontend Changes

The login button automatically works with any provider:

```jsx
// This works with any configured provider
<a href="/api/login">Login</a>

// Or specify a provider
<a href="/api/login?provider=google">Login with Google</a>
<a href="/api/login?provider=github">Login with GitHub</a>
```

## Environment Variables

Copy `.env.example` to `.env` and configure your preferred provider.

## Benefits

- **No vendor lock-in**: Switch providers anytime
- **Multiple deployment targets**: Works on Vercel, Netlify, AWS, DigitalOcean, etc.
- **Same user experience**: Login flow stays the same
- **Backward compatible**: Replit auth still works on Replit