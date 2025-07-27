import { PROMPT_BASE_TEMPLATE } from './promptTemplate';

interface PromptVariables {
  conversation_history: string;
  custom_prompt: string;
  user_screen_content?: string;
  live_transcription?: string;
}

export async function buildPrompt(
  variables: PromptVariables
): Promise<string> {
  return PROMPT_BASE_TEMPLATE
    .replace("{{conversation_history}}", variables.conversation_history)
    .replace("{{custom_prompt}}", variables.custom_prompt)
    .replace("{{user_screen_content}}", variables.user_screen_content || "")
    .replace("{{live_transcription}}", variables.live_transcription ? 
      `The following is a live transcription of the user's current conversation/recording:\n\n${variables.live_transcription}` : 
      "No live transcription available.");
} 