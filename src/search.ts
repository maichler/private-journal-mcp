// ABOUTME: Journal search functionality with vector similarity
// ABOUTME: Provides semantic search across journal entries

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { type EmbeddingData, EmbeddingService } from './embeddings.js';

export interface SearchResult {
  path: string;
  score: number;
  text: string;
  sections: string[];
  timestamp: number;
  excerpt: string;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  sections?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export class SearchService {
  private embeddingService: EmbeddingService;
  private journalPath: string;

  constructor(journalPath: string) {
    this.embeddingService = EmbeddingService.getInstance();
    this.journalPath = journalPath;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 10, minScore = 0.1, sections, dateRange } = options;

    // Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Collect all embeddings
    const allEmbeddings = await this.loadEmbeddingsFromPath(this.journalPath);

    // Filter by criteria
    const filtered = allEmbeddings.filter((embedding) => {
      // Filter by sections if specified
      if (sections && sections.length > 0) {
        const hasMatchingSection = sections.some((section) =>
          embedding.sections.some((embeddingSection) =>
            embeddingSection.toLowerCase().includes(section.toLowerCase()),
          ),
        );
        if (!hasMatchingSection) {
          return false;
        }
      }

      // Filter by date range
      if (dateRange) {
        const entryDate = new Date(embedding.timestamp);
        if (dateRange.start && entryDate < dateRange.start) {
          return false;
        }
        if (dateRange.end && entryDate > dateRange.end) {
          return false;
        }
      }

      return true;
    });

    // Calculate similarities and sort
    const results: SearchResult[] = filtered
      .map((embedding) => {
        const score = this.embeddingService.cosineSimilarity(queryEmbedding, embedding.embedding);
        const excerpt = this.generateExcerpt(embedding.text, query);

        return {
          path: embedding.path,
          score,
          text: embedding.text,
          sections: embedding.sections,
          timestamp: embedding.timestamp,
          excerpt,
        };
      })
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async listRecent(options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 10, dateRange } = options;

    const allEmbeddings = await this.loadEmbeddingsFromPath(this.journalPath);

    // Filter by date range
    const filtered = dateRange
      ? allEmbeddings.filter((embedding) => {
          const entryDate = new Date(embedding.timestamp);
          if (dateRange.start && entryDate < dateRange.start) {
            return false;
          }
          if (dateRange.end && entryDate > dateRange.end) {
            return false;
          }
          return true;
        })
      : allEmbeddings;

    // Sort by timestamp (most recent first) and limit
    const results: SearchResult[] = filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map((embedding) => ({
        path: embedding.path,
        score: 1, // No similarity score for recent entries
        text: embedding.text,
        sections: embedding.sections,
        timestamp: embedding.timestamp,
        excerpt: this.generateExcerpt(embedding.text, '', 150),
      }));

    return results;
  }

  async readEntry(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return null;
      }
      throw error;
    }
  }

  private async loadEmbeddingsFromPath(basePath: string): Promise<EmbeddingData[]> {
    const embeddings: EmbeddingData[] = [];

    try {
      const dayDirs = await fs.readdir(basePath);

      for (const dayDir of dayDirs) {
        const dayPath = path.join(basePath, dayDir);
        const stat = await fs.stat(dayPath);

        if (!stat.isDirectory() || !dayDir.match(/^\d{4}-\d{2}-\d{2}$/)) {
          continue;
        }

        const files = await fs.readdir(dayPath);
        const embeddingFiles = files.filter((file) => file.endsWith('.embedding'));

        for (const embeddingFile of embeddingFiles) {
          try {
            const embeddingPath = path.join(dayPath, embeddingFile);
            const content = await fs.readFile(embeddingPath, 'utf8');
            const embeddingData = JSON.parse(content);
            embeddings.push(embeddingData);
          } catch (error) {
            console.error(`Failed to load embedding ${embeddingFile}:`, error);
          }
        }
      }
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          'code' in error &&
          (error as NodeJS.ErrnoException).code === 'ENOENT'
        )
      ) {
        console.error(`Failed to read embeddings from ${basePath}:`, error);
      }
    }

    return embeddings;
  }

  private generateExcerpt(text: string, query: string, maxLength = 200): string {
    if (!query || query.trim() === '') {
      return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const queryWords = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();

    // Find the best position to start the excerpt
    let bestPosition = 0;
    let bestScore = 0;

    for (let i = 0; i <= text.length - maxLength; i += 20) {
      const window = textLower.slice(i, i + maxLength);
      const score = queryWords.reduce((sum, word) => {
        return sum + (window.includes(word) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestPosition = i;
      }
    }

    let excerpt = text.slice(bestPosition, bestPosition + maxLength);
    if (bestPosition > 0) {
      excerpt = `...${excerpt}`;
    }
    if (bestPosition + maxLength < text.length) {
      excerpt += '...';
    }

    return excerpt;
  }
}
