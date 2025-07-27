import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPreConnected, setIsPreConnected] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  const chunkRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const preConnect = async () => {
      try {
        if (!sessionIdRef.current && !isPreConnected) {
          console.log('Pre-connecting transcription session...');
          const session = await (window as any).electronAPI.startLiveTranscription();
          sessionIdRef.current = session.sessionId;
          setIsPreConnected(true);
          console.log('Pre-connection established:', session.sessionId);
        }
      } catch (error) {
        console.warn('Pre-connection failed:', error);
      }
    };

    preConnect();
  }, [isPreConnected]);

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

  const convertWebMToPCM = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      console.log('Converting WebM to PCM...');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      
      const pcmData = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32767));
      }
      
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

  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      
      const pcmData = await convertWebMToPCM(audioBlob);
      
      await (window as any).electronAPI.sendAudioChunk(pcmData);
      
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      setIsTranscribing(false);
    }
  }, [convertWebMToPCM]);

  const setupChunkRecording = useCallback(() => {
    if (!micStreamRef.current) return;

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

    const startChunkCycle = () => {
      if (chunkRecorderRef.current && isRecording) {
        if (chunkRecorderRef.current.state === 'inactive') {
          chunkRecorderRef.current.start();
        }
        
        setTimeout(() => {
          if (chunkRecorderRef.current && chunkRecorderRef.current.state === 'recording') {
            chunkRecorderRef.current.stop();
            setTimeout(() => {
              if (isRecording) {
                startChunkCycle();
              }
            }, 100);
          }
        }, 2000);
      }
    };

    startChunkCycle();
  }, [sendAudioChunk, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      if (!sessionIdRef.current) {
        const session = await (window as any).electronAPI.startLiveTranscription();
        sessionIdRef.current = session.sessionId;
        console.log('Live transcription started:', session.sessionId);
      } else {
        console.log('Using pre-connected session:', sessionIdRef.current);
      }
      
      const [micStream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      ]);

      micStreamRef.current = micStream;

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

      const audioContext = new AudioContext();
      const mixedOutput = audioContext.createMediaStreamDestination();

      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(mixedOutput);

      if (systemStream) {
        const systemSource = audioContext.createMediaStreamSource(systemStream);
        systemSource.connect(mixedOutput);
      }

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
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${timestamp}.webm`;

        try {
          const result = await (window as any).electronAPI.saveAudioRecording(arrayBuffer, filename);
          console.log('Recording saved:', result.filePath);
        } catch (error) {
          console.error('Error saving recording:', error);
        }

        micStream.getTracks().forEach(track => track.stop());
        if (systemStream) {
          systemStream.getTracks().forEach(track => track.stop());
        }
        
        audioContext.close();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsConnecting(false);

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsConnecting(false);
      throw error;
    }
  }, []);

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
      
      if (chunkRecorderRef.current) {
        chunkRecorderRef.current.stop();
        chunkRecorderRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (sessionIdRef.current) {
        (window as any).electronAPI.stopLiveTranscription(sessionIdRef.current);
        sessionIdRef.current = null;
      }

      micStreamRef.current = null;
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
      setCurrentTranscription('');
    }
  }, [isRecording, startRecording, stopRecording]);

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
    isConnecting,
    recordingTime,
    currentTranscription,
    isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}; 