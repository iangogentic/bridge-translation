# Bridge - Official Documents Made Simple

Transform official documents into clear, actionable summaries. Bridge helps immigrant families understand school, healthcare, legal, and government documents by providing instant translations with plain-language summaries.

## Features

- Fast Translation: GPT-4o powered translation in under 2 seconds  
- Smart Summaries: Extracts purpose, actions, due dates, and costs  
- Family Collaboration: Invite helpers to access translated documents  
- Secure Sharing: Time-boxed share links with expiration  
- Privacy-First: Documents auto-deleted after 48 hours  
- Multi-Format Support: PDF, JPG, and PNG uploads

## Tech Stack

- Framework: Next.js 16 (App Router) with TypeScript
- Database: Neon PostgreSQL (Serverless Postgres)  
- ORM: Drizzle ORM  
- Authentication: Better Auth (magic links via email)  
- AI: OpenAI GPT-4o with structured outputs  
- Storage: Vercel Blob (24-48h retention)  
- Email: Resend MCP (via code-executor)  
- Deployment: Vercel  
- Styling: Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key  
- Neon account (for PostgreSQL)
- Vercel account (for deployment)

### Installation

1. Clone and install
```bash
git clone https://github.com/iangogentic/bridge-translation.git
cd bridge-translation
npm install
```

2. Set up environment variables in .env.local
```env
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=9jDZ6E6mt2fZyL4vWcAR7+BAwLA6s83SyASh7it6RHw=
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Create Neon database and run migrations
```bash
npm run db:push
```

4. Start development server
```bash
npm run dev
```

## API Routes

- POST /api/upload - Upload document  
- POST /api/translate - Translate and summarize  
- GET /api/doc/:id - Get document metadata  
- POST /api/share - Create share link  
- POST /api/family/invite - Invite helper  
- POST /api/family/revoke - Revoke access

## Deployment

```bash
vercel --prod
```

Then add environment variables in Vercel Dashboard.

## License

Built for demonstration and portfolio purposes.

---

Built with Next.js, TypeScript, and AI
