# 🚀 Complete Deployment Guide

This food ordering application uses JWT-based authentication and can be deployed anywhere. No vendor lock-in!

## 📋 Quick Overview

- **Authentication**: JWT tokens (stored in localStorage)
- **Database**: PostgreSQL 
- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Deployment**: Works on any platform

## 🌍 Deployment Options

### 1. Deploy to Vercel (Recommended)

**Step 1: Prepare Your Code**
```bash
# Push to GitHub first
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Step 2: Deploy Backend + Frontend**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Step 3: Set Environment Variables**
In Vercel Dashboard → Your Project → Settings → Environment Variables:
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

**Step 4: Database Setup**
- Create PostgreSQL database on [Neon](https://neon.tech) (free)
- Run: `npm run db:push` to create tables
- Copy connection string to `DATABASE_URL`

### 2. Deploy to Netlify

**Step 1: Build Configuration**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2: Deploy**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Step 3: Environment Variables**
In Netlify Dashboard → Site Settings → Environment Variables:
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### 3. Deploy to Railway

**Step 1: Deploy**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

**Step 2: Add Database**
```bash
# Add PostgreSQL
railway add postgresql
```

**Step 3: Environment Variables**
Railway automatically provides `DATABASE_URL`. Add:
```
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### 4. Deploy to DigitalOcean App Platform

**Step 1: Create App**
- Connect your GitHub repo
- Choose Node.js runtime
- Set build command: `npm run build`
- Set run command: `npm start`

**Step 2: Add Database**
- Create managed PostgreSQL database
- Copy connection string

**Step 3: Environment Variables**
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### 5. Deploy to AWS (Advanced)

**Using AWS Amplify + RDS:**

**Step 1: Setup RDS PostgreSQL**
```bash
# Create RDS instance in AWS Console
# Note the connection string
```

**Step 2: Deploy with Amplify**
```bash
# Connect GitHub repo to AWS Amplify
# Set build settings:
# Build command: npm run build
# Output directory: dist
```

**Step 3: Environment Variables**
In AWS Amplify → App Settings → Environment Variables:
```
DATABASE_URL=your-rds-connection-string
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

## 🗄️ Database Setup

### Option 1: Neon (Recommended - Free)
1. Go to [neon.tech](https://neon.tech)
2. Create free account
3. Create new project
4. Copy connection string
5. Run `npm run db:push`

### Option 2: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create project
3. Go to Settings → Database
4. Copy connection string
5. Run `npm run db:push`

### Option 3: Railway PostgreSQL
1. `railway add postgresql`
2. Connection string is auto-provided
3. Run `npm run db:push`

### Option 4: Your Own PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Create database
createdb foodie_hub

# Set connection string
DATABASE_URL=postgresql://username:password@localhost:5432/foodie_hub
```

## ⚙️ Environment Variables

Create `.env` file with:

```bash
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (Required)
JWT_SECRET=your-super-secure-random-string-make-it-long
JWT_EXPIRES_IN=7d

# Server (Optional)
PORT=5000
NODE_ENV=production
```

**Important Security Notes:**
- `JWT_SECRET` should be at least 32 characters
- Never commit `.env` files to version control
- Use different secrets for development and production

## 🔧 Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database migrations
npm run db:push

# Database studio (optional)
npm run db:studio
```

## 📱 Frontend Configuration

The frontend automatically works with any backend URL. For custom API endpoints:

```typescript
// client/src/lib/queryClient.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
```

Set `VITE_API_URL` if your backend is on a different domain.

## 🔒 Security Checklist

- ✅ JWT secret is secure (32+ characters)
- ✅ Database connection uses SSL in production
- ✅ Environment variables are properly set
- ✅ No sensitive data in version control
- ✅ CORS configured for your domain
- ✅ Rate limiting enabled (optional)

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:studio

# Reset database
npm run db:push --force
```

### JWT Token Issues
- Check `JWT_SECRET` is set
- Verify token expiration time
- Clear browser localStorage and try again

### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

### Deployment-Specific Issues

**Vercel:**
- Ensure `vercel.json` is configured correctly
- Check function timeout limits
- Verify environment variables are set

**Netlify:**
- Check `netlify.toml` redirects
- Verify build command in dashboard
- Ensure functions are in correct directory

**Railway:**
- Check service logs in dashboard
- Verify port configuration
- Ensure database is connected

## 🎉 Success!

Your food ordering app is now deployed! Features include:

- ✅ User registration and login
- ✅ Product catalog with search
- ✅ Shopping cart functionality
- ✅ Order management
- ✅ Payment processing (mock)
- ✅ Responsive design
- ✅ JWT authentication
- ✅ PostgreSQL database
- ✅ Works anywhere!

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check deployment platform documentation
4. Review application logs

Your app is completely portable - you can switch between any hosting provider anytime!