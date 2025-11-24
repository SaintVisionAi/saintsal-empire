# Vercel Environment Variables Setup

## Required Environment Variables for Production

Based on your Vercel dashboard, here are the environment variables you need:

### Already Set (from your dashboard):
- ✅ `Saint_DATABASE_URL` - Main database connection
- ✅ `Saint_POSTGRES_URL` - Direct PostgreSQL connection
- ✅ `Saint_POSTGRES_PRISMA_URL` - Prisma connection string
- ✅ `Saint_DATABASE_URL_UNPOOLED` - Unpooled connection
- ✅ `Saint_POSTGRES_URL_NON_POOLING` - Non-pooling connection
- ✅ `Saint_PGHOST` - PostgreSQL host
- ✅ `Saint_POSTGRES_USER` - Database user
- ✅ `Saint_POSTGRES_PASSWORD` - Database password
- ✅ `Saint_STACK_SECRET_SERVER_KEY` - Stack secret
- ✅ `XAI_API` - XAI API key

### Need to Add:

1. **JWT_SECRET** (Required for authentication)
   - Key: `JWT_SECRET`
   - Value: `saintvision_production_jwt_2025_secure_key`
   - Scope: All Environments

2. **DATABASE_URL** (Map to your existing Saint_DATABASE_URL)
   - Key: `DATABASE_URL`
   - Value: (Copy from `Saint_DATABASE_URL` in your dashboard)
   - Scope: All Environments
   - Note: Your app uses `DATABASE_URL`, but Vercel has `Saint_DATABASE_URL`. Either:
     - Add `DATABASE_URL` with the same value as `Saint_DATABASE_URL`
     - OR update the code to use `Saint_DATABASE_URL`

3. **LLM API Keys** (At least one required for chat features)
   - `ANTHROPIC_API_KEY` - Recommended for best performance
   - OR `OPENAI_API_KEY` - Alternative option
   - OR `GOOGLE_AI_API_KEY` - Alternative option

4. **Optional but Recommended:**
   - `AZURE_SEARCH_ENDPOINT` - For RAG functionality
   - `AZURE_SEARCH_KEY` - For RAG functionality
   - `ELEVENLABS_API_KEY` - For voice features
   - `NEXT_PUBLIC_WS_URL` - WebSocket URL (if different from default)

## Quick Setup Steps:

1. Go to your Vercel project → Settings → Environment Variables
2. Add `JWT_SECRET` = `saintvision_production_jwt_2025_secure_key`
3. Add `DATABASE_URL` = (copy value from `Saint_DATABASE_URL`)
4. Add at least one LLM API key
5. Redeploy your application

## Local Development:

Copy these values to your local `.env` file:
```bash
DATABASE_URL=<value from Saint_DATABASE_URL>
JWT_SECRET=saintvision_production_jwt_2025_secure_key
ANTHROPIC_API_KEY=<your key>
```

## Note:

Your Vercel setup uses `Saint_DATABASE_URL` but the app expects `DATABASE_URL`. You have two options:

**Option 1 (Recommended):** Add `DATABASE_URL` to Vercel with the same value as `Saint_DATABASE_URL`

**Option 2:** Update the code to also check for `Saint_DATABASE_URL` as a fallback

