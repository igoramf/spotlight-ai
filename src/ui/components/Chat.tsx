import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import InputCustom from './InputCustom';
import { Copy, XCircleIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Conversation } from '../types';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { AzureOpenAIClient } from '../../lib/llm/openai/azureClient';
import { buildPrompt } from '../../lib/prompt/promptBuilder';
import { cn } from '../lib/utils';
import { useScreenshot } from '../hooks/useScreenshot';

const AnimatedDots = () => {
  return (
    <div className="flex space-x-1">
      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
    </div>
  );
};

interface ChatProps {
  setShowChat: (show: boolean) => void;
  showInput: boolean;
  conversation: Conversation;
  onNewConversation: () => void;
  onSendMessage: (message: string, response: string) => void;
  conversation_history: Conversation[];
  onMessageSent?: () => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  currentTranscription?: string;
}

const Chat = ({
  setShowChat,
  showInput,
  conversation,
  onNewConversation,
  onSendMessage,
  conversation_history,
  onMessageSent,
  onProcessingChange,
  currentTranscription,
}: ChatProps) => {
  const {
    AnalyzingScreen: isAnalyzingScreen,
    result: screenshotResult,
    error: screenshotError,
    handleScreenshot,
  } = useScreenshot();
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForScreenshot, setIsWaitingForScreenshot] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(
    conversation?.question || null,
  );
  const [currentResponse, setCurrentResponse] = useState<string | null>(
    conversation?.response || null,
  );

  useEffect(() => {
    setCurrentQuestion(conversation?.question || null);
    setCurrentResponse(conversation?.response || null);
  }, [conversation]);

  useEffect(() => {
    const isProcessing = isLoading || isAnalyzingScreen;
    onProcessingChange?.(isProcessing);
  }, [isLoading, isAnalyzingScreen, onProcessingChange]);

  const handleCopy = async () => {
    if (currentResponse) {
      try {
        await navigator.clipboard.writeText(currentResponse);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    setCurrentQuestion(message);
    setIsLoading(true);
    setCurrentResponse(null);
    setIsWaitingForScreenshot(true);
    
    onMessageSent?.();
    
    await handleScreenshot(message);
  };

  useEffect(() => {
    if (!isWaitingForScreenshot) return;

    const processAiResponse = async () => {
      const client = new AzureOpenAIClient('gpt-4.1');
      const prompt = await buildPrompt({
        conversation_history:
          conversation_history
            .filter((c) => c.question && c.response)
            .map((c) => `USER: ${c.question}\nASSISTANT: ${c.response}`)
            .join('\n\n') +
          (conversation_history.length > 0 ? '\n\n' : '') +
          `USER: ${currentQuestion}`,
        custom_prompt: 'Responda sempre em pt-br',
        user_screen_content: screenshotResult || '',
        live_transcription: currentTranscription || '',
      });
      const newResponse = await client.createChatCompletion(prompt);
      setCurrentResponse(newResponse);
      if (newResponse && currentQuestion) {
        onSendMessage(currentQuestion, newResponse);
      }
      setIsLoading(false);
      setIsWaitingForScreenshot(false);
    };

    if (!isAnalyzingScreen) {
      processAiResponse();
    }
  }, [isAnalyzingScreen, isWaitingForScreenshot, screenshotResult, currentQuestion, currentTranscription]);

  return (
    <div className="flex flex-col items-center w-[700px]">
      {currentQuestion && (
        <Card
          className={cn(
            'w-full bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white',
            showInput && 'rounded-b-none',
          )}
        >
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="text-xs font-medium">
                <span className="text-gray-400">
                  {isAnalyzingScreen
                    ? 'Analyzing your screen...'
                    : isLoading
                    ? 'Thinking...'
                    : 'AI Response'}
                </span>
              </div>
              <div className="flex justify-end items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge
                        variant="outline"
                        className="text-sm text-white font-medium bg-gray-700 max-w-[300px] truncate cursor-default"
                      >
                        {currentQuestion}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    align="end"
                    className="max-w-[350px] break-words z-50"
                    sideOffset={5}
                  >
                    <p className="text-xs">{currentQuestion}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopy}
                        disabled={
                          !currentResponse || isLoading || isAnalyzingScreen
                        }
                        className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Copy size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Copy Answer</p>
                    </TooltipContent>
                  </Tooltip>
                  <button
                    onClick={onNewConversation}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon size={18} />
                  </button>
                </div>
              </div>
            </div>

            {(isLoading || isAnalyzingScreen) && <AnimatedDots />}

            {currentResponse && (
              <div className="flex-grow overflow-y-auto max-h-[300px] mt-2">
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {currentResponse.split('\n').map((line, index) => (
                    <li key={index}>{line.replace('-', '').trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          {showInput && <div className="border-b border-gray-700 "></div>}
        </Card>
      )}
      {showInput && (
        <InputCustom
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isAnalyzingScreen}
          isChatVisible={!!currentQuestion}
        />
      )}
    </div>
  );
};

export default Chat;