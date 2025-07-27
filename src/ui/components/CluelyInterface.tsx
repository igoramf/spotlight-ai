import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Settings, Eye, EyeOff, Mic, AudioLinesIcon } from 'lucide-react';
import Chat from './Chat';
import { Conversation } from '../types';
import SettingsInterface from './SettingsInterface';
import LiveInsights from './LiveInsights';
import { useAudioRecording } from '../hooks/useAudioRecording';

const CluelyInterface = () => {
  const [timer, setTimer] = useState('00:00');
  const [showHide, setShowHide] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 0, question: null, response: null },
  ]);
  const [activeConversationIndex, setActiveConversationIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const { 
    isRecording, 
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

  const handleAskCluely = (question: string) => {
    if (!showChat) {
      setShowChat(true);
    }
    
    if (!showInput) {
      setShowInput(true);
    }

    handleNewConversation();
    
    const event = new CustomEvent('cluelyQuestion', { detail: { question } });
    window.dispatchEvent(event);
  };

  const handleSendMessageFromLiveInsights = (message: string) => {
    if (!showChat) {
      setShowChat(true);
    }
    
    if (!showInput) {
      setShowInput(true);
    }

    // Não cria nova conversa, usa a existente
    
    const event = new CustomEvent('cluelyQuestion', { detail: { question: message } });
    window.dispatchEvent(event);
  };

  const handlePreviousConversation = () => {
    if (isProcessing) return; // Block navigation during processing
    
    setActiveConversationIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      return newIndex;
    });
  };

  const handleNextConversation = () => {
    if (isProcessing) return; // Block navigation during processing
    
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
    const handleKeyDown = (event: KeyboardEvent) => {
      
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        if (showChat) {
          setShowInput((prev) => !prev);
        } else {
          setShowChat(true);
          setShowInput(true);
        }
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

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col items-center">
        <Card className="shadow-sm bg-gray-900/90 backdrop-blur-sm inline-block border-gray-700">
          <CardContent className="p-1">
            <div className="flex items-center justify-between">       
              <div className="flex items-center gap-1">
                <Button
                  variant={isRecording ? 'default' : 'outline'}
                  size="xs"
                  className="flex items-center gap-1 text-gray-300 border-gray-600 h-8 px-2"
                  onClick={toggleRecording}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  Listen {isRecording && `(${timer})`}
                  <AudioLinesIcon className={isRecording ? 'text-red-500 animate-pulse' : 'text-gray-300 border-gray-600'} />
                </Button>

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

        <div className="mt-4 w-full">
          {showChat && isRecording ? (
            <div className="grid grid-cols-[300px_1fr_300px] gap-6 w-full max-w-[1400px] mx-auto">
              <div className="flex justify-end">
                <LiveInsights
                  currentTranscription={currentTranscription}
                  isRecording={isRecording}
                  isTranscribing={isTranscribing}
                  onSendMessage={handleSendMessageFromLiveInsights}
                />
              </div>
              
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
                />
              </div>
              
              <div></div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              {isRecording && (
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
                <div>
                  <Chat
                    setShowChat={setShowChat}
                    showInput={showInput}
                    conversation={conversations[activeConversationIndex]}
                    conversation_history={conversations}
                    onNewConversation={handleNewConversation}
                    onSendMessage={handleSendMessage}
                    onMessageSent={handleMessageSent}
                    onProcessingChange={setIsProcessing}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showSettings && settingsButtonRef.current && createPortal(
        <div 
          className="fixed z-[9999999]"
          style={{
            top: `${settingsButtonRef.current.getBoundingClientRect().bottom + 8}px`,
            right: `${window.innerWidth - settingsButtonRef.current.getBoundingClientRect().right}px`,
            zIndex: 9999999
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