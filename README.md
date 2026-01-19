# Second Brain Application

A personal knowledge management system with a built-in chat interface that captures thoughts, classifies them using AI, and organizes them into structured databases.

## Features

- **Built-in Chat Interface**: Capture thoughts directly in the web app
- **AI Classification**: Automatically categorizes thoughts into People, Projects, Ideas, or Admin
- **Web Dashboard**: View and manage all your captured data
- **Daily Digests**: Get a summary of your day's captures and priorities
- **Weekly Reviews**: Comprehensive weekly analysis and recommendations
- **Fix Misclassifications**: Correct classifications via the inbox log

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key OR Anthropic API key

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `AI_PROVIDER`: Either `openai` or `anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: Your AI provider API key
- `DATABASE_PATH`: Path to SQLite database (default: `./data/secondbrain.db`)
- `NEXT_PUBLIC_APP_URL`: Your app URL (default: `http://localhost:3000`)

Optional:
- `CRON_SECRET`: Secret for protecting cron endpoints (recommended for production)
- `MCP_SERVER_URL`: URL of Next.js app for MCP server (default: `http://localhost:3000`)
- `MCP_API_KEY`: API key for MCP server authentication (optional)
- `MCP_TENANT_ID`: Default tenant ID for MCP server requests (required if using API key auth)

### 3. Run the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000

The database will be automatically created on first run.

## Usage

### Capturing Thoughts

1. Open the web dashboard at http://localhost:3000
2. Use the chat interface at the top of the page
3. Type any thought and press Enter or click Send
4. The system will automatically classify and file it
5. You'll see a confirmation message with the classification result

### Viewing Your Data

Visit the web dashboard to:
- **Chat Interface**: Capture new thoughts
- **People**: View all people you've tracked
- **Projects**: View all active and completed projects
- **Ideas**: Browse your captured ideas
- **Admin**: See administrative tasks
- **Inbox Log**: Review the audit trail of all captures
- **Digests**: View daily digests and weekly reviews

### Fixing Misclassifications

1. Go to the Inbox Log page
2. Find the item that was misclassified
3. Use the fix API endpoint or update it directly in the database
4. Items marked "Needs Review" can be manually corrected

### Scheduled Digests

- **Daily Digest**: Runs every morning at 9 AM (configurable via cron)
- **Weekly Review**: Runs every Sunday at 4 PM (configurable via cron)

Digests are stored in the database and can be viewed on the Digests page.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── capture/      # Capture endpoint
│   │   ├── fix/          # Fix classification endpoint
│   │   ├── cron/         # Scheduled jobs
│   │   ├── digests/      # Digest endpoints
│   │   └── [database]/   # CRUD endpoints
│   ├── [database]/       # Database view pages
│   ├── digests/          # Digests page
│   ├── inbox-log/        # Inbox log page
│   └── page.tsx          # Dashboard with chat
├── components/           # React components
│   ├── ChatInterface.tsx # Main chat component
│   ├── DatabaseTable.tsx # Table component
│   └── StatsCard.tsx     # Stats card component
├── lib/
│   ├── db/              # Database layer
│   │   ├── repositories/ # CRUD operations
│   │   └── schema.ts     # Database schema
│   └── services/        # Business logic
│       ├── capture.ts    # Capture service
│       ├── classification.ts # AI classification
│       ├── digest.ts     # Digest generation
│       └── fix.ts        # Fix classification
└── types/               # TypeScript types
```

## Database Schema

The application uses SQLite with 6 main tables:

- **people**: Name, context, follow-ups, last touched, tags
- **projects**: Name, status, next action, notes
- **ideas**: Name, one-liner, notes, last touched, tags
- **admin**: Name, due date, status, notes, created
- **inbox_log**: Audit trail of all captures
- **digests**: Stored daily digests and weekly reviews

## API Endpoints

### Capture a Thought
```
POST /api/capture
Body: { "message": "Your thought here" }
```

### Fix Classification
```
POST /api/fix
Body: { "logId": 123, "category": "people" }
```

### Get Digests
```
GET /api/digests
GET /api/digests?type=daily
GET /api/digests?type=weekly
```

### Database CRUD
```
GET /api/[database]           # List all items
POST /api/[database]          # Create item
GET /api/[database]/[id]      # Get item
PATCH /api/[database]/[id]    # Update item
DELETE /api/[database]/[id]   # Delete item
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Cron jobs are configured via `vercel.json`
5. Ensure the database file persists (consider using Vercel's storage or external database)

### Self-Hosted

1. Set up a server with Node.js
2. Configure environment variables
3. Use a process manager like PM2
4. Set up cron jobs to call `/api/cron/daily-digest` and `/api/cron/weekly-review`
5. Ensure database file persistence (backup regularly)

### Database Persistence

For production, consider:
- Using PostgreSQL instead of SQLite (requires migration)
- Regular database backups
- Using a managed database service

## Troubleshooting

### AI classification errors

- Verify your API key is correct
- Check that you have API credits/quota
- Review the classification prompt in `lib/services/classification.ts`

### Database errors

- Ensure the data directory exists and is writable
- Check file permissions on the database file
- Verify the database path in environment variables
- Run `npm run db:migrate` to initialize the database

### Chat interface not working

- Check browser console for errors
- Verify the `/api/capture` endpoint is accessible
- Ensure environment variables are set correctly

## Development

### Running Database Migrations

```bash
npm run db:migrate
```

### Building for Production

```bash
npm run build
npm start
```

## License

ISC
