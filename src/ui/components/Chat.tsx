import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import InputCustom from './InputCustom';
import { Copy, XCircleIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Conversation } from '../types';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { AzureOpenAIClient } from '../../services/openai/azureClient';
import { buildPrompt } from '../../services/openai/promptBuilder';

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
  conversation: Conversation;
  onNewConversation: () => void;
  onSendMessage: (message: string, response: string) => void;
  conversation_history: Conversation[];
}

const Chat = ({
  setShowChat,
  conversation,
  onNewConversation,
  onSendMessage,
  conversation_history,
}: ChatProps) => {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleCopy = async () => {
    if (currentResponse) {
      try {
        await navigator.clipboard.writeText(currentResponse);
        // toast({
        //   title: "Copiado!",
        //   description: "Resposta copiada para a área de transferência.",
        // });
      } catch (err) {
        console.error('Failed to copy text: ', err);
        // toast({
        //   title: "Erro",
        //   description: "Não foi possível copiar o texto.",
        //   variant: "destructive",
        // });
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    setCurrentQuestion(message);
    setIsLoading(true);
    setCurrentResponse(null);

    setTimeout(async () => {
      const client = new AzureOpenAIClient("gpt-4.1");
      const prompt = await buildPrompt({
        conversation_history: conversation_history
          .filter((c) => c.question && c.response)
          .map((c) => `USER: ${c.question}\nASSISTANT: ${c.response}`)
          .join('\n\n') + (conversation_history.length > 0 ? '\n\n' : '') + `USER: ${message}`,
        custom_prompt: "Responda sempre em pt-br",
      });
      const newResponse = await client.createChatCompletion(prompt);
      console.log(newResponse);
      setCurrentResponse(newResponse);
      if (newResponse) {
        onSendMessage(message, newResponse);
      }
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center w-[700px]">
      {currentQuestion && (
        <Card className="w-full bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white rounded-b-none">
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="text-xs font-medium">
                <span className="text-gray-400">
                  {isLoading ? 'Thinking...' : 'AI Response'}
                </span>
              </div>
              <div className="flex justify-end items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-sm text-white font-medium bg-gray-700"
                >
                  {currentQuestion}
                </Badge>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopy}
                        disabled={!currentResponse || isLoading}
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

            {isLoading && <AnimatedDots />}

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
          <div className="border-b border-gray-700 "></div>
        </Card>
      )}
      <InputCustom
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isChatVisible={!!currentQuestion}
      />
    </div>
  );
};

export default Chat;