import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import historyRoutes from './routes/history';
import { initializeCollection } from './config/qdrant';
import { initializeEmbeddingModel } from './services/embeddings';
import { checkJwt } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large payloads for history uploads

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Brain Squared backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Protected routes (require authentication)
app.use('/api/history', checkJwt, historyRoutes);

// Initialize and start server
async function startServer() {
  try {
    console.log('Starting Brain Squared backend...');

    // Initialize Qdrant collection
    console.log('Initializing Qdrant collection...');
    await initializeCollection();

    // Initialize embedding model
    console.log('Initializing embedding model...');
    await initializeEmbeddingModel();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n✅ Server is running on http://localhost:${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/history/upload`);
      console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/history/search`);
      console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/history/stats\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
