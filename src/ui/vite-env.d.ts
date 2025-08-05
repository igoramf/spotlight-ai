/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_AZURE_BASE_URL: string
  readonly VITE_AZURE_OPENAI_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI: {
    setContentProtection: (flag: boolean) => Promise<boolean>;
    getContentProtectionStatus: () => Promise<boolean>;
    takeScreenshot: () => Promise<string>;
    moveWindow: (dx: number, dy: number) => Promise<void>;
    saveAudioRecording: (audioData: ArrayBuffer, filename: string) => Promise<{ success: boolean; filePath: string }>;
    startLiveTranscription: () => Promise<{ sessionId: string; success: boolean }>;
    stopLiveTranscription: (sessionId: string) => Promise<{ success: boolean }>;
    sendAudioChunk: (pcmData: string) => Promise<{ success: boolean }>;
    onTranscriptionUpdate: (callback: Function) => void;
    removeTranscriptionListener: () => void;
    // Custom Prompts
    saveCustomPrompt: (prompt: string) => Promise<{ success: boolean }>;
    loadCustomPrompt: () => Promise<{ success: boolean; prompt: string; exists: boolean; lastUpdated?: string }>;
    deleteCustomPrompt: () => Promise<{ success: boolean }>;
    quitApp: () => Promise<void>;
  };
}
