# Brain Squared Backend

Backend API for storing and searching Chrome browsing history using Qdrant vector database.

## Features

- 🚀 Fast semantic search through browsing history
- 🧠 Local embeddings (no API costs!) using transformers.js
- 📦 Batch upload support from Chrome extension
- ☁️ Qdrant Cloud integration
- 🔍 Natural language queries

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env` file is already configured with your Qdrant Cloud credentials:

```env
QDRANT_URL=https://edb4f07d-313a-477e-9fb5-2cd58aea7f1a.us-east4-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.DhoGW20NxzDL0qn49RqgdYFcp7i94MQGFwtg4Ggokds
PORT=3000
COLLECTION_NAME=browsing_history
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will:
1. Connect to Qdrant Cloud
2. Create the `browsing_history` collection if it doesn't exist
3. Download and initialize the embedding model (~25MB, one-time download)
4. Start listening on http://localhost:3000

## API Endpoints

### Health Check
```bash
GET /api/health
```

Returns server status.

### Upload History
```bash
POST /api/history/upload
Content-Type: application/json

{
  "items": [
    {
      "url": "https://example.com",
      "title": "Example Site",
      "lastVisitTime": 1699123456789,
      "visitCount": 5,
      "typedCount": 2
    }
  ]
}
```

### Search History
```bash
POST /api/history/search
Content-Type: application/json

{
  "query": "machine learning tutorials",
  "limit": 10,
  "minScore": 0.3
}
```

**Example response:**
```json
{
  "results": [
    {
      "id": "abc123",
      "url": "https://example.com/ml-tutorial",
      "title": "Machine Learning Tutorial",
      "lastVisitTime": 1699123456789,
      "visitCount": 5,
      "score": 0.89
    }
  ],
  "total": 1,
  "query": "machine learning tutorials"
}
```

### Get Stats
```bash
GET /api/history/stats
```

Returns collection statistics (total items, vectors count, etc.)

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/api/health

# Upload test data
curl -X POST http://localhost:3000/api/history/upload \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "url": "https://github.com",
        "title": "GitHub",
        "lastVisitTime": 1699123456789,
        "visitCount": 10
      }
    ]
  }'

# Search
curl -X POST http://localhost:3000/api/history/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "code repositories",
    "limit": 5
  }'

# Get stats
curl http://localhost:3000/api/history/stats
```

## How It Works

1. **Upload**: History items are received via POST request
2. **Embedding**: Text is generated from URL + title
3. **Vector Generation**: Local embedding model creates 384-dim vectors
4. **Storage**: Vectors + metadata stored in Qdrant Cloud
5. **Search**: Query is embedded and searched semantically in Qdrant

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Vector DB**: Qdrant Cloud
- **Embeddings**: @xenova/transformers (all-MiniLM-L6-v2)
- **Vector Dimensions**: 384
- **Distance Metric**: Cosine similarity

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Express server
│   ├── config/
│   │   └── qdrant.ts         # Qdrant client & collection setup
│   ├── services/
│   │   ├── embeddings.ts     # Local embedding generation
│   │   └── history.ts        # History CRUD operations
│   ├── routes/
│   │   └── history.ts        # API routes
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── package.json
├── tsconfig.json
└── .env
```

## Troubleshooting

### Model Download Issues
The embedding model (~25MB) downloads on first run. If it fails:
- Check your internet connection
- The model is cached in `node_modules/.cache`

### Qdrant Connection Issues
- Verify your API key is correct
- Check that the Qdrant Cloud cluster is active
- Ensure you have internet connectivity

### CORS Issues from Chrome Extension
CORS is enabled for all origins. If you still have issues, check browser console.

## Next Steps

- [ ] Add Auth0 authentication
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Deploy to cloud (Vercel, Railway, etc.)
- [ ] Add caching layer for frequent queries
