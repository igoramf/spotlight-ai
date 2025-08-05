import { useState, useEffect, useRef } from 'react';
import { GeminiClient } from '../../lib/llm/gemini/geminiClient';

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

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. If no meaningful actions can be suggested, return empty array for suggested_actions.

Example response (raw JSON only):
{
  "summary": "User is viewing a code editor with JavaScript files open while discussing API integration.",
  "suggested_actions": [
    {"text": "Review API documentation for the mentioned endpoints"},
    {"text": "Explain the current code structure and patterns"}
  ]
}
`;

// Helper function to extract JSON from markdown-formatted responses
const extractJsonFromMarkdown = (response: string): string => {
  // Remove markdown code blocks if present
  const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  // If no markdown blocks, try to find JSON object directly
  const directJsonMatch = response.match(/\{[\s\S]*\}/);
  if (directJsonMatch) {
    return directJsonMatch[0];
  }
  
  // Return original response if no pattern matches
  return response.trim();
};

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
      // Set analyzing to true but preserve previous content
      setInsights(prev => ({ ...prev, isAnalyzing: true }));

      const screenshotBase64 = await window.electronAPI.takeScreenshot();
      if (!screenshotBase64) {
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }

      const contextKey = `${screenshotBase64.slice(-50)}_${currentTranscription.slice(-100)}`;
      if (contextKey === lastAnalysisRef.current) {
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }
      
      lastAnalysisRef.current = contextKey;

      const geminiClient = new GeminiClient("gemini-2.5-flash");
      const base64Data = screenshotBase64.split(',')[1];
      const imageType = screenshotBase64.split(';')[0].split(':')[1];
      
      const screenContent = await geminiClient.extractTextFromImage(
        "Extract all visible text, interface elements, and context from this screenshot. Be comprehensive but concise.",
        base64Data,
        imageType
      );

      const prompt = INSIGHTS_PROMPT
        .replace('{{screen_content}}', screenContent || 'No screen content detected')
        .replace('{{transcription}}', currentTranscription || 'No transcription available');

      const response = await geminiClient.createChatCompletion(prompt);
      
      if (!response) {
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }
      
      try {
        // Clean the response to extract JSON from markdown formatting
        const cleanedResponse = extractJsonFromMarkdown(response);
        const parsedResponse = JSON.parse(cleanedResponse);
        
        const dynamicActions = parsedResponse.suggested_actions?.map((action: any, index: number) => ({
          icon: getActionIcon(index),
          text: action.text,
          color: getActionColor(index)
        })) || [];

        // Only update content when analysis is complete
        setInsights(prev => ({
          ...prev,
          actions: dynamicActions,
          summary: parsedResponse.summary || prev.summary,
          isAnalyzing: false
        }));

      } catch (parseError) {
        console.error('Failed to parse insights response:', parseError);
        console.error('Raw response:', response);
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