import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ES module-safe way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptBasePath = path.resolve(__dirname, "prompt_base.txt");

let promptBaseContent: string | null = null;

async function getPromptBase(): Promise<string> {
  if (promptBaseContent === null) {
    try {
      promptBaseContent = await fs.readFile(promptBasePath, "utf-8");
    } catch (error) {
      console.error("Error reading prompt_base.txt:", error);
      throw new Error("Could not load the base prompt template.");
    }
  }
  return promptBaseContent;
}

interface PromptVariables {
  conversation_history: string;
  custom_prompt: string;
}

export async function buildPrompt(
  variables: PromptVariables
): Promise<string> {
  const base = await getPromptBase();
  return base
    .replace("{{conversation_history}}", variables.conversation_history)
    .replace("{{custom_prompt}}", variables.custom_prompt);
} 