import * as client from "openid-client";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";
import { getAuthConfig, getActiveProvider } from "./config";

// Memoized OIDC config for Replit
const getOidcConfig = memoize(
  async (issuerUrl: string, clientId: string) => {
    return await client.discovery(
      new URL(issuerUrl),
      clientId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const config = getAuthConfig();
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: config.sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: config.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: config.sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokens: any) {
  if (tokens.claims) {
    user.claims = tokens.claims();
  } else {
    // For non-OIDC providers, create a claims-like object
    user.claims = {
      sub: tokens.id || tokens.sub,
      email: tokens.emails?.[0]?.value || tokens.email,
      first_name: tokens.name?.givenName || tokens.displayName?.split(' ')[0],
      last_name: tokens.name?.familyName || tokens.displayName?.split(' ').slice(1).join(' '),
      profile_image_url: tokens.photos?.[0]?.value || tokens.avatar_url,
    };
  }
  
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at || (Date.now() / 1000 + 3600); // 1 hour default
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: String(claims.sub || claims.id),
    email: claims.email,
    firstName: claims.first_name || claims.given_name,
    lastName: claims.last_name || claims.family_name,
    profileImageUrl: claims.profile_image_url || claims.picture || claims.avatar_url,
  });
}

export async function setupAuth(app: Express) {
  const config = getAuthConfig();
  const activeProvider = getActiveProvider();
  
  if (!activeProvider) {
    console.warn('No authentication provider configured. Users will not be able to log in.');
    return;
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup authentication strategies based on available providers
  if (config.providers.replit && process.env.REPLIT_DOMAINS) {
    await setupReplitAuth(config.providers.replit);
  }

  if (config.providers.google) {
    setupGoogleAuth(config.providers.google);
  }

  if (config.providers.github) {
    setupGitHubAuth(config.providers.github);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Universal routes that work with any provider
  app.get("/api/login", (req, res, next) => {
    const provider = req.query.provider || config.provider;
    
    if (provider === 'replit' && process.env.REPLIT_DOMAINS) {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: config.providers.replit!.scopes,
      })(req, res, next);
    } else if (provider === 'google') {
      passport.authenticate('google', {
        scope: config.providers.google!.scopes,
      })(req, res, next);
    } else if (provider === 'github') {
      passport.authenticate('github', {
        scope: config.providers.github!.scopes,
      })(req, res, next);
    } else {
      res.status(400).json({ error: 'Invalid or unavailable authentication provider' });
    }
  });

  // Provider-specific callback routes
  app.get("/api/auth/callback/:provider", (req, res, next) => {
    const provider = req.params.provider;
    
    if (provider === 'replit') {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    } else if (provider === 'google') {
      passport.authenticate('google', {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    } else if (provider === 'github') {
      passport.authenticate('github', {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    } else {
      res.status(400).json({ error: 'Invalid authentication provider' });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(async () => {
      if (config.provider === 'replit' && config.providers.replit) {
        try {
          const oidcConfig = await getOidcConfig(
            config.providers.replit.issuerUrl,
            config.providers.replit.clientId
          );
          res.redirect(
            client.buildEndSessionUrl(oidcConfig, {
              client_id: config.providers.replit.clientId,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            }).href
          );
        } catch (error) {
          res.redirect('/');
        }
      } else {
        res.redirect('/');
      }
    });
  });
}

async function setupReplitAuth(providerConfig: any) {
  const oidcConfig = await getOidcConfig(providerConfig.issuerUrl, providerConfig.clientId);
  
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config: oidcConfig,
        scope: providerConfig.scopes.join(" "),
        callbackURL: `https://${domain}/api/auth/callback/replit`,
      },
      verify,
    );
    passport.use(strategy);
  }
}

function setupGoogleAuth(providerConfig: any) {
  passport.use(new GoogleStrategy({
    clientID: providerConfig.clientId,
    clientSecret: providerConfig.clientSecret,
    callbackURL: providerConfig.callbackUrl,
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    const user: any = { access_token: accessToken, refresh_token: refreshToken };
    updateUserSession(user, profile);
    await upsertUser(user.claims);
    done(null, user);
  }));
}

function setupGitHubAuth(providerConfig: any) {
  passport.use(new GitHubStrategy({
    clientID: providerConfig.clientId,
    clientSecret: providerConfig.clientSecret,
    callbackURL: providerConfig.callbackUrl,
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    const user: any = { access_token: accessToken, refresh_token: refreshToken };
    updateUserSession(user, profile);
    await upsertUser(user.claims);
    done(null, user);
  }));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For non-OIDC providers, we might not have expires_at
  if (user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > user.expires_at) {
      // Try to refresh token if available
      if (user.refresh_token) {
        try {
          const config = getAuthConfig();
          if (config.provider === 'replit' && config.providers.replit) {
            const oidcConfig = await getOidcConfig(
              config.providers.replit.issuerUrl,
              config.providers.replit.clientId
            );
            const tokenResponse = await client.refreshTokenGrant(oidcConfig, user.refresh_token);
            updateUserSession(user, tokenResponse);
            return next();
          }
        } catch (error) {
          return res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  }

  return next();
};