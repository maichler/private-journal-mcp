// Global test setup
// Mock the transformers library to avoid ES module issues in tests
import { mock } from 'bun:test';

mock.module('@xenova/transformers', () => ({
  pipeline: () =>
    Promise.resolve(
      // Create a mock function that returns different embeddings based on text content
      (text: string) => {
        const lowerText = text.toLowerCase();

        let embedding: number[];

        if (
          lowerText.includes('frustrated') ||
          lowerText.includes('upset') ||
          lowerText.includes('debugging')
        ) {
          // Similar embeddings for frustration-related text
          embedding = [0.9, 0.1, 0.1, 0.1, 0.1];
        } else if (lowerText.includes('react') && lowerText.includes('component')) {
          // Different embedding for React components
          embedding = [0.1, 0.9, 0.1, 0.1, 0.1];
        } else if (lowerText.includes('async') || lowerText.includes('javascript')) {
          // Different embedding for async/JavaScript
          embedding = [0.1, 0.1, 0.9, 0.1, 0.1];
        } else if (lowerText.includes('typescript') && !lowerText.includes('frustrated')) {
          // TypeScript in general (non-frustrated context)
          embedding = [0.1, 0.1, 0.1, 0.9, 0.1];
        } else {
          // Default embedding for other text
          embedding = [0.2, 0.2, 0.2, 0.2, 0.2];
        }

        return Promise.resolve({
          data: new Float32Array(embedding),
        });
      },
    ),
}));
