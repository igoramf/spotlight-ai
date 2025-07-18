import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Eye, EyeOff, Mic } from 'lucide-react';

const CluelyInterface = () => {
  const [timer, setTimer] = useState('00:00');
  const [showHide, setShowHide] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Control Bar */}
        <Card className="shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={isRecording ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsRecording((r) => !r)}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <Mic className={isRecording ? 'text-red-500 animate-pulse' : ''} />
                </Button>
                <span className="font-mono tabular-nums w-12 text-base">{timer}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-muted-foreground">
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
        <Card className="shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              </div>
              <h2 className="text-sm font-medium text-muted-foreground">AI Response</h2>
            </div>
            
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                I can see you're currently viewing the Cluely website homepage. The AI assistant that monitors 
                your screen and audio to provide contextual help before you even ask for it.
              </p>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">What is Cluely?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cluely is a proactive AI assistant. Unlike traditional AI chatbots where you need to actively ask 
                  questions, Cluely runs in the background, continuously observing your screen content and 
                  listening to your audio to provide relevant assistance in real-time.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Features:</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-medium">1.</span>
                    <span><strong className="text-foreground">Screen monitoring:</strong> Cluely can see what's on your screen and understand the context</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">2.</span>
                    <span><strong className="text-foreground">Audio listening:</strong> It processes your calls and conversations</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">3.</span>
                    <span><strong className="text-foreground">Proactive assistance:</strong> Rather than waiting for questions, it anticipates what you might need</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CluelyInterface;