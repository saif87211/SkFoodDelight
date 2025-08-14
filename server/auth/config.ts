// Authentication configuration that supports multiple providers
export interface AuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  callbackUrl: string;
  scopes: string[];
}

export interface AuthConfig {
  provider: 'replit' | 'google' | 'github' | 'custom';
  sessionSecret: string;
  sessionTtl: number;
  providers: {
    replit?: AuthProvider;
    google?: AuthProvider;
    github?: AuthProvider;
    custom?: AuthProvider;
  };
}

export function getAuthConfig(): AuthConfig {
  const provider = (process.env.AUTH_PROVIDER || 'replit') as AuthConfig['provider'];
  
  const config: AuthConfig = {
    provider,
    sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    sessionTtl: 7 * 24 * 60 * 60 * 1000, // 1 week
    providers: {}
  };

  // Replit configuration (current setup)
  if (process.env.REPL_ID && process.env.REPLIT_DOMAINS) {
    config.providers.replit = {
      name: 'replit',
      clientId: process.env.REPL_ID,
      clientSecret: '', // Not needed for Replit
      issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
      callbackUrl: `/api/auth/callback/replit`,
      scopes: ['openid', 'email', 'profile', 'offline_access']
    };
  }

  // Google OAuth configuration
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    config.providers.google = {
      name: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      issuerUrl: 'https://accounts.google.com',
      callbackUrl: `/api/auth/callback/google`,
      scopes: ['openid', 'email', 'profile']
    };
  }

  // GitHub OAuth configuration
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    config.providers.github = {
      name: 'github',
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      issuerUrl: 'https://github.com/login/oauth',
      callbackUrl: `/api/auth/callback/github`,
      scopes: ['user:email']
    };
  }

  return config;
}

export function getActiveProvider(): AuthProvider | null {
  const config = getAuthConfig();
  const activeProvider = config.providers[config.provider];
  return activeProvider || null;
}