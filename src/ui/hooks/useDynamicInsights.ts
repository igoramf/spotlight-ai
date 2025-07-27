import { useState, useEffect, useRef } from 'react';
import { GeminiClient } from '../../lib/llm/gemini/geminiClient';
import { AzureOpenAIClient } from '../../lib/llm/openai/azureClient';

interface DynamicAction {
  icon: any;
  text: string;
  color: string;
}

interface DynamicInsights {
  actions: DynamicAction[];
  summary: string;
  isAnalyzing: boolean;
}

const INSIGHTS_PROMPT = `
Analyze the provided screen content and live transcription to generate contextual insights.

SCREEN CONTENT:
{{screen_content}}

LIVE TRANSCRIPTION:
{{transcription}}

Provide a JSON response with:
1. "summary": A brief 2-3 sentence summary of what's currently happening based on screen + transcription
2. "suggested_actions": Array of 0-3 relevant action suggestions (only if truly helpful). Each action should have "text" field with clear, actionable suggestions.

Focus on:
- Current context and activity
- Relevant next steps or questions
- Only suggest actions that add real value

Return only valid JSON. If no meaningful actions can be suggested, return empty array for suggested_actions.

Example response:
{
  "summary": "User is viewing a code editor with JavaScript files open while discussing API integration.",
  "suggested_actions": [
    {"text": "Review API documentation for the mentioned endpoints"},
    {"text": "Explain the current code structure and patterns"}
  ]
}
`;

export const useDynamicInsights = (currentTranscription: string, isRecording: boolean) => {
  const [insights, setInsights] = useState<DynamicInsights>({
    actions: [],
    summary: "Start recording to see live insights and summaries of your conversation.",
    isAnalyzing: false
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<string>('');

  const analyzeContext = async () => {
    if (!isRecording || insights.isAnalyzing) return;

    try {
      setInsights(prev => ({ ...prev, isAnalyzing: true }));

      const screenshotBase64 = await window.electronAPI.takeScreenshot();
      if (!screenshotBase64) {
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }

      const contextKey = `${screenshotBase64.slice(-50)}_${currentTranscription.slice(-100)}`;
      if (contextKey === lastAnalysisRef.current) return;
      
      lastAnalysisRef.current = contextKey;

      const geminiClient = new GeminiClient("gemini-2.5-flash");
      const base64Data = screenshotBase64.split(',')[1];
      const imageType = screenshotBase64.split(';')[0].split(':')[1];
      
      const screenContent = await geminiClient.extractTextFromImage(
        "Extract all visible text, interface elements, and context from this screenshot. Be comprehensive but concise.",
        base64Data,
        imageType
      );

      const azureClient = new AzureOpenAIClient('gpt-4.1');
      const prompt = INSIGHTS_PROMPT
        .replace('{{screen_content}}', screenContent || 'No screen content detected')
        .replace('{{transcription}}', currentTranscription || 'No transcription available');

      const response = await azureClient.createChatCompletion(prompt);
      
      if (!response) {
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }
      
      try {
        const parsedResponse = JSON.parse(response);
        
        const dynamicActions = parsedResponse.suggested_actions?.map((action: any, index: number) => ({
          icon: getActionIcon(index),
          text: action.text,
          color: getActionColor(index)
        })) || [];

        setInsights(prev => ({
          ...prev,
          actions: dynamicActions,
          summary: parsedResponse.summary || prev.summary,
          isAnalyzing: false
        }));

      } catch (parseError) {
        console.error('Failed to parse insights response:', parseError);
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
      }

    } catch (error) {
      console.error('Error analyzing context:', error);
      setInsights(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  useEffect(() => {
    if (isRecording) {
      analyzeContext();
      intervalRef.current = setInterval(analyzeContext, 10000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setInsights({
        actions: [],
        summary: "Start recording to see live insights and summaries of your conversation.",
        isAnalyzing: false
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, currentTranscription]);

  return insights;
};

const getActionIcon = (index: number) => {
  const icons = [
    'HelpCircle', 
    'Lightbulb',    
    'Brain'       
  ];
  return icons[index % icons.length];
};

const getActionColor = (index: number) => {
  const colors = [
    'bg-blue-500',
    'bg-yellow-500', 
    'bg-purple-500'
  ];
  return colors[index % colors.length];
}; 