# Brain Squared - Quick Start Guide

Complete implementation of Chrome history storage with Qdrant vector database and semantic search.

## ✅ What's Implemented

1. **Backend API** (Node.js + TypeScript + Express)
   - Qdrant Cloud integration
   - Local embeddings (zero API costs)
   - Semantic search
   - Batch upload support

2. **Chrome Extension** (Modified)
   - Original download functionality preserved
   - New "Sync to Brain Squared" button
   - Batch upload with progress tracking

3. **Database** (Qdrant Cloud)
   - Collection created: `browsing_history`
   - Vector embeddings (384 dimensions)
   - Ready for semantic queries

## 🚀 How to Use

### Step 1: Start the Backend

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000` and you'll see:
```
✅ Server is running on http://localhost:3000
📍 Health check: http://localhost:3000/api/health
📤 Upload endpoint: http://localhost:3000/api/history/upload
🔍 Search endpoint: http://localhost:3000/api/history/search
📊 Stats endpoint: http://localhost:3000/api/history/stats
```

### Step 2: Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Navigate to `/Users/akeen/brain_squared/chrome_extension`
5. Click **Select Folder**

### Step 3: Sync Your History

1. Click the Brain Squared extension icon in Chrome toolbar
2. Select time range (e.g., "All Time" or "Last 30 Days")
3. Click **"Sync to Brain Squared"** button
4. Wait for the sync to complete (you'll see progress)
5. Success message: "Successfully synced X items to Brain Squared!"

### Step 4: Search Your History

Use the API to search semantically:

```bash
# Search for AI-related content
curl -X POST http://localhost:3000/api/history/search \
  -H "Content-Type: application/json" \
  -d '{"query": "AI coding tools", "limit": 10}'

# Search for tutorials
curl -X POST http://localhost:3000/api/history/search \
  -H "Content-Type: application/json" \
  -d '{"query": "React tutorials", "limit": 10}'

# Search for documentation
curl -X POST http://localhost:3000/api/history/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Python documentation", "limit": 10}'
```

## 📊 Check Stats

```bash
curl http://localhost:3000/api/history/stats
```

## 🧪 Test Results

Successfully tested:
- ✅ Health check endpoint
- ✅ Upload 3 test items
- ✅ Semantic search for "AI coding tools" → Found Claude Code (score: 0.69)
- ✅ Semantic search for "JavaScript frameworks" → Found React (score: 0.48)
- ✅ Collection stats showing 3 items stored

## 🎯 What's Next

For your team to integrate:

### 1. Web Frontend Integration

The backend exposes these endpoints for your web team:

```typescript
// Search endpoint
POST /api/history/search
Body: { query: string, limit?: number, minScore?: number }
Response: { results: SearchResult[], total: number, query: string }

// Stats endpoint
GET /api/history/stats
Response: { totalItems: number, status: string }
```

Example React integration:

```javascript
async function searchHistory(query) {
  const response = await fetch('http://localhost:3000/api/history/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 20 })
  });
  return await response.json();
}
```

### 2. Deploy Backend

When ready to deploy:

```bash
cd backend
npm run build  # Compile TypeScript
npm start      # Run production server
```

Deploy to:
- **Vercel**: Zero config deployment
- **Railway**: Easy backend hosting
- **Render**: Free tier available
- **Fly.io**: Global edge deployment

### 3. Update Extension for Production

In `chrome_extension/popup.js`, change:

```javascript
const BACKEND_URL = 'http://localhost:3000';
```

To your deployed URL:

```javascript
const BACKEND_URL = 'https://your-backend.vercel.app';
```

### 4. Add Auth0 (Later)

When ready to add authentication:
- Install `express-oauth2-jwt-bearer`
- Add middleware to routes
- Update extension to get Auth0 token
- Pass token in request headers

## 🎨 Demo Ideas for Hackathon

1. **Live Search Demo**
   - Show semantic search vs keyword search
   - Example: "AI tools" finds Claude Code, even without exact word match

2. **Research Assistant**
   - "What did I learn about React last week?"
   - "Show me all the ML papers I've read"

3. **Knowledge Graph** (Future enhancement)
   - Visualize connections between topics
   - Show research journeys over time

4. **Smart Recommendations**
   - "You researched X, you might also want to check Y"
   - Based on semantic similarity

## 📁 Project Structure

```
brain_squared/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Main server
│   │   ├── config/
│   │   │   └── qdrant.ts      # Qdrant setup
│   │   ├── services/
│   │   │   ├── embeddings.ts  # Local embeddings
│   │   │   └── history.ts     # CRUD operations
│   │   ├── routes/
│   │   │   └── history.ts     # API endpoints
│   │   └── types/
│   │       └── index.ts       # TypeScript types
│   ├── package.json
│   └── .env                   # Qdrant credentials
├── chrome_extension/
│   ├── manifest.json
│   ├── popup.html             # Updated with sync button
│   ├── popup.js               # Added sync functionality
│   └── popup.css              # Updated styles
└── web/
    └── (your team's Next.js app)
```

## 💡 Tips

- **Backend must be running** for extension sync to work
- **First embedding model download** takes ~30 seconds (one-time)
- **Batch size**: Extension sends 500 items at a time
- **Search threshold**: Default min score is 0.3 (adjust as needed)
- **Qdrant free tier**: 1GB storage (plenty for hackathon)

## 🐛 Troubleshooting

**Extension can't connect to backend:**
- Check backend is running on port 3000
- Check browser console for CORS errors
- Verify `BACKEND_URL` in popup.js

**Slow searches:**
- First search is slower (model initialization)
- Subsequent searches are fast (<100ms)

**Qdrant errors:**
- Verify API key in `.env`
- Check internet connection (cloud Qdrant)

## 🎉 You're All Set!

Your "second memory" system is ready to:
- Store browsing history with semantic embeddings
- Search using natural language
- Scale to thousands of history items
- Integrate with your team's web frontend

Good luck with the hackathon! 🚀
