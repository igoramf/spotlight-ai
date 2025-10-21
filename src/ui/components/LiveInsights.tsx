import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MessageSquare, 
  Globe, 
  HelpCircle, 
  BookOpen, 
  MapPin, 
  Building2, 
  Lightbulb, 
  Brain 
} from 'lucide-react';
import { useDynamicInsights } from '../hooks/useDynamicInsights';

interface LiveInsightsProps {
  currentTranscription: string;
  isRecording: boolean;
  isTranscribing: boolean;
  onSendMessage: (message: string) => void;
}

const LiveInsights = ({ 
  currentTranscription, 
  isRecording, 
  isTranscribing,
  onSendMessage 
}: LiveInsightsProps) => {
  const [activeTab, setActiveTab] = useState('summary');
  const dynamicInsights = useDynamicInsights(currentTranscription, isRecording);
  

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'HelpCircle': HelpCircle,
      'Lightbulb': Lightbulb,
      'Brain': Brain,
      'BookOpen': BookOpen,
      'Globe': Globe,
      'MapPin': MapPin,
      'Building2': Building2
    };
    return iconMap[iconName] || HelpCircle;
  };
  
  // Static fallback actions when no dynamic actions are available
  const staticActions = [
    { icon: Lightbulb, text: "Give me help with productivity", color: "bg-yellow-500" },
    { icon: HelpCircle, text: "Suggest follow-up questions", color: "bg-blue-500" },
    { icon: Brain, text: "Think of another question", color: "bg-purple-500" }
  ];


  const actions = dynamicInsights.actions.length > 0 ? 
    dynamicInsights.actions.map(action => ({
      ...action,
      icon: getIconComponent(action.icon)
    })) : 
    staticActions;

  const handleActionClick = (actionText: string) => {
    onSendMessage(actionText);
  };

  return (
    <div className="w-80 pointer-events-auto">
      <Card className="shadow-lg bg-gray-900/95 backdrop-blur-sm border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-100">Live Insights</h3>
            <div className="flex items-center gap-2">
              {dynamicInsights.isAnalyzing && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Analisando...</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/70 border-gray-600 h-8">
              <TabsTrigger 
                value="summary" 
                className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 py-1 transition-colors"
              >
                📄 Summary
              </TabsTrigger>
              <TabsTrigger 
                value="transcript" 
                className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 py-1 transition-colors"
              >
                🎤 Transcript
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-3">
              <div className="text-xs text-gray-300 bg-gray-800/50 rounded-md p-3 leading-relaxed">
                {dynamicInsights.summary}
                {dynamicInsights.isAnalyzing && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs">Atualizando insights...</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="transcript" className="mt-3">
              <div className="max-h-32 w-full rounded-md border border-gray-700 overflow-y-auto">
                <div className="text-xs text-gray-300 bg-gray-800/50 p-3 leading-relaxed">
                  {currentTranscription || (
                    <div className="text-center text-gray-500">
                      <p>Nenhuma transcrição disponível ainda...</p>
                      <p className="mt-2 text-xs">Comece a gravar para ver a transcrição ao vivo</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {activeTab === 'summary' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3">Ações Inteligentes</h4>
              <div className="max-h-36 w-full overflow-y-auto">
                <div className="space-y-2">
                  {actions.map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleActionClick(action.text)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-800/60 rounded-md text-left transition-all duration-200 group border border-transparent hover:border-gray-600"
                      >
                        <div className={`w-4 h-4 rounded-full ${action.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-tight">
                          {action.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveInsights;