import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { OpenAI } from 'openai';

const openai = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
      baseURL: process.env.AZURE_OPENAI_ENDPOINT || undefined,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const verified = verifyToken(token);
    
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({ 
        error: 'Speech-to-text service not configured. Please set OPENAI_API_KEY in environment variables.',
        text: 'Speech-to-text service not available.'
      }, { status: 503 });
    }

    // Convert File to format OpenAI expects
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({ 
      text: transcription.text,
      language: transcription.language,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Transcription failed',
      message: error.message,
      text: ''
    }, { status: 500 });
  }
}

