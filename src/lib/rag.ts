import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { db } from './db';
import { knowledge } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Azure Cognitive Search
const searchClient = process.env.AZURE_SEARCH_ENDPOINT && process.env.AZURE_SEARCH_KEY
  ? new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT,
      process.env.AZURE_SEARCH_INDEX_NAME || 'saintsal-knowledge',
      new AzureKeyCredential(process.env.AZURE_SEARCH_KEY)
    )
  : null;

export interface RAGResult {
  content: string;
  score: number;
  source?: string;
}

/**
 * Search knowledge base using Azure Cognitive Search
 */
export async function searchKnowledge(query: string, userId?: number, topK: number = 5): Promise<RAGResult[]> {
  if (!searchClient) {
    // Fallback to database search if Azure Search not configured
    return searchKnowledgeDB(query, userId, topK);
  }

  try {
    const searchResults = await searchClient.search(query, {
      top: topK,
      includeTotalCount: true,
      filter: userId ? `userId eq ${userId}` : undefined,
    });

    const results: RAGResult[] = [];
    for await (const result of searchResults.results) {
      if (result.score !== undefined) {
        results.push({
          content: result.document.content as string || '',
          score: result.score,
          source: result.document.title as string,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Azure Search error:', error);
    // Fallback to database search
    return searchKnowledgeDB(query, userId, topK);
  }
}

/**
 * Fallback database search using simple text matching
 */
async function searchKnowledgeDB(query: string, userId?: number, topK: number = 5): Promise<RAGResult[]> {
  try {
    let queryBuilder = db.select().from(knowledge);
    
    if (userId) {
      queryBuilder = queryBuilder.where(eq(knowledge.userId, userId)) as any;
    }

    const results = await queryBuilder.limit(topK);
    
    return results.map((item) => ({
      content: item.content,
      score: 0.8, // Default score for DB results
      source: item.title,
    }));
  } catch (error) {
    console.error('Database search error:', error);
    return [];
  }
}

/**
 * Add knowledge to the search index
 */
export async function indexKnowledge(title: string, content: string, userId?: number, embedding?: number[]) {
  try {
    // Save to database
    const [newKnowledge] = await db.insert(knowledge).values({
      title,
      content,
      userId: userId || null,
      embedding: embedding ? JSON.stringify(embedding) : null,
    }).returning();

    // Index in Azure Search if configured
    if (searchClient && newKnowledge) {
      await searchClient.uploadDocuments([{
        id: newKnowledge.id.toString(),
        title,
        content,
        userId: userId?.toString() || '',
      }]);
    }

    return newKnowledge;
  } catch (error) {
    console.error('Indexing error:', error);
    throw error;
  }
}

/**
 * Generate embeddings using OpenAI (for vector search)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    // Return empty embedding if API fails
    return [];
  }
}

