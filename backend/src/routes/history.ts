import { Router, Request, Response } from 'express';
import { uploadHistoryItems, searchHistory, getStats, getLastSyncTime } from '../services/history.js';
import { queryWithOpenRouter } from '../services/openrouter.js';
import { HistoryItem, SearchQuery, UploadResponse, SearchResponse } from '../types/index.js';

const router = Router();

// POST /api/history/upload - Upload browsing history
router.post('/upload', async (req: Request, res: Response) => {
  try {
    // Extract userId from JWT token (set by auth middleware)
    const userId = (req as any).auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const items: HistoryItem[] = req.body.items || req.body;

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

    const response: UploadResponse = {
      success: true,
      itemsProcessed: itemsProcessed,
      message: `Successfully uploaded ${itemsProcessed} items`,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      itemsProcessed: 0,
      message: `Error uploading history: ${error.message}`,
    });
  }
});

// POST /api/history/search - Search browsing history
router.post('/search', async (req: Request, res: Response) => {
  try {
    // Extract userId from JWT token (set by auth middleware)
    const userId = (req as any).auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    const { query, limit = 10, minScore = 0.3 }: SearchQuery = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
      });
    }

    console.log(`User ${userId} searching for: "${query}"`);

    // Use OpenRouter for triangular synthesis
    const { response: aiResponse, results } = await queryWithOpenRouter(query, userId, limit, minScore);

    const response: SearchResponse = {
      results: results,
      total: results.length,
      query: query,
    };

    res.json({
      ...response,
      aiResponse: aiResponse,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({
      error: `Error searching history: ${error.message}`,
    });
  }
});

// GET /api/history/stats - Get collection statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Extract userId from JWT token (set by auth middleware)
    const userId = (req as any).auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    const stats = await getStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: `Error getting stats: ${error.message}`,
    });
  }
});

// GET /api/history/last-sync-time - Get last sync timestamp for user
router.get('/last-sync-time', async (req: Request, res: Response) => {
  try {
    // Extract userId from JWT token (set by auth middleware)
    const userId = (req as any).auth?.payload?.sub;

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
  } catch (error: any) {
    console.error('Last sync time error:', error);
    res.status(500).json({
      error: `Error getting last sync time: ${error.message}`,
      lastSyncTime: 0, // Return 0 on error to trigger full sync
    });
  }
});

export default router;
