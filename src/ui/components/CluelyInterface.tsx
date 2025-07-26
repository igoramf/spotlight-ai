import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Settings, Eye, EyeOff, Mic, AudioLinesIcon } from 'lucide-react';
import Chat from './Chat';
import { Conversation } from '../types';
import SettingsInterface from './SettingsInterface';
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

  // Use the audio recording hook with transcription
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

  const handlePreviousConversation = () => {
    setActiveConversationIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      return newIndex;
    });
  };

  const handleNextConversation = () => {
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
    <div className="">
      <div className="flex flex-col items-center">
        {/* Header Control Bar */}
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
                
                {/* Show transcription status */}
                {isTranscribing && (
                  <span className="text-xs text-blue-400 animate-pulse">Transcrevendo...</span>
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
                
                <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800" onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Transcription Display */}
        {isRecording && currentTranscription && (
          <div className="mt-2 w-full max-w-2xl">
            <Card className="shadow-sm bg-gray-900/90 backdrop-blur-sm border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-300">Transcrição em Tempo Real</h3>
                  {isTranscribing && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400">Processando...</span>
                    </div>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto bg-gray-800/50 rounded p-2 text-sm text-gray-200">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {currentTranscription}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showSettings && <SettingsInterface setShowSettings={setShowSettings} />}

        {/* AI Response Section */}
        {showChat && (
          <div className="mt-2">
            <Chat
              setShowChat={setShowChat}
              showInput={showInput}
              conversation={conversations[activeConversationIndex]}
              conversation_history={conversations}
              onNewConversation={handleNewConversation}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CluelyInterface;