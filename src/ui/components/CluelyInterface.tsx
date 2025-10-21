import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Settings, Eye, EyeOff, Mic, AudioLinesIcon, Loader2, Brain, BrainCircuit, ChevronDown } from 'lucide-react';
import Chat from './Chat';
import { Conversation } from '../types';
import SettingsInterface from './SettingsInterface';
import LiveInsights from './LiveInsights';
import { useAudioRecording } from '../hooks/useAudioRecording';

const CluelyInterface = () => {
  const [timer, setTimer] = useState('00:00');
  const [showHide, setShowHide] = useState(false);
  const [showLiveInsights, setShowLiveInsights] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 0, question: null, response: null },
  ]);
  const [activeConversationIndex, setActiveConversationIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const { 
    isRecording, 
    isConnecting,
    recordingTime, 
    toggleRecording, 
    currentTranscription, 
    isTranscribing 
  } = useAudioRecording();

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: conversations.length,
      question: null,
      response: null,
    };
    setConversations([...conversations, newConversation]);
    setActiveConversationIndex(conversations.length);
  };

  const handleSmartModeChange = (smartMode: boolean) => {
    setIsSmartMode(smartMode);
  };

  const handleSearchModeChange = (searchMode: boolean) => {
    setIsSearchMode(searchMode);
  };

  const handleSendMessage = (message: string, response: string) => {
    const updatedConversations = [...conversations];
    const currentConversation = updatedConversations[activeConversationIndex];
    
    if (currentConversation.question !== null) {
      const newConversation: Conversation = {
        id: conversations.length,
        question: message,
        response,
      };
      updatedConversations.push(newConversation);
      setActiveConversationIndex(conversations.length);
    } else {
      updatedConversations[activeConversationIndex] = {
        ...updatedConversations[activeConversationIndex],
        question: message,
        response,
      };
    }
    
    setConversations(updatedConversations);
  };

  const handleMessageSent = () => {
    setShowInput(false);
  };

  const handleSendMessageFromLiveInsights = (message: string) => {
    if (!showChat) {
      setShowChat(true);
    }
    
    if (!showInput) {
      setShowInput(true);
    }

    const event = new CustomEvent('cluelyQuestion', { detail: { question: message } });
    window.dispatchEvent(event);
  };

  const handlePreviousConversation = () => {
    if (isProcessing) return;
    
    setActiveConversationIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      return newIndex;
    });
  };

  const handleNextConversation = () => {
    if (isProcessing) return;
    
    setActiveConversationIndex((prev) => {
      const newIndex = Math.min(conversations.length - 1, prev + 1);
      return newIndex;
    });
  };

  useEffect(() => {
    const minutes = String(Math.floor(recordingTime / 60)).padStart(2, '0');
    const seconds = String(recordingTime % 60).padStart(2, '0');
    setTimer(`${minutes}:${seconds}`);
  }, [recordingTime]);

  useEffect(() => {
    const handleAutoScreenAnalysis = (event: CustomEvent) => {
      const { question } = event.detail;
      if (question && question.trim()) {
        const chatEvent = new CustomEvent('directChatMessage', { detail: { question: question.trim() } });
        window.dispatchEvent(chatEvent);
      }
    };

    window.addEventListener('autoScreenAnalysis', handleAutoScreenAnalysis as EventListener);
    
    return () => {
      window.removeEventListener('autoScreenAnalysis', handleAutoScreenAnalysis as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        if (showChat) {
          setShowInput((prev) => !prev);
        } else {
          setShowChat(true);
          setShowInput(true);
        }
      } else if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        // Open chat if not visible
        if (!showChat) {
          setShowChat(true);
        }
        
        // Trigger automatic screen analysis by dispatching a specific event
        // that will be handled regardless of input visibility
        const defaultQuestion = "O que você vê na tela? Descreva e analise o conteúdo visível. Se for uma pergunta apenas responda, não faça uma análise.";
        const customEvent = new CustomEvent('autoScreenAnalysis', { detail: { question: defaultQuestion } });
        window.dispatchEvent(customEvent);
      } else if (event.ctrlKey && event.key === 'ArrowUp') {
        event.preventDefault();
        if (conversations.length > 1) {
          handlePreviousConversation();
        } 
      } else if (event.ctrlKey && event.key === 'ArrowDown') {
        event.preventDefault();
        if (conversations.length > 1) {
          handleNextConversation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [conversations, handlePreviousConversation, handleNextConversation]);

  const getListenButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
        </>
      );
    }
    
    if (isRecording) {
      return (
        <>
          Listen ({timer})
          <AudioLinesIcon className="text-red-500 animate-pulse" />
        </>
      );
    }
    
    return (
      <>
        Listen
        <AudioLinesIcon className="text-gray-300 border-gray-600" />
      </>
    );
  };

  return (
    <div className="flex justify-center pointer-events-none bg-red-500 overflow-x-hidden">
      <div className="flex flex-col items-center">
        <Card className="shadow-sm bg-gray-900/90 backdrop-blur-sm inline-block border-gray-700 pointer-events-auto">
          <CardContent className="p-1">
            <div className="flex items-center justify-between">       
              <div className="flex items-center gap-1">
                {isRecording ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="xs"
                        className="flex items-center gap-1 text-gray-300 border-gray-600 h-8 px-2"
                        disabled={isConnecting}
                      >
                        {getListenButtonContent()}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        onClick={toggleRecording}
                        className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Stop Recording
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setShowLiveInsights(!showLiveInsights)}
                        className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {showLiveInsights ? (
                          <>
                            <BrainCircuit className="w-4 h-4 mr-2" />
                            Hide Live Insights
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Show Live Insights
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    className="flex items-center gap-1 text-gray-300 border-gray-600 h-8 px-2"
                    onClick={toggleRecording}
                    disabled={isConnecting}
                    aria-label="Start recording"
                  >
                    {getListenButtonContent()}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  size="xs" 
                  className="text-gray-300 border-gray-600 hover:bg-gray-800 h-8 px-2"
                  onClick={() => setShowChat(true)}
                >
                  Ask AI
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">⌘</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">F</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="xs" 
                  onClick={() => setShowHide(!showHide)}
                  className="text-gray-300 border-gray-600 hover:bg-gray-800 h-8 px-2"
                >
                  {showHide ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  Show/Hide
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">⌘</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">X</span>
                </Button>


                <div className="relative">
                  <Button 
                    ref={settingsButtonRef}
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-300 hover:bg-gray-800" 
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 w-full overflow-x-hidden px-4">
          {showChat && isRecording ? (
            <div className={`grid gap-6 w-full mx-auto ${showLiveInsights ? 'grid-cols-[minmax(280px,320px)_1fr_minmax(0,320px)] max-w-[1600px]' : 'grid-cols-1 max-w-none'}`}>
              {showLiveInsights && (
                <div className="flex justify-end">
                  <LiveInsights
                    currentTranscription={currentTranscription}
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    onSendMessage={handleSendMessageFromLiveInsights}
                  />
                </div>
              )}
              
              <div className="flex justify-center">
                <Chat
                  setShowChat={setShowChat}
                  showInput={showInput}
                  conversation={conversations[activeConversationIndex]}
                  conversation_history={conversations}
                  onNewConversation={handleNewConversation}
                  onSendMessage={handleSendMessage}
                  onMessageSent={handleMessageSent}
                  onProcessingChange={setIsProcessing}
                  currentTranscription={currentTranscription}
                  isSmartMode={isSmartMode}
                  onSmartModeChange={handleSmartModeChange}
                  isSearchMode={isSearchMode}
                  onSearchModeChange={handleSearchModeChange}
                />
              </div>
              
              <div></div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              {isRecording && showLiveInsights && (
                <div className="mb-4">
                  <LiveInsights
                    currentTranscription={currentTranscription}
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    onSendMessage={handleSendMessageFromLiveInsights}
                  />
                </div>
              )}
              
              {showChat && (
                <Chat
                  setShowChat={setShowChat}
                  showInput={showInput}
                  conversation={conversations[activeConversationIndex]}
                  conversation_history={conversations}
                  onNewConversation={handleNewConversation}
                  onSendMessage={handleSendMessage}
                  onMessageSent={handleMessageSent}
                  onProcessingChange={setIsProcessing}
                  currentTranscription={currentTranscription}
                  isSmartMode={isSmartMode}
                  onSmartModeChange={handleSmartModeChange}
                  isSearchMode={isSearchMode}
                  onSearchModeChange={handleSearchModeChange}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {showSettings && settingsButtonRef.current && createPortal(
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: `${settingsButtonRef.current.getBoundingClientRect().bottom + 8}px`,
            right: `${window.innerWidth - settingsButtonRef.current.getBoundingClientRect().right}px`,
          }}
        >
          <SettingsInterface setShowSettings={setShowSettings} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default CluelyInterface;