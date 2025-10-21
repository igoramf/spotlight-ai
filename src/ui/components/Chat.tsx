import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import InputCustom from './InputCustom';
import { Copy, XCircleIcon, Maximize2, Minimize2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Conversation } from '../types';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { buildPrompt } from '../../lib/prompt/promptBuilder';
import { cn } from '../lib/utils';
import { WebSearchService } from '../../lib/webSearch';
import { GeminiClient } from '../../lib/llm/gemini/geminiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

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
  isSmartMode?: boolean;
  onSmartModeChange?: (isSmartMode: boolean) => void;
  isSearchMode?: boolean;
  onSearchModeChange?: (isSearchMode: boolean) => void;
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
  isSmartMode = false,
  onSmartModeChange,
  isSearchMode = false,
  onSearchModeChange,
}: ChatProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(
    conversation?.question || null,
  );
  const [currentResponse, setCurrentResponse] = useState<string | null>(
    conversation?.response || null,
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if current question is the automatic screen analysis question
  const isAutoQuestion = currentQuestion === "O que você vê na tela? Descreva e analise o conteúdo visível. Se for uma pergunta apenas responda, não faça uma análise.";

  useEffect(() => {
    setCurrentQuestion(conversation?.question || null);
    setCurrentResponse(conversation?.response || null);

    // Auto-expand based on response length
    if (conversation?.response) {
      const responseLength = conversation.response.length;
      setIsExpanded(responseLength > 500); // Expande se resposta > 500 caracteres
    } else {
      // Reset expansion when chat is closed
      setIsExpanded(false);
    }
  }, [conversation]);

  useEffect(() => {
    onProcessingChange?.(isLoading);
  }, [isLoading, onProcessingChange]);

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

    onMessageSent?.();

    try {
      // Captura screenshot
      const screenshotBase64 = await window.electronAPI.takeScreenshot();

      if (!screenshotBase64) {
        throw new Error('Failed to capture screenshot');
      }

      // Web search se necessário
      let webSearchResults = '';
      if (isSearchMode) {
        try {
          const webSearchService = WebSearchService.getInstance();
          const searchResponse = await webSearchService.searchWeb(message);
          webSearchResults = webSearchService.formatSearchResults(searchResponse);
        } catch (error) {
          console.error('Web search error:', error);
          webSearchResults = 'Erro ao realizar busca na web.';
        }
      }

      // Prepara histórico de conversação
      const conversationHistory = conversation_history
        .filter((c) => c.question && c.response)
        .map((c) => `USER: ${c.question}\nASSISTANT: ${c.response}`)
        .join('\n\n') +
        (conversation_history.length > 0 ? '\n\n' : '') +
        `USER: ${message}`;

      // Carrega custom prompt
      let customPromptText = 'Responda sempre em pt-br.';
      try {
        const customPromptResult = await window.electronAPI?.loadCustomPrompt?.();
        if (customPromptResult?.success && customPromptResult.exists && customPromptResult.prompt.trim()) {
          customPromptText = customPromptResult.prompt;
        }
      } catch (error) {
        console.error('Error loading custom prompt:', error);
      }

      // Constrói o prompt final
      const finalPrompt = await buildPrompt({
        conversation_history: conversationHistory,
        custom_prompt: `${customPromptText}${webSearchResults ? `\n\nInformações da busca na web:\n${webSearchResults}\n\nUse essas informações para enriquecer sua resposta quando relevante.` : ''}`,
        user_screen_content: '', // Será preenchido pela visão da imagem
        live_transcription: currentTranscription || '',
      });

      // Faz TUDO em um único request - imagem + resposta
      const modelName = isSmartMode ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
      const client = new GeminiClient(modelName);

      const base64Data = screenshotBase64.split(',')[1];
      const imageType = screenshotBase64.split(';')[0].split(':')[1];

      const response = await client.createChatCompletionWithImage(
        finalPrompt,
        base64Data,
        imageType
      );

      setCurrentResponse(response);
      onSendMessage(message, response);

      // Auto-expand based on response length
      setIsExpanded(response.length > 500);

    } catch (error) {
      console.error('Error processing message:', error);
      setCurrentResponse('Desculpe, ocorreu um erro ao processar sua mensagem.');
    } finally {
      setIsLoading(false);
      onSmartModeChange?.(false);
      onSearchModeChange?.(false);
    }
  };

  const handleManualSendMessage = async (message: string) => {
    await handleSendMessage(message);
  };

  useEffect(() => {
    const handleDirectChatMessage = (event: CustomEvent) => {
      const { question } = event.detail;
      if (question && question.trim()) {
        handleSendMessage(question.trim());
      }
    };

    window.addEventListener('directChatMessage', handleDirectChatMessage as EventListener);

    return () => {
      window.removeEventListener('directChatMessage', handleDirectChatMessage as EventListener);
    };
  }, [handleSendMessage]);

  return (
    <div className={cn(
      "flex flex-col items-center pointer-events-auto transition-all duration-300 ease-in-out",
      isExpanded ? "w-[900px]" : "w-[700px]"
    )}>
      {currentQuestion && (
        <Card
          className={cn(
            'w-full bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white transition-all duration-300',
            showInput && 'rounded-b-none',
          )}
        >
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="text-xs font-medium">
                <span className="text-gray-400">
                  {isLoading
                    ? isSearchMode ? 'Searching the web and thinking...' : 'Thinking...'
                    : 'AI Response'}
                </span>
              </div>
              <div className="flex justify-end items-center gap-2">
                {!isAutoQuestion && (
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
                )}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{isExpanded ? 'Collapse' : 'Expand'}</p>
                    </TooltipContent>
                  </Tooltip>
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
              <div className={cn(
                "flex-grow overflow-y-auto mt-2 prose prose-invert prose-sm max-w-none transition-all duration-300",
                isExpanded ? "max-h-[500px]" : "max-h-[300px]"
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: ({ node, inline, className, children, ...props }: any) => {
                      return inline ? (
                        <code className="bg-gray-800 text-blue-400 px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={`${className} block bg-gray-800 p-2 rounded text-xs overflow-x-auto`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }: any) => (
                      <pre className="bg-gray-800 p-3 rounded-md overflow-x-auto my-2">
                        {children}
                      </pre>
                    ),
                    a: ({ children, href }: any) => (
                      <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    ul: ({ children }: any) => (
                      <ul className="list-disc list-inside space-y-1 my-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }: any) => (
                      <ol className="list-decimal list-inside space-y-1 my-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }: any) => (
                      <li className="text-gray-200 text-sm">
                        {children}
                      </li>
                    ),
                    p: ({ children }: any) => (
                      <p className="text-gray-200 text-sm my-2">
                        {children}
                      </p>
                    ),
                    h1: ({ children }: any) => (
                      <h1 className="text-white text-lg font-bold my-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }: any) => (
                      <h2 className="text-white text-base font-bold my-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }: any) => (
                      <h3 className="text-white text-sm font-bold my-2">
                        {children}
                      </h3>
                    ),
                    blockquote: ({ children }: any) => (
                      <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-2">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }: any) => (
                      <div className="overflow-x-auto my-2">
                        <table className="min-w-full border border-gray-700">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }: any) => (
                      <th className="border border-gray-700 px-2 py-1 bg-gray-800 text-left text-xs font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }: any) => (
                      <td className="border border-gray-700 px-2 py-1 text-xs">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {currentResponse}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
          {showInput && <div className="border-b border-gray-700 "></div>}
        </Card>
      )}
      {showInput && (
        <InputCustom
          onSendMessage={handleManualSendMessage}
          isLoading={isLoading}
          isChatVisible={!!currentQuestion}
          onSmartModeChange={onSmartModeChange}
          onSearchModeChange={onSearchModeChange}
          isExpanded={isExpanded}
        />
      )}
    </div>
  );
};

export default Chat;