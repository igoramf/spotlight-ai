import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  MessageSquare,
  Globe,
  HelpCircle,
  BookOpen,
  MapPin,
  Building2,
  Lightbulb,
  Brain,
  Info
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
  
  // Static fallback actions when no dynamic actions are available (only follow-up suggestions)
  const staticActions = [
    { icon: HelpCircle, text: "Sugira perguntas de follow-up relevantes", color: "bg-blue-500" }
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
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-xs font-semibold text-gray-400">Ações Inteligentes</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px] bg-gray-800 border-gray-700">
                    <p className="text-xs text-gray-200 mb-2 font-semibold">Dois tipos de ações:</p>
                    <p className="text-xs text-gray-300 mb-1">
                      <span className="text-blue-400">•</span> <strong>Follow-up:</strong> Perguntas para fazer na reunião
                    </p>
                    <p className="text-xs text-gray-300">
                      <span className="text-green-400">•</span> <strong>Consulta à IA:</strong> Perguntas para enviar ao chat quando não souber responder
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="max-h-36 w-full overflow-y-auto">
                <div className="space-y-2">
                  {actions.map((action, index) => {
                    const IconComponent = action.icon;
                    // Detecta se é pergunta para reunião (começa com verbos de ação)
                    const isMeetingQuestion = /^(Peça|Pergunte|Solicite|Sugira)/i.test(action.text);

                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleActionClick(action.text)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-800/60 rounded-md text-left transition-all duration-200 group border border-transparent hover:border-gray-600"
                          >
                            <div className={`w-4 h-4 rounded-full ${action.color} flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-tight">
                              {action.text}
                            </span>
                            {isMeetingQuestion ? (
                              <MessageSquare className="w-3 h-3 text-blue-400/60 ml-auto flex-shrink-0" />
                            ) : (
                              <Brain className="w-3 h-3 text-green-400/60 ml-auto flex-shrink-0" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-gray-800 border-gray-700">
                          <p className="text-xs text-gray-200">
                            {isMeetingQuestion ? (
                              <span><span className="text-blue-400">💬</span> Fale na reunião</span>
                            ) : (
                              <span><span className="text-green-400">🤖</span> Enviar ao chat da IA</span>
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
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