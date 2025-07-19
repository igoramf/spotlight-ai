import { PROMPT_BASE_TEMPLATE } from './promptTemplate';

interface PromptVariables {
  conversation_history: string;
  custom_prompt: string;
}

export async function buildPrompt(
  variables: PromptVariables
): Promise<string> {
  return PROMPT_BASE_TEMPLATE
    .replace("{{conversation_history}}", variables.conversation_history)
    .replace("{{custom_prompt}}", variables.custom_prompt);
} 