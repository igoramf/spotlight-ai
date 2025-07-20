import "dotenv/config";
import { AzureOpenAIClient } from "./azureClient.js";
import { buildPrompt } from "../../lib/prompt/promptBuilder.js";

const client = new AzureOpenAIClient("gpt-4.1");

const prompt = await buildPrompt({
  conversation_history: "USER: Olá, como vai?\nASSISTANT: Estou bem, obrigado por perguntar!\nUSER: Quantos gols neymar tem? ",
  custom_prompt: "Responda sempre em pt-br",
});

const response = await client.createChatCompletion(prompt);

console.log(response);