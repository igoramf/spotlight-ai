import { useState, useEffect, useRef } from 'react';
import { GeminiClient } from '../../lib/llm/gemini/geminiClient';

interface DynamicAction {
  icon: any;
  text: string;
  color: string;
}

interface DynamicInsights {
  actions: DynamicAction[];
  summary: string;
  isAnalyzing: boolean;
}

const INSIGHTS_PROMPT_TEMPLATE = `
Você é um assistente inteligente que analisa reuniões em tempo real para ajudar o usuário a participar de forma mais efetiva. Você combina o conteúdo da tela (que você está vendo agora) com o que está sendo dito para entender o contexto e gerar perguntas/ações úteis.

## CONTEXTO

### Transcrição da Reunião (o que está sendo dito):
{{transcription}}

## SUA TAREFA

Gere uma resposta JSON com dois campos focados em AUXILIAR DURANTE REUNIÕES:

1. **"summary"** (string):
   - Resumo em 2-3 frases do que está acontecendo na reunião
   - Sintetize o que você VÊ na tela + a transcrição para entender o tópico atual
   - Foque no ASSUNTO/CONTEXTO sendo discutido
   - Use AMBAS as fontes de informação (visual + transcrição) para gerar um resumo rico
   - Se não houver transcrição ainda, descreva o que está visível na tela
   - Exemplos:
     - ✓ "Discussão sobre arquitetura de um sistema React com foco em gerenciamento de estado. Tela mostra diagrama de componentes."
     - ✓ "Apresentação de slides sobre planejamento trimestral Q2 com métricas de vendas"
     - ✗ "Há pessoas falando"

2. **"suggested_actions"** (array de objetos):
   - SEMPRE gere 3-4 sugestões úteis para reuniões
   - Cada objeto: {"text": "Pergunta ou ação específica"}
   - Tipos de sugestões IDEAIS para reuniões:
     * Perguntas de esclarecimento sobre o tópico atual
     * Pedidos para aprofundar em pontos específicos
     * Sugestões de tópicos relacionados
     * Solicitações de exemplos práticos
     * Pedidos para resumir ou recapitular
   - Exemplos de BOAS sugestões:
     - ✓ "Peça para esclarecer como isso afeta o cronograma do projeto"
     - ✓ "Sugira uma discussão sobre alternativas para essa abordagem"
     - ✓ "Pergunte sobre exemplos práticos de uso dessa solução"
     - ✓ "Solicite um resumo dos pontos principais discutidos até agora"
     - ✓ "Pergunte sobre os próximos passos e responsáveis"
   - Evite sugestões genéricas como "Peça ajuda" ou "Tire dúvidas"

## CRITÉRIOS DE QUALIDADE

### Requisitos do Summary:
- Analise o que você VÊ na imagem da tela E a transcrição fornecida
- Integre informações VISUAIS (slides, documentos, apps) com o que está sendo DITO
- Descreva o TÓPICO/ASSUNTO sendo discutido de forma contextualizada
- Seja conciso mas informativo (máximo 3 frases)
- Use presente do indicativo

### Requisitos das Ações Sugeridas:
- Devem ser ESPECÍFICAS ao contexto atual
- Devem ser ACIONÁVEIS imediatamente (o usuário pode falar/perguntar)
- Prefira PERGUNTAS que o usuário possa fazer na reunião
- SEMPRE gere pelo menos 3 sugestões relevantes
- Foque em ajudar o usuário a participar ativamente

## FORMATO DE SAÍDA

Retorne APENAS JSON puro - sem markdown, sem blocos de código, sem texto extra:

{
  "summary": "Descrição do que está sendo discutido",
  "suggested_actions": [
    {"text": "Primeira pergunta/ação específica"},
    {"text": "Segunda pergunta/ação específica"},
    {"text": "Terceira pergunta/ação específica"}
  ]
}

IMPORTANTE: SEMPRE gere pelo menos 3 suggested_actions relevantes ao contexto.
`;

// Helper function to extract JSON from markdown-formatted responses
const extractJsonFromMarkdown = (response: string): string => {
  // Remove markdown code blocks if present
  const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  // If no markdown blocks, try to find JSON object directly
  const directJsonMatch = response.match(/\{[\s\S]*\}/);
  if (directJsonMatch) {
    return directJsonMatch[0];
  }
  
  // Return original response if no pattern matches
  return response.trim();
};

export const useDynamicInsights = (currentTranscription: string, isRecording: boolean) => {
  const [insights, setInsights] = useState<DynamicInsights>({
    actions: [],
    summary: "Comece a gravar para ver insights ao vivo e resumos da sua reunião.",
    isAnalyzing: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const analyzeContext = async () => {
    if (!isRecording) {
      console.log('[LiveInsights] Não está gravando, pulando análise');
      return;
    }

    if (insights.isAnalyzing) {
      console.log('[LiveInsights] Já está analisando, pulando');
      return;
    }

    console.log('[LiveInsights] Iniciando análise de contexto...');

    try {
      // Set analyzing to true but preserve previous content
      setInsights(prev => ({ ...prev, isAnalyzing: true }));

      const screenshotBase64 = await window.electronAPI.takeScreenshot();
      if (!screenshotBase64) {
        console.warn('[LiveInsights] Falha ao capturar screenshot');
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }

      console.log('[LiveInsights] Screenshot capturado com sucesso');

      const geminiClient = new GeminiClient("gemini-2.5-flash");
      const base64Data = screenshotBase64.split(',')[1];
      const imageType = screenshotBase64.split(';')[0].split(':')[1];

      // Prepara o prompt incluindo a transcrição
      const prompt = INSIGHTS_PROMPT_TEMPLATE
        .replace('{{transcription}}', currentTranscription || 'Nenhuma transcrição disponível ainda - analise apenas o que você vê na tela.');

      console.log('[LiveInsights] Gerando insights com Gemini (imagem + transcrição)...');
      console.log('[LiveInsights] Transcrição atual:', currentTranscription?.substring(0, 100) + '...');

      // Usa createChatCompletionWithImage para enviar screenshot E prompt de uma vez
      const response = await geminiClient.createChatCompletionWithImage(
        prompt,
        base64Data,
        imageType
      );

      if (!response) {
        console.warn('[LiveInsights] Resposta vazia do Gemini');
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }

      console.log('[LiveInsights] Resposta recebida:', response.substring(0, 200) + '...');

      try {
        // Clean the response to extract JSON from markdown formatting
        const cleanedResponse = extractJsonFromMarkdown(response);
        const parsedResponse = JSON.parse(cleanedResponse);

        console.log('[LiveInsights] Insights parseados com sucesso:', {
          actionsCount: parsedResponse.suggested_actions?.length || 0,
          hasSummary: !!parsedResponse.summary
        });

        const dynamicActions = parsedResponse.suggested_actions?.map((action: any, index: number) => ({
          icon: getActionIcon(index),
          text: action.text,
          color: getActionColor(index)
        })) || [];

        // Only update content when analysis is complete
        setInsights(prev => ({
          ...prev,
          actions: dynamicActions,
          summary: parsedResponse.summary || prev.summary,
          isAnalyzing: false
        }));

        console.log('[LiveInsights] State atualizado com', dynamicActions.length, 'ações');

      } catch (parseError) {
        console.error('[LiveInsights] Falha ao parsear resposta:', parseError);
        console.error('[LiveInsights] Resposta bruta:', response);
        setInsights(prev => ({ ...prev, isAnalyzing: false }));
      }

    } catch (error) {
      console.error('[LiveInsights] Erro ao analisar contexto:', error);
      setInsights(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  useEffect(() => {
    if (isRecording) {
      console.log('[LiveInsights] Iniciando monitoramento - análise a cada 6 segundos');

      // Primeira análise imediata
      analyzeContext();

      // Depois analisa a cada 6 segundos (mais responsivo que 10s)
      intervalRef.current = setInterval(analyzeContext, 6000);
    } else {
      console.log('[LiveInsights] Parando monitoramento');

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setInsights({
        actions: [],
        summary: "Comece a gravar para ver insights ao vivo e resumos da sua reunião.",
        isAnalyzing: false
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  return insights;
};

const getActionIcon = (index: number) => {
  const icons = [
    'HelpCircle', 
    'Lightbulb',    
    'Brain'       
  ];
  return icons[index % icons.length];
};

const getActionColor = (index: number) => {
  const colors = [
    'bg-blue-500',
    'bg-yellow-500', 
    'bg-purple-500'
  ];
  return colors[index % colors.length];
}; 