import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  // For continuous chunk recording
  const chunkRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Setup transcription listener
  useEffect(() => {
    const handleTranscriptionUpdate = (result: any) => {
      console.log('Transcription update:', result);
      
      if (result.transcription && result.transcription !== '...') {
        const timestamp = new Date(result.timestamp).toLocaleTimeString();
        setCurrentTranscription(prev => {
          const newText = `[${timestamp}] ${result.transcription}`;
          return prev ? `${prev}\n${newText}` : newText;
        });
      }
      setIsTranscribing(false);
    };

    (window as any).electronAPI.onTranscriptionUpdate(handleTranscriptionUpdate);

    return () => {
      (window as any).electronAPI.removeTranscriptionListener();
    };
  }, []);

  // Converter WebM para PCM 16kHz
  const convertWebMToPCM = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      console.log('Converting WebM to PCM...');
      
      // Converter Blob para ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Criar contexto de áudio com 16kHz
      const audioContext = new AudioContext({ sampleRate: 16000 });
      
      // Decodificar áudio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Obter dados do canal (converter para mono se necessário)
      const channelData = audioBuffer.getChannelData(0);
      
      // Converter Float32Array para Int16Array (PCM 16-bit)
      const pcmData = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        // Converter de -1.0 a 1.0 para -32768 a 32767
        pcmData[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32767));
      }
      
      // Converter para base64
      const pcmBytes = new Uint8Array(pcmData.buffer);
      let binaryString = '';
      for (let i = 0; i < pcmBytes.length; i++) {
        binaryString += String.fromCharCode(pcmBytes[i]);
      }
      
      await audioContext.close();
      return btoa(binaryString);
    } catch (error) {
      console.error('Error converting WebM to PCM:', error);
      throw error;
    }
  }, []);

  // Send audio chunk via Live API
  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      
      // Converter WebM para PCM 16kHz
      const pcmData = await convertWebMToPCM(audioBlob);
      
      // Enviar dados PCM para o main process
      await (window as any).electronAPI.sendAudioChunk(pcmData);
      
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      setIsTranscribing(false);
    }
  }, [convertWebMToPCM]);

  // Setup continuous chunk recording for transcription
  const setupChunkRecording = useCallback(() => {
    if (!micStreamRef.current) return;

    // Create a new MediaRecorder for chunk processing
    const chunkRecorder = new MediaRecorder(micStreamRef.current, {
      mimeType: 'audio/webm;codecs=opus',
    });

    let chunkData: Blob[] = [];

    chunkRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunkData.push(event.data);
      }
    };

    chunkRecorder.onstop = () => {
      if (chunkData.length > 0) {
        const audioBlob = new Blob(chunkData, { type: 'audio/webm;codecs=opus' });
        sendAudioChunk(audioBlob);
        chunkData = [];
      }
    };

    chunkRecorderRef.current = chunkRecorder;

    // Start continuous chunk recording (reduced to 2 seconds for better responsiveness)
    const startChunkCycle = () => {
      if (chunkRecorderRef.current && isRecording) {
        if (chunkRecorderRef.current.state === 'inactive') {
          chunkRecorderRef.current.start();
        }
        
        // Stop and restart every 2 seconds for Live API
        setTimeout(() => {
          if (chunkRecorderRef.current && chunkRecorderRef.current.state === 'recording') {
            chunkRecorderRef.current.stop();
            // Wait a bit then start next cycle
            setTimeout(() => {
              if (isRecording) {
                startChunkCycle();
              }
            }, 100);
          }
        }, 2000); // Reduced from 3000 to 2000ms for better real-time experience
      }
    };

    startChunkCycle();
  }, [sendAudioChunk, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Start Live API session
      const session = await (window as any).electronAPI.startLiveTranscription();
      sessionIdRef.current = session.sessionId;
      console.log('Live transcription started:', session.sessionId);
      
      // Request both microphone and screen audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      micStreamRef.current = micStream;

      // Try to get system audio
      let systemStream: MediaStream | null = null;
      try {
        systemStream = await navigator.mediaDevices.getDisplayMedia({
          video: false,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch (error) {
        console.warn('Could not capture system audio:', error);
      }

      // Create a combined stream for complete recording
      const audioContext = new AudioContext();
      const mixedOutput = audioContext.createMediaStreamDestination();

      // Connect microphone
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(mixedOutput);

      // Connect system audio if available
      if (systemStream) {
        const systemSource = audioContext.createMediaStreamSource(systemStream);
        systemSource.connect(mixedOutput);
      }

      // Set up MediaRecorder for saving the complete recording
      const mediaRecorder = new MediaRecorder(mixedOutput.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${timestamp}.webm`;

        try {
          const result = await (window as any).electronAPI.saveAudioRecording(arrayBuffer, filename);
          console.log('Recording saved:', result.filePath);
        } catch (error) {
          console.error('Error saving recording:', error);
        }

        // Clean up streams
        micStream.getTracks().forEach(track => track.stop());
        if (systemStream) {
          systemStream.getTracks().forEach(track => track.stop());
        }
        
        // Close audio context
        audioContext.close();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  // Setup chunk recording when recording starts
  useEffect(() => {
    if (isRecording && micStreamRef.current) {
      setupChunkRecording();
    }
    
    return () => {
      if (chunkRecorderRef.current) {
        chunkRecorderRef.current.stop();
        chunkRecorderRef.current = null;
      }
    };
  }, [isRecording, setupChunkRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop chunk recorder
      if (chunkRecorderRef.current) {
        chunkRecorderRef.current.stop();
        chunkRecorderRef.current = null;
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop Live API session
      if (sessionIdRef.current) {
        (window as any).electronAPI.stopLiveTranscription(sessionIdRef.current);
        sessionIdRef.current = null;
      }

      // Clear mic stream ref
      micStreamRef.current = null;
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
      setCurrentTranscription(''); // Clear previous transcription
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (chunkRecorderRef.current) {
        chunkRecorderRef.current.stop();
      }
      if (sessionIdRef.current) {
        (window as any).electronAPI.stopLiveTranscription(sessionIdRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    recordingTime,
    currentTranscription,
    isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}; 