# SaintSal™ Empire - AI Intelligence Platform

**HACP™ Protected | Patent 10,290,222**

A high-performance AI platform with real-time streaming, WebSocket support, RAG (Retrieval Augmented Generation), voice capabilities, and multi-LLM support.

## Features

- 🚀 **Real-time Streaming Chat** - WebSocket and HTTP streaming support
- 🧠 **Multi-LLM Support** - Claude 3.5 Sonnet, GPT-4, GPT-3.5, Gemini Pro with automatic fallback
- 🔍 **RAG Implementation** - Azure Cognitive Search integration for knowledge retrieval
- 🎤 **Voice & Walkie-Talkie** - Real-time voice transcription and text-to-speech
- 📱 **Mobile Optimized** - Responsive design with mobile-first streaming chat
- 🔐 **HACP™ Compliance** - Human-AI Collaboration Protocol protection
- ⚡ **High Performance** - Optimized for production with streaming responses

## Getting Started

### Quick Start

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon, Supabase, etc.)
- At least one LLM API key (Anthropic, OpenAI, or Google AI)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SaintVisionAi/saintsal-empire.git
cd saintsal-empire
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
# Minimum required: DATABASE_URL and JWT_SECRET
```

4. Set up the database:
```bash
# Run migrations (if using Drizzle)
npx drizzle-kit push
```

5. Start the development server:
```bash
npm run dev
```

The server will start on [http://localhost:3000](http://localhost:3000) with WebSocket support on `ws://localhost:3000/ws`.

**Note:** The app will start even without a database connection, but database features will be limited. See [SETUP.md](./SETUP.md) for troubleshooting.

## Environment Variables

See `.env.example` for all required variables. At minimum, you need:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- At least one LLM API key:
  - `ANTHROPIC_API_KEY` (recommended for best performance)
  - `OPENAI_API_KEY` or `AZURE_OPENAI_API_KEY`
  - `GOOGLE_AI_API_KEY`

Optional but recommended:
- `AZURE_SEARCH_ENDPOINT` & `AZURE_SEARCH_KEY` - For RAG functionality
- `ELEVENLABS_API_KEY` - For high-quality voice synthesis

## Architecture

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes + Custom WebSocket Server
- **Database**: PostgreSQL with Drizzle ORM
- **LLM**: Multi-provider support with automatic fallback
- **RAG**: Azure Cognitive Search with vector embeddings
- **Voice**: Web Speech API + ElevenLabs + OpenAI Whisper

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/chat` - Chat completion (non-streaming)
- `POST /api/chat/stream` - Streaming chat responses
- `POST /api/voice` - Text-to-speech generation
- `POST /api/transcribe` - Speech-to-text transcription
- `POST /api/image` - Image generation
- `WebSocket /ws` - Real-time chat via WebSocket

## Features in Detail

### Streaming Chat
- WebSocket for real-time bidirectional communication
- HTTP Server-Sent Events (SSE) fallback
- Mobile-optimized with connection status indicators
- Automatic reconnection and error handling

### RAG (Retrieval Augmented Generation)
- Azure Cognitive Search integration
- Vector embeddings with OpenAI
- Database fallback for knowledge retrieval
- Context-aware responses

### Voice Features
- Real-time speech recognition (Web Speech API)
- High-quality TTS (ElevenLabs)
- Whisper transcription (OpenAI)
- Walkie-talkie mode with live transcription

### Multi-LLM Support
- Automatic model selection (best available)
- Fallback chain: Claude → GPT-4 → GPT-3.5 → Gemini
- Streaming support for all models
- Token usage tracking

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. For production, ensure:
   - All environment variables are set
   - Database is properly configured
   - WebSocket server is accessible
   - SSL/TLS is enabled for WebSocket (wss://)

## License

Proprietary - HACP™ Protected | Patent 10,290,222

## Support

For issues and questions, please open an issue on GitHub.
