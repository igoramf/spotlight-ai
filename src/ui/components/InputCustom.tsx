import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send, Search, GlobeIcon, BrainIcon, ArrowRight } from "lucide-react";

interface InputCustomProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
  }

const InputCustom = ({ onSendMessage, isLoading }: InputCustomProps) => {
  const [message, setMessage] = useState("");
  const [isSmart, setIsSmart] = useState(false);
  const [isSearch, setIsSearch] = useState(false);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
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
        {/* Input field with attached send button */}
        <div className="relative w-[700px]">
          <Input
            placeholder="Ask about your screen"
            className="shadow-sm bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none pr-32"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />

          <div className="absolute right-1.5 inset-y-0 flex items-center gap-3 text-xs">
            <Button
              variant={isSearch ? "default" : "outline"}
              size="xs"
              className="h-6 px-1.5 text-gray-300 border-gray-600 hover:bg-gray-800 rounded-full text-xs"
              onClick={() => setIsSearch(!isSearch)}
              disabled={isLoading}
            >
              <GlobeIcon className="w-3 h-3 " />
              Search
            </Button>
            <Button
              variant={isSmart ? "default" : "outline"}
              size="xs"
              className="h-6 px-1.5 text-gray-300 border-gray-600 hover:bg-gray-800 rounded-full text-xs"
              onClick={() => setIsSmart(!isSmart)}
              disabled={isLoading}
            >
              <BrainIcon className="w-3 h-3" />
              Smart
            </Button>

            <button disabled={isLoading} onClick={handleSendMessage}>
              <span className="flex items-center gap-0.5 text-gray-300 text-xs">
                Submit <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>
    </div>
  );
};

export default InputCustom;