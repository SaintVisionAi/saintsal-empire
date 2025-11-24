import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchKnowledge } from './rag';

// Initialize all LLM clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
      baseURL: process.env.AZURE_OPENAI_ENDPOINT 
        ? `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_DEPLOYMENT_GPT5_CORE || 'gpt-4'}` 
        : undefined,
      defaultQuery: process.env.AZURE_OPENAI_API_KEY ? { 'api-version': '2024-02-15-preview' } : undefined,
    })
  : null;

const gemini = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)
  : null;

export interface LLMResponse {
  text: string;
  model: string;
  tokens?: number;
  latency?: number;
}

export interface LLMStreamChunk {
  text: string;
  done: boolean;
  model: string;
}

/**
 * Get the best available LLM model
 * Priority: Claude > Azure GPT-5 > GPT-4 > GPT-3.5 > Gemini
 */
function getBestModel(): 'claude' | 'gpt5' | 'gpt4' | 'gpt35' | 'gemini' | null {
  if (anthropic) return 'claude';
  if (openai && process.env.AZURE_DEPLOYMENT_GPT5_CORE) return 'gpt5';
  if (openai) return 'gpt4';
  if (gemini) return 'gemini';
  return null;
}

/**
 * Generate response with RAG context using the best available model
 */
export async function generateResponse(
  prompt: string,
  userId?: number,
  useRAG: boolean = true,
  stream?: (chunk: LLMStreamChunk) => void
): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = getBestModel();

  // Get RAG context if enabled
  let context = '';
  if (useRAG) {
    const ragResults = await searchKnowledge(prompt, userId, 3);
    if (ragResults.length > 0) {
      context = '\n\nRelevant Context:\n' + ragResults.map(r => r.content).join('\n\n');
    }
  }

  const enhancedPrompt = context ? `${prompt}${context}` : prompt;

  try {
    switch (model) {
      case 'claude':
        return await generateClaude(enhancedPrompt, stream);
      
      case 'gpt5':
        return await generateGPT5(enhancedPrompt, stream);
      
      case 'gpt4':
        return await generateGPT4(enhancedPrompt, stream);
      
      case 'gpt35':
        return await generateGPT35(enhancedPrompt, stream);
      
      case 'gemini':
        return await generateGemini(enhancedPrompt, stream);
      
      default:
        throw new Error('No LLM API keys configured');
    }
  } catch (error: any) {
    console.error('LLM generation error:', error);
    // Try fallback models
    if (model !== 'gemini' && gemini) {
      try {
        return await generateGemini(enhancedPrompt, stream);
      } catch (e) {
        console.error('Gemini fallback failed:', e);
      }
    }
    throw error;
  }
}

/**
 * Generate using Claude 3.5 Sonnet (best model)
 */
async function generateClaude(
  prompt: string,
  stream?: (chunk: LLMStreamChunk) => void
): Promise<LLMResponse> {
  if (!anthropic) throw new Error('Anthropic API not configured');

  if (stream) {
    // Streaming mode
    const streamResponse = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    let fullText = '';
    for await (const chunk of streamResponse) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullText += text;
        stream({ text, done: false, model: 'claude-3-5-sonnet' });
      }
    }
    stream({ text: '', done: true, model: 'claude-3-5-sonnet' });
    
    return {
      text: fullText,
      model: 'claude-3-5-sonnet-20241022',
    };
  } else {
    // Non-streaming mode
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      text,
      model: 'claude-3-5-sonnet-20241022',
    };
  }
}

/**
 * Generate using GPT-5 Core (Azure)
 */
async function generateGPT5(
  prompt: string,
  stream?: (chunk: LLMStreamChunk) => void
): Promise<LLMResponse> {
  if (!openai) throw new Error('OpenAI/Azure API not configured');

  const deployment = process.env.AZURE_DEPLOYMENT_GPT5_CORE || 'gpt-5-core';

  if (stream) {
    const streamResponse = await openai.chat.completions.create({
      model: deployment,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let fullText = '';
    for await (const chunk of streamResponse) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullText += text;
        stream({ text, done: false, model: 'gpt-5-core' });
      }
    }
    stream({ text: '', done: true, model: 'gpt-5-core' });

    return {
      text: fullText,
      model: 'gpt-5-core',
    };
  } else {
    const completion = await openai.chat.completions.create({
      model: deployment,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: completion.choices[0]?.message?.content || '',
      model: 'gpt-5-core',
      tokens: completion.usage?.total_tokens,
    };
  }
}

/**
 * Generate using GPT-4 Turbo
 */
async function generateGPT4(
  prompt: string,
  stream?: (chunk: LLMStreamChunk) => void
): Promise<LLMResponse> {
  if (!openai) throw new Error('OpenAI API not configured');

  if (stream) {
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let fullText = '';
    for await (const chunk of streamResponse) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullText += text;
        stream({ text, done: false, model: 'gpt-4-turbo' });
      }
    }
    stream({ text: '', done: true, model: 'gpt-4-turbo' });

    return {
      text: fullText,
      model: 'gpt-4-turbo-preview',
    };
  } else {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: completion.choices[0]?.message?.content || '',
      model: 'gpt-4-turbo-preview',
      tokens: completion.usage?.total_tokens,
    };
  }
}

/**
 * Generate using GPT-3.5 Turbo (fallback)
 */
async function generateGPT35(
  prompt: string,
  stream?: (chunk: LLMStreamChunk) => void
): Promise<LLMResponse> {
  if (!openai) throw new Error('OpenAI API not configured');

  if (stream) {
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let fullText = '';
    for await (const chunk of streamResponse) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullText += text;
        stream({ text, done: false, model: 'gpt-3.5-turbo' });
      }
    }
    stream({ text: '', done: true, model: 'gpt-3.5-turbo' });

    return {
      text: fullText,
      model: 'gpt-3.5-turbo',
    };
  } else {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: completion.choices[0]?.message?.content || '',
      model: 'gpt-3.5-turbo',
      tokens: completion.usage?.total_tokens,
    };
  }
}

/**
 * Generate using Google Gemini Pro
 */
async function generateGemini(
  prompt: string,
  stream?: (chunk: LLMStreamChunk) => void
): Promise<LLMResponse> {
  if (!gemini) throw new Error('Google AI API not configured');

  const model = gemini.getGenerativeModel({ model: 'gemini-pro' });

  if (stream) {
    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        stream({ text, done: false, model: 'gemini-pro' });
      }
    }
    stream({ text: '', done: true, model: 'gemini-pro' });

    return {
      text: fullText,
      model: 'gemini-pro',
    };
  } else {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      model: 'gemini-pro',
    };
  }
}

