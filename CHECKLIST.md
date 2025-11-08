# Brain Squared - Deployment Checklist

## ✅ Pre-Hackathon Demo

### Backend
- [x] Backend running on localhost:3000
- [x] Qdrant collection created
- [x] Embedding model loaded
- [ ] Test with real Chrome history (sync from extension)
- [ ] Verify search results are relevant
- [ ] Note down example queries that work well

### Chrome Extension
- [x] Extension code updated with sync button
- [ ] Load extension in Chrome (`chrome://extensions/`)
- [ ] Test sync functionality
- [ ] Verify progress indicators work
- [ ] Sync at least 100-500 history items for demo

### Web Integration (Your Team)
- [ ] Review `example-search-component.tsx`
- [ ] Integrate search UI into Next.js app
- [ ] Test connection to backend API
- [ ] Style to match your app design
- [ ] Add loading states and error handling

## 🚀 For Hackathon Day

### Setup (30 minutes before demo)
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Verify backend health: `curl http://localhost:3000/api/health`
- [ ] Load Chrome extension if not already loaded
- [ ] Have browser with history ready
- [ ] Test 2-3 search queries
- [ ] Prepare demo scenarios (see below)

### Demo Scenarios (Prepare These)

#### Scenario 1: Basic Semantic Search
- [ ] Show extension popup and sync process
- [ ] Search: "machine learning tutorials"
- [ ] Highlight results with similarity scores
- [ ] Show it finds ML content even without exact keywords

#### Scenario 2: Research Discovery
- [ ] Search: "React documentation"
- [ ] Show all React-related pages visited
- [ ] Demonstrate how it groups related content
- [ ] Compare to browser's built-in history search

#### Scenario 3: Time-Based Insights
- [ ] Search: "Python projects"
- [ ] Show when you last researched Python
- [ ] Demonstrate visit counts and patterns

### Talking Points
- [ ] "No API costs - everything runs locally"
- [ ] "Semantic search understands meaning, not just keywords"
- [ ] "Built on Qdrant vector database"
- [ ] "Can scale to thousands of history items"
- [ ] "Future: Add AI summaries, knowledge graphs, recommendations"

## 📋 Post-Hackathon (Optional)

### Deployment
- [ ] Deploy backend to Vercel/Railway
- [ ] Update `BACKEND_URL` in extension
- [ ] Add Auth0 authentication
- [ ] Set up proper CORS policies
- [ ] Add rate limiting

### Enhancements
- [ ] Extract full page content (not just titles)
- [ ] Add Gemini-powered summaries
- [ ] Build knowledge graph visualization
- [ ] Implement collaborative features
- [ ] Add browser notifications

### Production Readiness
- [ ] Add logging and monitoring
- [ ] Implement error tracking (Sentry)
- [ ] Add analytics
- [ ] Write API documentation
- [ ] Create user documentation

## 🐛 Troubleshooting Guide

### Backend Won't Start
```bash
# Check if Node.js is installed
node --version

# Check if npm packages are installed
cd backend && npm install

# Check for port conflicts
lsof -i :3000

# Check backend logs
cd backend && npm run dev
```

### Extension Can't Connect
- [ ] Verify backend is running (`curl http://localhost:3000/api/health`)
- [ ] Check browser console for CORS errors
- [ ] Verify `BACKEND_URL` in `popup.js` is correct
- [ ] Check Chrome extension permissions

### Search Returns No Results
- [ ] Verify data was uploaded (`curl http://localhost:3000/api/history/stats`)
- [ ] Check search query threshold (default: 0.3)
- [ ] Try broader search terms
- [ ] Check backend logs for errors

### Slow Performance
- [ ] First search is slower (model initialization)
- [ ] Subsequent searches should be <100ms
- [ ] Check embedding batch size (default: 500)
- [ ] Monitor Qdrant Cloud connection

## 📞 Quick Reference

### Start Backend
```bash
cd /Users/akeen/brain_squared/backend
npm run dev
```

### Test Backend
```bash
cd /Users/akeen/brain_squared/backend
./test-api.sh
```

### Check Backend Status
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/history/stats
```

### Manual Search Test
```bash
curl -X POST http://localhost:3000/api/history/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your search term", "limit": 10}'
```

### Load Chrome Extension
1. `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked → select `/Users/akeen/brain_squared/chrome_extension`

## 🎯 Success Metrics for Demo

- [ ] Successfully sync 100+ history items
- [ ] Search returns relevant results in <1 second
- [ ] Demonstrate 3-5 different search queries
- [ ] Show semantic understanding (results without exact keywords)
- [ ] Explain zero API cost architecture
- [ ] Show scalability potential

## 📊 Demo Data Preparation

### Good Search Queries to Prepare
1. Technical topics you've researched
2. Frameworks/libraries you've used
3. Specific projects or tutorials
4. General concepts (e.g., "databases", "authentication")

### What Makes a Good Demo
- [ ] Real browsing history (not fake data)
- [ ] Diverse topics to show versatility
- [ ] Clear before/after comparison
- [ ] Fast, responsive UI
- [ ] Unexpected/impressive results

## 🎉 Final Checklist

Before presenting:
- [ ] Backend is running and healthy
- [ ] Extension is loaded in Chrome
- [ ] At least 100 history items synced
- [ ] Tested 3-5 search queries
- [ ] Prepared talking points
- [ ] Know how to explain the tech stack
- [ ] Can articulate the value proposition
- [ ] Have backup plan if live demo fails (screenshots/video)

Good luck! 🚀
