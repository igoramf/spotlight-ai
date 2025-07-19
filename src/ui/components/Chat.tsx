import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import InputCustom from "./InputCustom";
import { Copy, XCircleIcon } from "lucide-react";
import { Badge } from "./ui/badge";

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
}

const Chat = ({ setShowChat }: ChatProps) => {
  const [question, setQuestion] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (message: string) => {
    setQuestion(message);
    setIsLoading(true);
    setResponse(null);

    setTimeout(() => {
      setResponse(`- Neymar is a Brazilian professional football (soccer) player.
- Full name: Neymar da Silva Santos Júnior
- Widely known for his skills, dribbling, and goal-scoring ability
- Played for clubs like Santos (Brazil), Barcelona (Spain), Paris Saint-Germain (France), and Al Hilal (Saudi Arabia)
- Key player for the Brazil national team`);
      setIsLoading(false);
    }, 2000);
  };

  const handleNewConversation = () => {
    setQuestion(null);
    setResponse(null);
  };

  return (
    <div className="flex flex-col items-center w-[700px]">
      {question && (
        <Card className="w-full bg-gray-900/90 backdrop-blur-sm border-gray-700 text-white rounded-b-none">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <div className="text-xs font-medium">
                    <span className="text-gray-400">{isLoading ? "Thinking..." : "AI Response"}</span>
                </div>
                <div className="flex justify-end items-center gap-2">
                    <Badge variant="outline" className="text-sm text-white font-medium bg-gray-700">{question}</Badge>
                    <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-white">
                        <Copy size={16} />
                        </button>
                        <button
                        onClick={handleNewConversation}
                        className="text-gray-400 hover:text-white"
                        >
                        <XCircleIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && <AnimatedDots />}

            {response && (
              <div>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {response.split('\n').map((line, index) => (
                    <li key={index}>{line.replace('-', '').trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <div className="border-b border-gray-700 "></div>
        </Card>
      )}
      <InputCustom onSendMessage={handleSendMessage} isLoading={isLoading} isChatVisible={!!question} />
    </div>
  );
};

export default Chat;