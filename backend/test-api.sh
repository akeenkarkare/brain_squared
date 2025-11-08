#!/bin/bash

# Brain Squared API Test Script
# This script tests all the backend endpoints

echo "🧪 Testing Brain Squared Backend API"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
response=$(curl -s ${BASE_URL}/api/health)
if [[ $response == *"ok"* ]]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo "Response: $response"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
fi
echo ""

# Test 2: Upload Sample Data
echo -e "${BLUE}Test 2: Upload Sample History${NC}"
response=$(curl -s -X POST ${BASE_URL}/api/history/upload \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "url": "https://github.com/facebook/react",
        "title": "React - A JavaScript library for building user interfaces",
        "lastVisitTime": 1699200000000,
        "visitCount": 15,
        "typedCount": 5
      },
      {
        "url": "https://nodejs.org",
        "title": "Node.js - JavaScript runtime",
        "lastVisitTime": 1699190000000,
        "visitCount": 8,
        "typedCount": 3
      },
      {
        "url": "https://www.typescriptlang.org",
        "title": "TypeScript - JavaScript with syntax for types",
        "lastVisitTime": 1699180000000,
        "visitCount": 12,
        "typedCount": 4
      },
      {
        "url": "https://python.org",
        "title": "Python Programming Language",
        "lastVisitTime": 1699170000000,
        "visitCount": 20,
        "typedCount": 6
      },
      {
        "url": "https://qdrant.tech",
        "title": "Qdrant - Vector Database",
        "lastVisitTime": 1699160000000,
        "visitCount": 7,
        "typedCount": 2
      }
    ]
  }')

if [[ $response == *"success\":true"* ]]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo "Response: $response"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
fi
echo ""

# Give the backend time to process embeddings
echo "⏳ Waiting for embeddings to process..."
sleep 3
echo ""

# Test 3: Search for JavaScript frameworks
echo -e "${BLUE}Test 3: Search - 'JavaScript frameworks'${NC}"
response=$(curl -s -X POST ${BASE_URL}/api/history/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "JavaScript frameworks",
    "limit": 3
  }')

if [[ $response == *"React"* ]]; then
  echo -e "${GREEN}✅ PASSED - Found React${NC}"
  echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
fi
echo ""

# Test 4: Search for vector databases
echo -e "${BLUE}Test 4: Search - 'vector databases'${NC}"
response=$(curl -s -X POST ${BASE_URL}/api/history/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vector databases",
    "limit": 3
  }')

if [[ $response == *"Qdrant"* ]]; then
  echo -e "${GREEN}✅ PASSED - Found Qdrant${NC}"
  echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
fi
echo ""

# Test 5: Search for programming languages
echo -e "${BLUE}Test 5: Search - 'programming languages'${NC}"
response=$(curl -s -X POST ${BASE_URL}/api/history/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "programming languages",
    "limit": 5
  }')

if [[ $response == *"Python"* ]] || [[ $response == *"TypeScript"* ]]; then
  echo -e "${GREEN}✅ PASSED - Found programming languages${NC}"
  echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
fi
echo ""

# Test 6: Get Statistics
echo -e "${BLUE}Test 6: Collection Statistics${NC}"
response=$(curl -s ${BASE_URL}/api/history/stats)
echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
echo ""

echo "======================================"
echo "🎉 Testing Complete!"
echo ""
echo "💡 Tips:"
echo "  - Make sure the backend is running (npm run dev)"
echo "  - Install jq for prettier JSON output (brew install jq)"
echo "  - Check the backend logs for more details"
