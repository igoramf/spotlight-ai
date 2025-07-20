import "dotenv/config";
import { GeminiClient } from "./geminiClient";
import { buildPrompt } from "../../lib/prompt/promptBuilder";

async function testCreateChatCompletion() {
  try {
    const modelName = "gemini-2.5-flash";
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY must be defined in your .env file");
    }

    const geminiClient = new GeminiClient(modelName, apiKey);

    const prompt = await buildPrompt({
      conversation_history: "",
      custom_prompt: "Qual é a capital da França?",
      user_screen_content: ""
    });

    console.log(`Testing createChatCompletion with prompt: "${prompt}"`);

    const result = await geminiClient.createChatCompletion(prompt);
    console.log(result);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCreateChatCompletion(); 