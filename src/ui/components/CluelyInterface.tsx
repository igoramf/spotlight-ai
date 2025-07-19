import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Settings, Eye, EyeOff, Mic } from 'lucide-react';
import Chat from './Chat';

const CluelyInterface = () => {
  const [timer, setTimer] = useState('00:00');
  const [showHide, setShowHide] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showChat, setShowChat] = useState(false);

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
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        setShowChat(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="">
      <div className="flex flex-col items-center">
        {/* Header Control Bar */}
        <Card className="shadow-sm bg-white/80 backdrop-blur-sm inline-block">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">       
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsRecording((r) => !r)}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <Mic className={isRecording ? 'text-red-500 animate-pulse' : ''} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={() => setShowChat(true)}
                >
                  Ask AI
                  <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">⌘</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">F</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHide(!showHide)}
                  className="text-muted-foreground"
                >
                  {showHide ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  Show/Hide
                  <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">⌘</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">X</span>
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Response Section */}
        {showChat && (
          <div className="mt-2">
            <Chat setShowChat={setShowChat} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CluelyInterface;