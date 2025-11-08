import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any | null = null;

// Initialize the embedding model (lazy loading)
export async function initializeEmbeddingModel(): Promise<void> {
  if (!embeddingPipeline) {
    console.log('Loading embedding model: Xenova/all-MiniLM-L6-v2...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded successfully');
  }
}

// Generate embedding for a single text
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    await initializeEmbeddingModel();
  }

  const output = await embeddingPipeline!(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Convert tensor to array
  return Array.from(output.data);
}

// Generate embeddings for multiple texts (batch)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}

// Create embedding text from history item (URL + title)
export function createEmbeddingText(url: string, title: string): string {
  // Combine title and URL for better semantic representation
  const cleanTitle = title || 'Untitled';
  return `${cleanTitle} ${url}`;
}
