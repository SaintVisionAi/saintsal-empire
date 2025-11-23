import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ElevenLabsClient } from 'elevenlabs-js';

const elevenlabs = process.env.ELEVENLABS_API_KEY 
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);
    
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = body; // Default voice

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    if (!elevenlabs) {
      return NextResponse.json({ 
        error: 'Voice service not configured. Please set ELEVENLABS_API_KEY in environment variables.',
        audioUrl: null
      }, { status: 503 });
    }

    // Generate speech
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    // Convert to base64 for response
    const arrayBuffer = await audio.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64}`;

    return NextResponse.json({ 
      audioUrl: audioDataUrl,
      text,
      voiceId,
      format: 'mp3'
    });
  } catch (error: any) {
    console.error('Voice generation error:', error);
    
    return NextResponse.json({ 
      error: 'Voice generation service error',
      message: error.message
    }, { status: 500 });
  }
}

