import { useState } from 'react';
import { GeminiClient } from '../../lib/llm/gemini/geminiClient';
import { IMAGE_PROMPT } from '../../lib/prompt/imagePrompt';

export const useScreenshot = () => {
  const [AnalyzingScreen, setAnalyzingScreen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScreenshot = async (userQuestion: string) => {
    setAnalyzingScreen(true);
    setError(null);
    setResult(null);

    try {
      const screenshotBase64 = await window.electronAPI.takeScreenshot();
      
      if (screenshotBase64) {
        const client = new GeminiClient("gemini-2.5-flash");
        const prompt = IMAGE_PROMPT.replace("{{user_question}}", userQuestion);
        
        const base64Data = screenshotBase64.split(',')[1];
        const imageType = screenshotBase64.split(';')[0].split(':')[1];

        const extractedText = await client.extractTextFromImage(prompt, base64Data, imageType);
        setResult(extractedText);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(err);
    } finally {
      setAnalyzingScreen(false);
    }
  };

  return { AnalyzingScreen, result, error, handleScreenshot };
}; 