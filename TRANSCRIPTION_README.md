# Transcrição em Tempo Real com Gemini Flash

## Visão Geral

Esta implementação adiciona transcrição de áudio em tempo real usando o modelo Gemini Flash da Google, com arquitetura baseada em WebSockets para processar múltiplos chunks de áudio continuamente.

## Arquitetura

### 1. Servidor WebSocket (Electron Main Process)
- **Porta**: 8080
- **Localização**: `src/electron/main.ts`
- **Funcionalidades**:
  - Recebe chunks de áudio a cada 3 segundos
  - Processa transcrição usando Gemini Flash
  - Retorna transcrições com timestamps
  - Gerencia estado de processamento

### 2. Cliente WebSocket (React Frontend)
- **Localização**: `src/ui/hooks/useAudioRecording.ts`
- **Funcionalidades**:
  - Conecta ao servidor WebSocket
  - Captura áudio do microfone e sistema
  - Envia chunks de 3 segundos para transcrição
  - Exibe transcrições em tempo real na interface

### 3. Interface de Usuário
- **Localização**: `src/ui/components/CluelyInterface.tsx`
- **Funcionalidades**:
  - Botão "Listen" para iniciar/parar gravação
  - Indicador de status de transcrição
  - Painel de transcrição em tempo real
  - Contador de tempo de gravação

## Fluxo de Funcionamento

1. **Início da Gravação**:
   - Usuário clica no botão "Listen"
   - Sistema solicita permissões de microfone e áudio do sistema
   - Conecta ao WebSocket server
   - Inicia dois gravadores:
     - `MediaRecorder` principal para salvar arquivo completo
     - `MediaRecorder` de chunks para transcrição em tempo real

2. **Processamento Contínuo**:
   - A cada 3 segundos, um chunk de áudio é enviado via WebSocket
   - Servidor processa com Gemini Flash
   - Transcrição retorna com timestamp
   - Interface atualiza em tempo real

3. **Finalização**:
   - Usuário clica novamente em "Listen"
   - Gravação completa é salva no diretório `recordings/`
   - WebSocket é fechado
   - Streams de áudio são liberados

## Tecnologias Utilizadas

- **Gemini Flash**: Modelo de IA para transcrição de áudio
- **WebSockets**: Comunicação real-time entre frontend e backend
- **MediaRecorder API**: Captura de áudio do navegador
- **Web Audio API**: Mixagem de áudio de microfone e sistema

## Configuração Necessária

### Variáveis de Ambiente
```bash
VITE_GEMINI_API_KEY=sua_chave_api_aqui
```

### Dependências
```json
{
  "ws": "^8.x.x",
  "@types/ws": "^8.x.x",
  "@google/generative-ai": "^0.24.1"
}
```

## Recursos Implementados

### ✅ Funcionalidades Completas
- [x] Transcrição contínua em tempo real (chunks de 3s)
- [x] Suporte a múltiplos requests simultâneos via WebSocket
- [x] Captura de áudio do microfone + sistema
- [x] Salvamento de gravação completa
- [x] Interface com indicadores visuais
- [x] Timestamps nas transcrições
- [x] Gerenciamento de estado de conexão
- [x] Tratamento de erros

### 🎯 Melhorias Futuras Sugeridas
- [ ] Configuração de intervalo de chunks
- [ ] Suporte a múltiplos idiomas
- [ ] Detecção de diferentes falantes
- [ ] Exportação de transcrições para diferentes formatos
- [ ] Compressão de áudio antes do envio
- [ ] Reconexão automática do WebSocket

## Estrutura de Mensagens WebSocket

### Cliente → Servidor
```json
{
  "type": "audio-chunk",
  "audioData": "base64_encoded_audio",
  "mimeType": "audio/webm;codecs=opus"
}
```

### Servidor → Cliente
```json
// Status de processamento
{
  "type": "transcription-status",
  "status": "processing"
}

// Resultado da transcrição
{
  "type": "transcription-result",
  "transcription": "texto transcrito",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// Erro
{
  "type": "error",
  "message": "Mensagem de erro"
}
```

## Como Testar

1. Certifique-se de ter a chave API do Gemini configurada
2. Execute `npm run dev`
3. Clique no botão "Listen"
4. Permita acesso ao microfone quando solicitado
5. Fale próximo ao microfone
6. Observe a transcrição aparecendo em tempo real
7. Clique novamente em "Listen" para parar
8. Verifique o arquivo salvo em `recordings/`

## Solução de Problemas

### WebSocket não conecta
- Verifique se a porta 8080 está disponível
- Confirme se o processo Electron está rodando

### Transcrição não funciona
- Verifique a chave API do Gemini
- Confirme que há áudio sendo capturado
- Verifique o console para erros

### Áudio não é capturado
- Confirme permissões do navegador
- Teste em ambiente HTTPS ou localhost
- Verifique se o microfone está funcionando 