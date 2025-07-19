import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Settings, Eye, EyeOff, Mic, AudioLinesIcon } from 'lucide-react';
import Chat from './Chat';
import { Conversation } from '../types';

const CluelyInterface = () => {
  const [timer, setTimer] = useState('00:00');
  const [showHide, setShowHide] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 0, question: null, response: null },
  ]);
  const [activeConversationIndex, setActiveConversationIndex] = useState(0);

  const handleNewConversation = () => {
    console.log('🆕 Creating new conversation');
    const newConversation: Conversation = {
      id: conversations.length,
      question: null,
      response: null,
    };
    console.log('📝 New conversation:', newConversation);
    setConversations([...conversations, newConversation]);
    setActiveConversationIndex(conversations.length);
    console.log('📊 Updated conversations count:', conversations.length + 1);
  };

  const handleSendMessage = (message: string, response: string) => {
    console.log('📨 handleSendMessage called:', { message, response, activeIndex: activeConversationIndex });
    const updatedConversations = [...conversations];
    const currentConversation = updatedConversations[activeConversationIndex];
    
    // Se a conversa atual já tem conteúdo, criar uma nova conversa
    if (currentConversation.question !== null) {
      console.log('🔄 Current conversation has content, creating new one');
      const newConversation: Conversation = {
        id: conversations.length,
        question: message,
        response,
      };
      updatedConversations.push(newConversation);
      setActiveConversationIndex(conversations.length);
      console.log('✨ Created new conversation with content');
    } else {
      // Atualizar a conversa atual
      console.log('📝 Updating current conversation');
      updatedConversations[activeConversationIndex] = {
        ...updatedConversations[activeConversationIndex],
        question: message,
        response,
      };
    }
    
    setConversations(updatedConversations);
    console.log('📊 Final conversations:', updatedConversations);
  };

  const handlePreviousConversation = () => {
    console.log('🔄 handlePreviousConversation called');
    setActiveConversationIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      console.log(`📍 Index changed: ${prev} → ${newIndex}`);
      return newIndex;
    });
  };

  const handleNextConversation = () => {
    console.log('🔄 handleNextConversation called');
    setActiveConversationIndex((prev) => {
      const newIndex = Math.min(conversations.length - 1, prev + 1);
      console.log(`📍 Index changed: ${prev} → ${newIndex}`);
      return newIndex;
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    const minutes = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
    const seconds = String(recordingSeconds % 60).padStart(2, '0');
    setTimer(`${minutes}:${seconds}`);
  }, [recordingSeconds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('🎯 Key event:', event.key, 'Ctrl:', event.ctrlKey);
      console.log('📊 State:', { 
        conversationsLength: conversations.length, 
        activeIndex: activeConversationIndex 
      });
      
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        setShowChat(true);
      } else if (event.ctrlKey && event.key === 'ArrowUp') {
        event.preventDefault();
        console.log('⬆️ Arrow Up pressed');
        if (conversations.length > 1) {
          console.log('✅ Navigating to previous conversation');
          handlePreviousConversation();
        } else {
          console.log('❌ Not enough conversations (need > 1)');
        }
      } else if (event.ctrlKey && event.key === 'ArrowDown') {
        event.preventDefault();
        console.log('⬇️ Arrow Down pressed');
        if (conversations.length > 1) {
          console.log('✅ Navigating to next conversation');
          handleNextConversation();
        } else {
          console.log('❌ Not enough conversations (need > 1)');
        }
      }
    };

    console.log('🔧 Setting up keyboard listener');
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('🧹 Cleaning up keyboard listener');
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
                  onClick={() => setIsRecording((r) => !r)}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  Listen
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
                
                <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Response Section */}
        {showChat && (
          <div className="mt-2">
            <Chat
              setShowChat={setShowChat}
              conversation={conversations[activeConversationIndex]}
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