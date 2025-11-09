import { searchHistory } from './history.js';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set. OpenRouter features will not work.');
}
// Streaming version
export async function queryWithOpenRouterStream(query, userId, limit = 10, minScore = 0.3) {
    try {
        // 1️⃣ Query Qdrant with normal threshold
        console.log(`\n🔍 [Triangular Stream] Starting search for: "${query}"`);
        let qdrantResults = await searchHistory(query, userId, limit, minScore);
        console.log(`✅ [Triangular Stream] Qdrant returned ${qdrantResults.length} results`);
        // 🆕 Fallback: If we got few results, try with lower threshold
        if (qdrantResults.length < 3) {
            console.log(`⚠️  [Fallback] Only ${qdrantResults.length} results, trying with lower threshold (0.15)...`);
            const fallbackResults = await searchHistory(query, userId, limit * 2, 0.15);
            if (fallbackResults.length > qdrantResults.length) {
                qdrantResults = fallbackResults;
                console.log(`✅ [Fallback] Found ${qdrantResults.length} results with lower threshold`);
            }
        }
        // 🆕 Second fallback: If still few results, get recent browsing history
        if (qdrantResults.length < 3) {
            console.log(`⚠️  [Fallback] Still only ${qdrantResults.length} results, fetching recent history...`);
            const recentResults = await searchHistory(query, userId, limit * 2, 0.0); // No threshold
            if (recentResults.length > qdrantResults.length) {
                qdrantResults = recentResults.slice(0, limit);
                console.log(`✅ [Fallback] Using ${qdrantResults.length} results from plain history`);
            }
        }
        // 2️⃣ Format results
        const formattedQdrantResults = qdrantResults
            .map((r, i) => `${i + 1}. Title: "${r.title}"\n   URL: ${r.url}\n   Vector Match Score: ${(r.score * 100).toFixed(0)}%\n   Visit Count: ${r.visitCount}`)
            .join('\n\n');
        // 3️⃣ System prompt
        const systemPrompt = `You're Brain², a friendly AI assistant helping users rediscover their browsing history! 🧠✨

Your personality:
- Conversational and warm, like chatting with a knowledgeable friend
- Use casual language (contractions like "you've", "I've", "here's")
- Sometimes use relevant emojis (but don't overdo it!)
- Get excited when you find great matches
- Empathetic when results are limited

Your task:
- Analyze the user's vector search results (semantic matches)
- Provide a helpful 2-4 sentence summary
- Highlight the most relevant/interesting finds
- If there are clear patterns, mention them casually

Keep it short and sweet - no bullet points or formal lists unless really needed!`;
        const userMessage = `The user searched for: "${query}"

Here's what I found in their browsing history:
${formattedQdrantResults || 'No matching pages found.'}

Please give them a friendly, conversational response about what they were exploring!`;
        console.log(`\n🚀 [Triangular Stream] Sending streaming request to OpenRouter...`);
        // 4️⃣ Call OpenRouter API with streaming (using GPT-4 Turbo)
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:3000',
                'X-Title': 'Brain Squared',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 600,
                stream: true,
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }
        return {
            stream: response.body,
            results: qdrantResults,
        };
    }
    catch (error) {
        console.error(`\n❌ [Triangular Stream] Error:`, error.message || error);
        throw error;
    }
}
// Non-streaming version (keep for compatibility)
export async function queryWithOpenRouter(query, userId, limit = 10, minScore = 0.3) {
    try {
        // 1️⃣ Query Qdrant with normal threshold
        console.log(`\n🔍 [Triangular] Starting search for: "${query}"`);
        console.log(`📊 [Triangular] Query params: limit=${limit}, minScore=${minScore}`);
        let qdrantResults = await searchHistory(query, userId, limit, minScore);
        console.log(`✅ [Triangular] Qdrant returned ${qdrantResults.length} results`);
        // 🆕 Fallback: If we got few results, try with lower threshold
        if (qdrantResults.length < 3) {
            console.log(`⚠️  [Fallback] Only ${qdrantResults.length} results, trying with lower threshold (0.15)...`);
            const fallbackResults = await searchHistory(query, userId, limit * 2, 0.15);
            if (fallbackResults.length > qdrantResults.length) {
                qdrantResults = fallbackResults;
                console.log(`✅ [Fallback] Found ${qdrantResults.length} results with lower threshold`);
            }
        }
        // 🆕 Second fallback: If still few results, get recent browsing history
        if (qdrantResults.length < 3) {
            console.log(`⚠️  [Fallback] Still only ${qdrantResults.length} results, fetching recent history...`);
            const recentResults = await searchHistory(query, userId, limit * 2, 0.0); // No threshold
            if (recentResults.length > qdrantResults.length) {
                qdrantResults = recentResults.slice(0, limit);
                console.log(`✅ [Fallback] Using ${qdrantResults.length} results from plain history`);
            }
        }
        console.log(`📊 [Triangular] Final results:`);
        qdrantResults.forEach((r, i) => {
            console.log(`   ${i + 1}. "${r.title}"`);
            console.log(`      URL: ${r.url}`);
            console.log(`      Vector Score: ${(r.score * 100).toFixed(1)}%`);
            console.log(`      Visits: ${r.visitCount}`);
        });
        // 2️⃣ Format Qdrant results
        const formattedQdrantResults = qdrantResults
            .map((r, i) => `${i + 1}. Title: "${r.title}"\n   URL: ${r.url}\n   Vector Match Score: ${(r.score * 100).toFixed(0)}%\n   Visit Count: ${r.visitCount}`)
            .join('\n\n');
        const allHistoryForContext = qdrantResults
            .slice(0, 15)
            .map((r) => `- "${r.title}" (${r.url})`)
            .join('\n');
        console.log(`\n📝 [Triangular] Formatted vector results length: ${formattedQdrantResults.length} chars`);
        console.log(`📝 [Triangular] History context length: ${allHistoryForContext.length} chars`);
        // 3️⃣ System prompt
        const systemPrompt = `You're Brain², a friendly AI assistant helping users rediscover their browsing history! 🧠✨

Your personality:
- Conversational and warm, like chatting with a knowledgeable friend
- Use casual language (contractions like "you've", "I've", "here's")
- Sometimes use relevant emojis (but don't overdo it!)
- Get excited when you find great matches
- Empathetic when results are limited

Your task:
- Analyze the user's vector search results (semantic matches)
- Provide a helpful 2-4 sentence summary
- Highlight the most relevant/interesting finds
- If there are clear patterns, mention them casually

Keep it short and sweet - no bullet points or formal lists unless really needed!`;
        const userMessage = `The user searched for: "${query}"

Here's what I found in their browsing history:
${formattedQdrantResults || 'No matching pages found.'}

Please give them a friendly, conversational response about what they were exploring!`;
        console.log(`\n🚀 [Triangular] Sending to OpenRouter...`);
        console.log(`   - Query: "${query}"`);
        console.log(`   - Vector Results: ${qdrantResults.length} items`);
        console.log(`   - Model: openai/gpt-4-turbo-preview`);
        console.log(`   - API Key: ${OPENROUTER_API_KEY?.substring(0, 10)}...`);
        // 4️⃣ Call OpenRouter API (using GPT-4 Turbo)
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:3000',
                'X-Title': 'Brain Squared',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 600,
            }),
        });
        console.log(`📡 [Triangular] OpenRouter response status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            }
            catch {
                errorData = { message: await response.text() };
            }
            console.error('❌ [Triangular] OpenRouter API error:', JSON.stringify(errorData, null, 2));
            throw new Error(`OpenRouter API error: ${errorData.error?.message || errorData.message || 'Unknown error'}`);
        }
        // ✅ Cast data to typed interface
        const data = (await response.json());
        const openrouterResponse = data.choices?.[0]?.message?.content || '';
        console.log(`\n✅ [Triangular] OpenRouter synthesis complete`);
        console.log(`   - Response length: ${openrouterResponse.length} chars`);
        console.log(`   - First 100 chars: ${openrouterResponse.substring(0, 100)}...`);
        return {
            response: openrouterResponse,
            results: qdrantResults,
        };
    }
    catch (error) {
        console.error(`\n❌ [Triangular] Error in query:`, error.message || error);
        console.error(error.stack);
        throw error;
    }
}
