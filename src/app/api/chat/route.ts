import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hacpGate } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations } from '@/db/schema';
import { generateResponse } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);
    
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, userId, taskType = 'sal', useRAG = true, stream = false } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // HACP Gate check
    const gate = await hacpGate(prompt, verified.role);
    if (!gate.pass) {
      return NextResponse.json({ error: gate.error }, { status: 403 });
    }

    // If streaming requested, redirect to stream endpoint
    if (stream) {
      return NextResponse.json({ 
        redirect: '/api/chat/stream',
        message: 'Use /api/chat/stream for streaming responses'
      });
    }

    // Generate response with RAG
    const startTime = Date.now();
    const result = await generateResponse(prompt, verified.userId, useRAG);
    const latency = Date.now() - startTime;

    // Save conversation
    try {
      await db.insert(conversations).values({
        userId: verified.userId,
        prompt,
        response: result.text,
        model: result.model,
        hacpScore: gate.score || 0.85,
      });
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError);
      // Continue even if DB save fails
    }

    return NextResponse.json({ 
      response: result.text,
      model: result.model,
      tokens: result.tokens,
      latency,
      hacpCompliant: true,
      hacpScore: gate.score || 0.85,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Fallback response if API fails
    const errorMessage = error?.message || 'Unknown error';
    if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
      return NextResponse.json({ 
        error: 'AI service not configured. Please set API keys in environment variables.',
        response: 'HACP™ Active | Patent 10,290,222\n\nService configuration required.'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Chat service error',
      response: 'HACP™ Active | Patent 10,290,222\n\nService temporarily unavailable.'
    }, { status: 500 });
  }
}
