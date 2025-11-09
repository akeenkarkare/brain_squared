import { Router } from 'express';
import { uploadHistoryItems, getStats, getLastSyncTime } from '../services/history.js';
import { queryWithOpenRouter, queryWithOpenRouterStream } from '../services/openrouter.js';
import { getTimelineData, getInsightsData } from '../services/insights.js';
import { timeMachineSearch } from '../services/timemachine.js';
const router = Router();
// POST /api/history/upload - Upload browsing history
router.post('/upload', async (req, res) => {
    try {
        // Extract userId from JWT token (set by auth middleware)
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required',
            });
        }
        const items = req.body.items || req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request: items must be an array',
            });
        }
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items to upload',
            });
        }
        console.log(`User ${userId} uploading ${items.length} history items...`);
        const itemsProcessed = await uploadHistoryItems(items, userId);
        const response = {
            success: true,
            itemsProcessed: itemsProcessed,
            message: `Successfully uploaded ${itemsProcessed} items`,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            itemsProcessed: 0,
            message: `Error uploading history: ${error.message}`,
        });
    }
});
// POST /api/history/search - Search browsing history
router.post('/search', async (req, res) => {
    try {
        // Extract userId from JWT token (set by auth middleware)
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'User authentication required',
            });
        }
        const { query, limit = 10, minScore = 0.3 } = req.body;
        if (!query) {
            return res.status(400).json({
                error: 'Query is required',
            });
        }
        console.log(`User ${userId} searching for: "${query}"`);
        // Check if this is a time machine query
        const isTimeMachineQuery = /\b(ago|yesterday|last week|last month|this week|this month|days? ago|weeks? ago|months? ago|what (?:was|were) I|what did I)\b/i.test(query);
        if (isTimeMachineQuery) {
            console.log('🕰️  Detected Time Machine query');
            const { response: aiResponse, results, timeRange } = await timeMachineSearch(query, userId, limit, minScore);
            res.json({
                results,
                total: results.length,
                query,
                aiResponse,
                isTimeMachine: true,
                timeRange,
            });
        }
        else {
            // Use OpenRouter for triangular synthesis
            const { response: aiResponse, results } = await queryWithOpenRouter(query, userId, limit, minScore);
            const response = {
                results: results,
                total: results.length,
                query: query,
            };
            res.json({
                ...response,
                aiResponse: aiResponse,
                isTimeMachine: false,
            });
        }
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: `Error searching history: ${error.message}`,
        });
    }
});
// POST /api/history/search/stream - Search with streaming AI response
router.post('/search/stream', async (req, res) => {
    try {
        // Extract userId from JWT token
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'User authentication required',
            });
        }
        const { query, limit = 10, minScore = 0.3 } = req.body;
        if (!query) {
            return res.status(400).json({
                error: 'Query is required',
            });
        }
        console.log(`User ${userId} streaming search for: "${query}"`);
        // Check if this is a time machine query
        const isTimeMachineQuery = /\b(ago|yesterday|last week|last month|this week|this month|days? ago|weeks? ago|months? ago|what (?:was|were) I|what did I)\b/i.test(query);
        if (isTimeMachineQuery) {
            console.log('🕰️  Detected Time Machine query (streaming)');
            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const { response: aiResponse, results, timeRange } = await timeMachineSearch(query, userId, limit, minScore);
            // Send results first
            res.write(`data: ${JSON.stringify({
                type: 'results',
                results,
                total: results.length,
                query,
                isTimeMachine: true,
                timeRange
            })}\n\n`);
            // Send AI response as a single token (not actually streaming, but compatible format)
            res.write(`data: ${JSON.stringify({ type: 'token', content: aiResponse })}\n\n`);
            // Send done
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            return res.end();
        }
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Get stream and results
        const { stream, results } = await queryWithOpenRouterStream(query, userId, limit, minScore);
        // Send results first
        res.write(`data: ${JSON.stringify({ type: 'results', results, total: results.length, query })}\n\n`);
        // Stream AI response
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = ''; // Buffer for partial lines
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                // Decode chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });
                // Split by newlines, but keep the last incomplete line in buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                for (const line of lines) {
                    if (line.trim() === '')
                        continue;
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                            continue;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
                            }
                        }
                        catch (e) {
                            // Skip invalid JSON (partial chunk)
                            console.error('Failed to parse streaming chunk:', e);
                        }
                    }
                }
            }
            // Send final done message
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        }
        catch (error) {
            console.error('Streaming error:', error);
        }
        finally {
            res.end();
        }
    }
    catch (error) {
        console.error('Stream search error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: `Error searching history: ${error.message}`,
            });
        }
    }
});
// GET /api/history/stats - Get collection statistics
router.get('/stats', async (req, res) => {
    try {
        // Extract userId from JWT token (set by auth middleware)
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'User authentication required',
            });
        }
        const stats = await getStats(userId);
        res.json(stats);
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: `Error getting stats: ${error.message}`,
        });
    }
});
// GET /api/history/last-sync-time - Get last sync timestamp for user
router.get('/last-sync-time', async (req, res) => {
    try {
        // Extract userId from JWT token (set by auth middleware)
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'User authentication required',
            });
        }
        const lastSyncTime = await getLastSyncTime(userId);
        res.json({
            lastSyncTime: lastSyncTime,
            userId: userId,
        });
    }
    catch (error) {
        console.error('Last sync time error:', error);
        res.status(500).json({
            error: `Error getting last sync time: ${error.message}`,
            lastSyncTime: 0, // Return 0 on error to trigger full sync
        });
    }
});
// GET /api/history/timeline - Get timeline data
router.get('/timeline', async (req, res) => {
    try {
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'User authentication required',
            });
        }
        const days = parseInt(req.query.days) || 30;
        const timeline = await getTimelineData(userId, days);
        res.json({
            timeline,
            userId,
        });
    }
    catch (error) {
        console.error('Timeline error:', error);
        res.status(500).json({
            error: `Error getting timeline: ${error.message}`,
        });
    }
});
// GET /api/history/insights - Get insights data
router.get('/insights', async (req, res) => {
    try {
        const userId = req.auth?.payload?.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'User authentication required',
            });
        }
        const insights = await getInsightsData(userId);
        res.json({
            insights,
            userId,
        });
    }
    catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({
            error: `Error getting insights: ${error.message}`,
        });
    }
});
export default router;
