import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
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
  Info,
  ListChecks,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useDynamicInsights } from '../hooks/useDynamicInsights';

interface LiveInsightsProps {
  currentTranscription: string;
  isRecording: boolean;
  isTranscribing: boolean;
  onSendMessage: (message: string) => void;
}

interface TimedAction {
  id: string;
  text: string;
  icon: string;
  color: string;
  timestamp: number;
}

const ACTION_LIFETIME_MS = 10000; // 10 seconds

const LiveInsights = ({
  currentTranscription,
  isRecording,
  isTranscribing,
  onSendMessage
}: LiveInsightsProps) => {
  const dynamicInsights = useDynamicInsights(currentTranscription, isRecording);
  const [timedActions, setTimedActions] = useState<TimedAction[]>([]);
  const [, setTick] = useState(0); // Force re-render for progress bar animation
  const actionsRef = useRef<Map<string, boolean>>(new Map());
  

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

  // Fixed actions that are always available
  const fixedActions = [
    {
      icon: MessageSquare,
      text: "O que devo falar?",
      color: "bg-purple-500",
      description: "Sugerir resposta contextual"
    },
    {
      icon: ListChecks,
      text: "Perguntas de follow-up",
      color: "bg-blue-500",
      description: "Gerar perguntas para aprofundar"
    },
    {
      icon: RotateCcw,
      text: "Recapitular conversa",
      color: "bg-amber-500",
      description: "Resumir pontos principais"
    },
    {
      icon: CheckCircle2,
      text: "Verificar fatos mencionados",
      color: "bg-green-500",
      description: "Checar informações discutidas"
    }
  ];

  // Add new dynamic actions from the hook
  useEffect(() => {
    dynamicInsights.actions.forEach(action => {
      const actionKey = `${action.text}-${action.icon}`;

      // Only add if this action hasn't been seen before
      if (!actionsRef.current.has(actionKey)) {
        actionsRef.current.set(actionKey, true);

        const newTimedAction: TimedAction = {
          id: `${Date.now()}-${Math.random()}`,
          text: action.text,
          icon: action.icon,
          color: action.color,
          timestamp: Date.now()
        };

        setTimedActions(prev => [...prev, newTimedAction]);
      }
    });
  }, [dynamicInsights.actions]);

  // Remove expired actions and update progress bars
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Remove expired actions
      setTimedActions(prev => {
        const updated = prev.filter(action => {
          const age = now - action.timestamp;
          return age < ACTION_LIFETIME_MS;
        });

        // Clean up the ref map for removed actions
        if (updated.length < prev.length) {
          const remainingTexts = new Set(updated.map(a => `${a.text}-${a.icon}`));
          const newMap = new Map<string, boolean>();
          remainingTexts.forEach(key => newMap.set(key, true));
          actionsRef.current = newMap;
        }

        return updated;
      });

      // Force re-render to update progress bars
      setTick(prev => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Map timed actions to display format with icons
  const dynamicActionsMapped = timedActions.map(action => ({
    ...action,
    icon: getIconComponent(action.icon),
    age: Date.now() - action.timestamp
  }));

  const allActions = [...fixedActions.map(a => ({ ...a, isFixed: true })), ...dynamicActionsMapped.map(a => ({ ...a, isFixed: false }))];

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
          {/* Transcription Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xs font-semibold text-gray-400">🎤 Transcrição</h4>
              {isRecording && (
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="max-h-40 w-full rounded-md border border-gray-700 overflow-y-auto">
              <div className="text-xs text-gray-300 bg-gray-800/50 p-3 leading-relaxed">
                {currentTranscription || (
                  <div className="text-center text-gray-500">
                    <p>Nenhuma transcrição disponível ainda...</p>
                    <p className="mt-2 text-xs">Comece a gravar para ver a transcrição ao vivo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Smart Actions Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-semibold text-gray-400">Ações Inteligentes</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px] bg-gray-800 border-gray-700">
                  <p className="text-xs text-gray-200 mb-2">Clique em uma ação para enviar ao chat da IA</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="max-h-64 w-full overflow-y-auto">
              <div className="space-y-2">
                {allActions.map((action, index) => {
                  const IconComponent = action.icon;
                  const isFixed = 'isFixed' in action && action.isFixed;
                  const age = 'age' in action ? action.age : 0;
                  const progress = isFixed ? 100 : Math.max(0, ((ACTION_LIFETIME_MS - age) / ACTION_LIFETIME_MS) * 100);

                  return (
                    <Tooltip key={action.id || index}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleActionClick(action.text)}
                          className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-800/60 rounded-md text-left transition-all duration-200 group border border-transparent hover:border-gray-600 relative overflow-hidden"
                        >
                          {/* Progress bar for dynamic actions */}
                          {!isFixed && (
                            <div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500/40 to-purple-500/40 transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            />
                          )}

                          <div className={`w-5 h-5 rounded-full ${action.color} flex items-center justify-center flex-shrink-0 relative z-10`}>
                            <IconComponent className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-tight relative z-10">
                            {action.text}
                          </span>
                          <Brain className="w-3 h-3 text-gray-400/60 ml-auto flex-shrink-0 group-hover:text-gray-300/80 relative z-10" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-gray-800 border-gray-700">
                        <p className="text-xs text-gray-200">
                          {action.description || "Enviar ao chat da IA"}
                        </p>
                        {!isFixed && (
                          <p className="text-xs text-gray-400 mt-1">
                            Expira em {Math.ceil((ACTION_LIFETIME_MS - age) / 1000)}s
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveInsights;