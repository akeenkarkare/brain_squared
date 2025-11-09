let embeddingPipeline = null;
let pipelineFunction = null;
// Initialize the embedding model (lazy loading)
export async function initializeEmbeddingModel() {
    if (!embeddingPipeline) {
        console.log('Loading embedding model: Xenova/all-MiniLM-L6-v2...');
        // Use dynamic import to load ESM module
        if (!pipelineFunction) {
            try {
                const module = await import('@xenova/transformers');
                pipelineFunction = module.pipeline;
            }
            catch (error) {
                console.error('Failed to import @xenova/transformers:', error);
                throw error;
            }
        }
        embeddingPipeline = await pipelineFunction('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('Embedding model loaded successfully');
    }
}
// Generate embedding for a single text
export async function generateEmbedding(text) {
    if (!embeddingPipeline) {
        await initializeEmbeddingModel();
    }
    const output = await embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
    });
    // Convert tensor to array
    return Array.from(output.data);
}
// Generate embeddings for multiple texts (batch)
export async function generateEmbeddings(texts) {
    const embeddings = [];
    for (const text of texts) {
        const embedding = await generateEmbedding(text);
        embeddings.push(embedding);
    }
    return embeddings;
}
// Create embedding text from history item (URL + title)
export function createEmbeddingText(url, title) {
    // Combine title and URL for better semantic representation
    const cleanTitle = title || 'Untitled';
    return `${cleanTitle} ${url}`;
}
