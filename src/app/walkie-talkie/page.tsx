'use client';
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Phone, PhoneOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WalkieTalkie() {
  const [isRecording, setIsRecording] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Initialize Web Speech API for real-time transcription
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscription(finalTranscript || interimTranscript);
          if (finalTranscript) {
            setText((prev) => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Send to speech-to-text API
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Start speech recognition if available
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Note: You'll need to create a /api/transcribe endpoint
      // For now, we'll use the text from speech recognition
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setText((prev) => prev + data.text);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback to speech recognition text
    }
  };

  const generateVoice = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ text: text.trim() })
      });
      const data = await res.json();
      
      if (data.audioUrl) {
        // Create audio element and play
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          audio.play();
        }
      } else {
        alert('Voice generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      alert('Error generating voice');
    } finally {
      setLoading(false);
    }
  };

  const startCall = () => {
    setIsCallActive(true);
    startRecording();
  };

  const endCall = () => {
    setIsCallActive(false);
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">Walkie Talkie</h1>
      <p className="text-gray-400 mb-6">Real-time voice-to-voice communication with SaintSal™</p>
      
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Call Controls */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Voice Call</h2>
          <div className="flex items-center justify-center space-x-4">
            {!isCallActive ? (
              <button
                onClick={startCall}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg"
              >
                <Phone />
                <span>Start Call</span>
              </button>
            ) : (
              <button
                onClick={endCall}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg"
              >
                <PhoneOff />
                <span>End Call</span>
              </button>
            )}
          </div>
          {isCallActive && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Call Active - Listening...</span>
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Record & Transcribe</h2>
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gold text-black hover:bg-yellow-400'
              }`}
            >
              {isRecording ? <MicOff /> : <Mic />}
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Recording...</span>
              </div>
            )}
            {isListening && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Listening...</span>
              </div>
            )}
          </div>
          
          {transcription && (
            <div className="bg-gray-800 p-4 rounded mb-4">
              <p className="text-sm text-gray-400 mb-1">Live Transcription:</p>
              <p className="text-white">{transcription}</p>
            </div>
          )}

          {audioUrl && (
            <div className="mt-4">
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
        </div>

        {/* Text Input & Voice Generation */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Text to Speech</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech, or use voice recording above..."
            className="w-full p-4 bg-gray-800 rounded text-white min-h-[120px] mb-4 resize-none"
          />
          <div className="flex items-center space-x-4">
            <button
              onClick={generateVoice}
              disabled={!text.trim() || loading}
              className="flex items-center space-x-2 bg-gold text-black py-3 px-6 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Volume2 />
              <span>{loading ? 'Generating...' : 'Generate Voice'}</span>
            </button>
            {text && (
              <button
                onClick={() => setText('')}
                className="text-gray-400 hover:text-white text-sm"
              >
                Clear
              </button>
            )}
          </div>
          {audioRef.current && (
            <div className="mt-4">
              <audio ref={audioRef} controls className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

