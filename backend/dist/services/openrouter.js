import { searchHistory } from './history.js';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set. OpenRouter features will not work.');
}
export async function queryWithOpenRouter(query, userId, limit = 10, minScore = 0.3) {
    try {
        // 1️⃣ Query Qdrant
        console.log(`[Triangular] Querying Qdrant for: "${query}"`);
        const qdrantResults = await searchHistory(query, userId, limit, minScore);
        // 2️⃣ Format Qdrant results
        const formattedQdrantResults = qdrantResults
            .map((r, i) => `${i + 1}. Title: "${r.title}"\n   URL: ${r.url}\n   Vector Match Score: ${(r.score * 100).toFixed(0)}%\n   Visit Count: ${r.visitCount}`)
            .join('\n\n');
        const allHistoryForContext = qdrantResults
            .slice(0, 15)
            .map((r) => `- "${r.title}" (${r.url})`)
            .join('\n');
        // 3️⃣ System prompt
        const systemPrompt = `You are an intelligent search assistant analyzing browsing history.
You receive:
1. A user's search query
2. Vector database search results (semantically matched pages)
3. Raw browsing history items

Your job is to:
1. Compare the vector search results with the raw history
2. Identify which results are most relevant
3. Consider both semantic similarity AND actual content/context
4. Provide the best possible summary or insights
5. Recommend the most useful pages to visit

Be concise, helpful, and prioritize quality over quantity.`;
        const userMessage = `Search Query: "${query}"

VECTOR DATABASE RESULTS (Semantic Matches):
${formattedQdrantResults || 'No matching pages found.'}

BROWSING HISTORY CONTEXT (for comparison):
${allHistoryForContext || 'No history available.'}

Please analyze both sources and provide:
1. The most relevant results to the user's query
2. Why these results match their search
3. Any patterns or insights from their history that might help.`;
        console.log('[Triangular] Sending query + vector results + history to OpenRouter...');
        // 4️⃣ Call OpenRouter API
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:3000',
                'X-Title': 'Brain Squared',
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 600,
            }),
        });
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            }
            catch {
                errorData = { message: await response.text() };
            }
            console.error('OpenRouter API error:', errorData);
            throw new Error(`OpenRouter API error: ${errorData.error?.message || errorData.message || 'Unknown error'}`);
        }
        // ✅ Cast data to typed interface
        const data = (await response.json());
        const openrouterResponse = data.choices?.[0]?.message?.content || '';
        console.log('[Triangular] OpenRouter synthesis complete');
        return {
            response: openrouterResponse,
            results: qdrantResults,
        };
    }
    catch (error) {
        console.error('Error in triangular query:', error.message || error);
        throw error;
    }
}
