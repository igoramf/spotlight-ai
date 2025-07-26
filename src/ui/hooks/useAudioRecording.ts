import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // For continuous chunk recording
  const chunkRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        console.log('Connected to transcription WebSocket');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'transcription-status':
              setIsTranscribing(data.status === 'processing');
              break;
              
            case 'transcription-result':
              if (data.transcription && data.transcription !== '...') {
                const timestamp = new Date(data.timestamp).toLocaleTimeString();
                setCurrentTranscription(prev => {
                  const newText = `[${timestamp}] ${data.transcription}`;
                  return prev ? `${prev}\n${newText}` : newText;
                });
              }
              setIsTranscribing(false);
              break;
              
            case 'error':
              console.error('WebSocket transcription error:', data.message);
              setIsTranscribing(false);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        wsRef.current = null;
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, []);

  // Send audio chunk to WebSocket
  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, skipping transcription');
      return;
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      wsRef.current.send(JSON.stringify({
        type: 'audio-chunk',
        audioData: base64,
        mimeType: audioBlob.type
      }));
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  }, []);

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

    // Start continuous chunk recording
    const startChunkCycle = () => {
      if (chunkRecorderRef.current && isRecording) {
        if (chunkRecorderRef.current.state === 'inactive') {
          chunkRecorderRef.current.start();
        }
        
        // Stop and restart every 3 seconds
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
        }, 3000);
      }
    };

    startChunkCycle();
  }, [sendAudioChunk, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Connect to WebSocket
      connectWebSocket();
      
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
  }, [connectWebSocket]);

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

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
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
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (chunkRecorderRef.current) {
        chunkRecorderRef.current.stop();
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