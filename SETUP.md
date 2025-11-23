# Quick Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

#### Required:
- `DATABASE_URL` - Your PostgreSQL connection string
  - Example: `postgresql://user:password@localhost:5432/saintsal`
  - Or use Neon, Supabase, etc.
- `JWT_SECRET` - A random secret key for JWT tokens
  - Generate one: `openssl rand -base64 32`

#### At least one LLM API key (recommended: Anthropic):
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/
- OR `OPENAI_API_KEY` - Get from https://platform.openai.com/
- OR `GOOGLE_AI_API_KEY` - Get from https://makersuite.google.com/app/apikey

### 3. Set Up Database

#### Option A: Using Neon (Recommended for quick start)
1. Go to https://neon.tech
2. Create a free account and database
3. Copy the connection string to `DATABASE_URL` in `.env`
4. Run migrations:
```bash
npx drizzle-kit push
```

#### Option B: Using Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb saintsal`
3. Set `DATABASE_URL=postgresql://localhost:5432/saintsal` in `.env`
4. Run migrations:
```bash
npx drizzle-kit push
```

#### Option C: Using Supabase
1. Go to https://supabase.com
2. Create a project
3. Copy the connection string to `DATABASE_URL` in `.env`
4. Run migrations:
```bash
npx drizzle-kit push
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## 🔧 Troubleshooting

### Database Connection Error
If you see "No database connection string was provided":
1. Make sure `.env` file exists
2. Check that `DATABASE_URL` is set in `.env`
3. Verify the connection string is correct

### Missing API Keys
The app will work without LLM API keys, but chat features will be limited. Set at least one:
- `ANTHROPIC_API_KEY` (recommended for best performance)
- `OPENAI_API_KEY`
- `GOOGLE_AI_API_KEY`

### WebSocket Not Connecting
- Make sure you're using the custom server: `npm run dev` (not `next dev`)
- Check that port 3000 is not in use
- Verify `NEXT_PUBLIC_WS_URL` in `.env` if using custom WebSocket URL

## 📝 Environment Variables Reference

See `.env.example` for all available environment variables and their descriptions.

## 🎯 Next Steps

1. Create an account at `/auth/signup`
2. Log in at `/auth/login`
3. Start using the dashboard at `/dashboard`
4. Explore features:
   - Chat with streaming
   - Voice/Walkie-Talkie
   - Code Agent
   - Playground
   - Integrations

## 🆘 Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review error messages in the console
- Ensure all environment variables are set correctly

