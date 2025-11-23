import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations } from '@/db/schema';
import { generateResponse } from '@/lib/llm';
import { hacpGate } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);
    
    if (!verified) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { prompt, userId, taskType = 'sal', useRAG = true } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // HACP Gate check
    const gate = await hacpGate(prompt, verified.role);
    if (!gate.pass) {
      return new Response(JSON.stringify({ error: gate.error }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          await generateResponse(
            prompt,
            verified.userId,
            useRAG,
            (chunk) => {
              if (chunk.text) {
                fullResponse += chunk.text;
                const data = JSON.stringify({
                  type: 'chunk',
                  text: chunk.text,
                  done: chunk.done,
                  model: chunk.model,
                }) + '\n';
                controller.enqueue(encoder.encode(data));
              }
            }
          );

          // Save conversation after streaming completes
          try {
            await db.insert(conversations).values({
              userId: verified.userId,
              prompt,
              response: fullResponse,
              model: 'claude-3-5-sonnet', // Will be updated with actual model
              hacpScore: gate.score || 0.85,
            });
          } catch (dbError) {
            console.error('Failed to save conversation:', dbError);
          }

          // Send completion message
          const completion = JSON.stringify({
            type: 'done',
            model: 'claude-3-5-sonnet',
            hacpCompliant: true,
          }) + '\n';
          controller.enqueue(encoder.encode(completion));
        } catch (error: any) {
          const errorMsg = JSON.stringify({
            type: 'error',
            error: error.message || 'Generation failed',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMsg));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

