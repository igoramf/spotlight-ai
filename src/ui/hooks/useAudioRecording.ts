import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // For continuous chunk recording
  const chunkRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Send audio chunk via IPC
  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const result = await (window as any).electronAPI.transcribeAudioChunk(
        base64,
        audioBlob.type
      );
      
      setIsTranscribing(false);
      
      if (result.transcription && result.transcription !== '...') {
        const timestamp = new Date(result.timestamp).toLocaleTimeString();
        setCurrentTranscription(prev => {
          const newText = `[${timestamp}] ${result.transcription}`;
          return prev ? `${prev}\n${newText}` : newText;
        });
      }
    } catch (error) {
      console.error('Error in transcription:', error);
      setIsTranscribing(false);
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