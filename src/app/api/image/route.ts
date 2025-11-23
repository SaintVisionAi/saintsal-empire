import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);
    
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Use Google Gemini for image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // For text-to-image, we'll use a placeholder since Gemini doesn't generate images directly
    // In production, you'd use DALL-E, Midjourney API, or Stable Diffusion
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Placeholder image URL - replace with actual image generation service
    const imageUrl = `https://via.placeholder.com/512x512/FFD700/000000?text=${encodeURIComponent(prompt.substring(0, 20))}`;

    return NextResponse.json({ 
      imageUrl,
      description: text,
      prompt,
      model: 'gemini-pro-vision'
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    
    if (error.message?.includes('API key')) {
      return NextResponse.json({ 
        error: 'Image service not configured. Please set GOOGLE_AI_API_KEY in environment variables.'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Image generation service error'
    }, { status: 500 });
  }
}

