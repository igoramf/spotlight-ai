// @ts-ignore
import WebSocket from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

interface TranscriptionResult {
  transcription: string;
  timestamp: string;
  type: 'input' | 'output';
}

export class LiveTranscriptionManager {
  private liveSession: WebSocket | null = null;
  private transcriptionCallbacks: Map<string, (result: TranscriptionResult) => void> = new Map();
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_API_KEY;
    
    
    if (apiKey) {
      try {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      } catch (error) {
        console.error('Error initializing Gemini client:', error);
      }
    } else {
      console.warn('No Gemini API key found. Please check your .env file.');
      console.warn('Expected environment variables: VITE_GEMINI_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY');
    }
  }

  async initializeLiveAPI(): Promise<WebSocket> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('API key not found');
    }

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    
    this.liveSession = new WebSocket(url);

    return new Promise((resolve, reject) => {
      this.liveSession!.onopen = () => {
        console.log('Live API WebSocket connected');
        
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
              response_modalities: ["TEXT"]
            },
            system_instruction: {
              parts: [{
                text: "Você é um assistente que transcreve áudio em tempo real para português brasileiro. Forneça apenas a transcrição limpa do que foi falado."
              }]
            }
          }
        };

        this.liveSession!.send(JSON.stringify(setupMessage));
        resolve(this.liveSession!);
      };

      this.liveSession!.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data.toString());
          
          if (data.serverContent?.inputTranscription?.text) {
            const transcription = data.serverContent.inputTranscription.text;
            const timestamp = new Date().toISOString();
            
            this.transcriptionCallbacks.forEach(callback => {
              callback({
                transcription,
                timestamp,
                type: 'input'
              });
            });
          }
          
          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.text) {
                const transcription = part.text;
                const timestamp = new Date().toISOString();
                
                this.transcriptionCallbacks.forEach(callback => {
                  callback({
                    transcription,
                    timestamp,
                    type: 'output'
                  });
                });
              }
            }
          }
          
        } catch (error) {
          console.error('Error parsing Live API message:', error);
        }
      };

      this.liveSession!.onerror = (error: any) => {
        console.error('Live API WebSocket error:', error);
        reject(error);
      };

      this.liveSession!.onclose = (event: any) => {
        console.log('Live API WebSocket closed:', event.code, event.reason);
        this.liveSession = null;
      };
    });
  }

  sendAudioChunk(pcmData: string): void {
    if (!this.liveSession || this.liveSession.readyState !== WebSocket.OPEN) {
      console.warn('Live API not connected');
      return;
    }

    const message = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: "audio/pcm;rate=16000",
          data: pcmData
        }]
      }
    };

    this.liveSession.send(JSON.stringify(message));
  }

  async startSession(): Promise<string> {
    const sessionId = Date.now().toString();
    
    if (!this.liveSession) {
      await this.initializeLiveAPI();
    }
    
    return sessionId;
  }

  registerCallback(sessionId: string, callback: (result: TranscriptionResult) => void): void {
    this.transcriptionCallbacks.set(sessionId, callback);
  }

  removeCallback(sessionId: string): void {
    this.transcriptionCallbacks.delete(sessionId);
    
    if (this.transcriptionCallbacks.size === 0 && this.liveSession) {
      this.liveSession.close();
      this.liveSession = null;
    }
  }

  close(): void {
    this.transcriptionCallbacks.clear();
    if (this.liveSession) {
      this.liveSession.close();
      this.liveSession = null;
    }
  }

  isConnected(): boolean {
    return this.liveSession?.readyState === WebSocket.OPEN;
  }
} 