import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send, Search, GlobeIcon, BrainIcon, ArrowRight } from "lucide-react";

interface InputCustomProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    isChatVisible?: boolean;
    onSmartModeChange?: (isSmartMode: boolean) => void;
    onSearchModeChange?: (isSearchMode: boolean) => void;
  }

const InputCustom = ({ onSendMessage, isLoading, isChatVisible, onSmartModeChange, onSearchModeChange }: InputCustomProps) => {
  const [message, setMessage] = useState("");
  const [isSmart, setIsSmart] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const handleCluelyQuestion = (event: CustomEvent) => {
      const { question } = event.detail;
      if (question && question.trim()) {
        // Send message immediately without setting it in the input
        onSendMessage(question.trim());
      }
    };

    window.addEventListener('cluelyQuestion', handleCluelyQuestion as EventListener);
    
    return () => {
      window.removeEventListener('cluelyQuestion', handleCluelyQuestion as EventListener);
    };
  }, [onSendMessage]);

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

  const handleSmartToggle = () => {
    const newSmartState = !isSmart;
    setIsSmart(newSmartState);
    onSmartModeChange?.(newSmartState);
  };

  const handleSearchToggle = () => {
    const newSearchState = !isSearch;
    setIsSearch(newSearchState);
    onSearchModeChange?.(newSearchState);
  };

  return (
    <div className="flex flex-col items-center">
        {/* Input field with attached send button */}
        <div className="relative w-[700px]">
          <Input
            ref={inputRef}
            placeholder="Ask about your screen"
            className={`shadow-sm bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none pr-32 ${isChatVisible ? 'rounded-t-none' : ''}`}
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
              onClick={handleSearchToggle}
              disabled={isLoading}
            >
              <GlobeIcon className="w-3 h-3 " />
              Search
            </Button>
            <Button
              variant={isSmart ? "default" : "outline"}
              size="xs"
              className="h-6 px-1.5 text-gray-300 border-gray-600 hover:bg-gray-800 rounded-full text-xs"
              onClick={handleSmartToggle}
              disabled={isLoading}
            >
              <BrainIcon className="w-3 h-3" />
              Smart
            </Button>

            <button disabled={isLoading} onClick={handleSendMessage}>
              <span className="flex items-center gap-0.5 text-gray-300 text-xs">
                Submit <span className="text-md">↵</span>
              </span>
            </button>
          </div>
        </div>
    </div>
  );
};

export default InputCustom;