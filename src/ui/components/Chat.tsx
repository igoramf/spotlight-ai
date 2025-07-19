import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send } from "lucide-react";

interface ChatProps {
  setShowChat: (show: boolean) => void;
}

const AnimatedDots = () => {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
    </div>
  );
};

const Chat = ({ setShowChat }: ChatProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { text: message, isUser: true }]);
      setMessage("");
      setIsLoading(true);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "I'm here to help! This is a mock response. In a real implementation, this would be the AI's response.", 
          isUser: false 
        }]);
        setIsLoading(false);
      }, 2000); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center">
        <Input
            placeholder="Ask about your screen"
            className="shadow-sm bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white w-[700px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
        />
    </div>
  );
};

export default Chat;