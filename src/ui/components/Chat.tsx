import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send } from "lucide-react";

interface ChatProps {
  setShowChat: (show: boolean) => void;
}

// Animated dots component
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
    <Card className="shadow-sm bg-white/80 backdrop-blur-sm inline-block">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {isLoading ? "Thinking..." : "AI Response"}
              </h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* Loading message */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground bg-transparent">
                <div className="flex items-center gap-2">
                  <AnimatedDots />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Chat;