import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

interface TranscriptionResult {
  transcription: string;
  timestamp: string;
  type: 'input' | 'output';
}

export class OpenAILiveTranscriptionManager {
  private realtimeSession: WebSocket | null = null;
  private transcriptionCallbacks: Map<string, (result: TranscriptionResult) => void> = new Map();
  private apiKey: string | null = null;
  private sessionId: string | null = null;
  private debugMode: boolean = true;

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    this.apiKey = process.env.VITE_OPENAI_API_KEY || 
                  process.env.OPENAI_API_KEY || 
                  process.env.VITE_AZURE_OPENAI_API_KEY || null;
    
    if (!this.apiKey) {
      console.warn('No OpenAI API key found. Please check your .env file.');
      console.warn('Expected environment variables: VITE_OPENAI_API_KEY, OPENAI_API_KEY, or VITE_AZURE_OPENAI_API_KEY');
    }
  }

  private debugLog(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[OpenAI Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  async initializeLiveAPI(): Promise<WebSocket> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
    
    this.realtimeSession = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    return new Promise((resolve, reject) => {
      this.realtimeSession!.onopen = () => {
        console.log('OpenAI Realtime API WebSocket connected');
        
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ['audio', 'text'],
            instructions: 'Você é um sistema de transcrição. Apenas transcreva o áudio para português brasileiro. Não responda ou comente.',
            input_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.3,
              prefix_padding_ms: 100,
              silence_duration_ms: 400
            },
            tools: [],
            tool_choice: 'none',
            temperature: 0.6,
            max_response_output_tokens: 1
          }
        };

        this.realtimeSession!.send(JSON.stringify(sessionUpdate));
        resolve(this.realtimeSession!);
      };

      this.realtimeSession!.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data.toString());
          console.log('OpenAI Realtime message:', data.type);
          
          if (data.type.includes('transcription') || data.type.includes('conversation.item') || data.type.includes('audio')) {
            this.debugLog(`Received ${data.type}:`, data);
          }
          
          if (data.type === 'conversation.item.input_audio_transcription.completed') {
            const transcription = data.transcript;
            console.log('OpenAI transcription completed:', transcription);
            if (transcription && transcription.trim()) {
              const timestamp = new Date().toISOString();
              
              this.transcriptionCallbacks.forEach(callback => {
                callback({
                  transcription: transcription.trim(),
                  timestamp,
                  type: 'input'
                });
              });
            }
          }

          if (data.type === 'conversation.item.input_audio_transcription.delta') {
            const transcription = data.delta;
            console.log('OpenAI transcription delta:', transcription);
            if (transcription && transcription.trim()) {
              const timestamp = new Date().toISOString();
              
              this.transcriptionCallbacks.forEach(callback => {
                callback({
                  transcription: transcription.trim(),
                  timestamp,
                  type: 'input'
                });
              });
            }
          }

          if (data.type === 'conversation.item_input_audio_transcription.completed') {
            const transcription = data.transcript;
            console.log('OpenAI alternative transcription completed:', transcription);
            if (transcription && transcription.trim()) {
              const timestamp = new Date().toISOString();
              
              this.transcriptionCallbacks.forEach(callback => {
                callback({
                  transcription: transcription.trim(),
                  timestamp,
                  type: 'input'
                });
              });
            }
          }

          if (data.type === 'conversation.item.created') {
            const item = data.item;
            if (item && item.type === 'message' && item.role === 'user') {
              if (item.content && Array.isArray(item.content)) {
                for (const content of item.content) {
                  if (content.type === 'input_audio' && content.transcript) {
                    console.log('OpenAI conversation item transcript:', content.transcript);
                    const timestamp = new Date().toISOString();
                    
                    this.transcriptionCallbacks.forEach(callback => {
                      callback({
                        transcription: content.transcript.trim(),
                        timestamp,
                        type: 'input'
                      });
                    });
                  }
                }
              }
            }
          }

          if (data.type === 'conversation.item.input_audio_transcription.failed') {
            console.error('Input audio transcription failed:', data.error);
          }

          if (data.type === 'response.content_part.added') {
            const part = data.part;
            if (part && part.type === 'text' && part.text) {
              console.log('OpenAI response text (possible transcription):', part.text);
              const timestamp = new Date().toISOString();
              
              this.transcriptionCallbacks.forEach(callback => {
                callback({
                  transcription: part.text.trim(),
                  timestamp,
                  type: 'output'
                });
              });
            }
          }

          if (data.type === 'response.output_item.done') {
            const item = data.item;
            if (item && item.type === 'message' && item.content) {
              for (const content of item.content) {
                if (content.type === 'text' && content.text) {
                  console.log('OpenAI output text (possible transcription):', content.text);
                  const timestamp = new Date().toISOString();
                  
                  this.transcriptionCallbacks.forEach(callback => {
                    callback({
                      transcription: content.text.trim(),
                      timestamp,
                      type: 'output'
                    });
                  });
                }
              }
            }
          }

          if (data.type === 'session.created') {
            this.sessionId = data.session.id;
            console.log('OpenAI session created:', this.sessionId);
          }

          if (data.type === 'error') {
            console.error('OpenAI Realtime error:', data.error);
          }
          
        } catch (error) {
          console.error('Error parsing OpenAI Realtime message:', error);
        }
      };

      this.realtimeSession!.onerror = (error: any) => {
        console.error('OpenAI Realtime WebSocket error:', error);
        reject(error);
      };

      this.realtimeSession!.onclose = (event: any) => {
        console.log('OpenAI Realtime WebSocket closed:', event.code, event.reason);
        this.realtimeSession = null;
        this.sessionId = null;
      };
    });
  }

  sendAudioChunk(pcmData: string): void {
    if (!this.realtimeSession || this.realtimeSession.readyState !== WebSocket.OPEN) {
      console.warn('OpenAI Realtime API not connected');
      return;
    }

    const message = {
      type: 'input_audio_buffer.append',
      audio: pcmData
    };

    this.realtimeSession.send(JSON.stringify(message));
  }

  async startSession(): Promise<string> {
    const sessionId = Date.now().toString();
    
    if (!this.realtimeSession) {
      await this.initializeLiveAPI();
    }
    
    return sessionId;
  }

  registerCallback(sessionId: string, callback: (result: TranscriptionResult) => void): void {
    this.transcriptionCallbacks.set(sessionId, callback);
  }

  removeCallback(sessionId: string): void {
    this.transcriptionCallbacks.delete(sessionId);
    
    if (this.transcriptionCallbacks.size === 0 && this.realtimeSession) {
      this.realtimeSession.close();
      this.realtimeSession = null;
      this.sessionId = null;
    }
  }

  close(): void {
    this.transcriptionCallbacks.clear();
    if (this.realtimeSession) {
      this.realtimeSession.close();
      this.realtimeSession = null;
      this.sessionId = null;
    }
  }

  isConnected(): boolean {
    return this.realtimeSession?.readyState === WebSocket.OPEN;
  }


} 