import "dotenv/config";
import { GeminiClient } from "./geminiClient";
import { buildPrompt } from "../../lib/prompt/promptBuilder";
import { IMAGE_PROMPT } from "../../lib/prompt/imagePrompt";
import { imageToBase64 } from "../../lib/helpers";
import * as fs from "fs";


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

async function testExtractTextFromImage() {
  console.log("\n=== Testing extractTextFromImage ===\n");
  
  try {
    const modelName = "gemini-2.5-flash";
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY must be defined in your .env file");
    }

    const geminiClient = new GeminiClient(modelName, apiKey);
    
    const imagePath = "Captura de tela de 2025-07-19 23-19-45.png";
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Imagem não encontrada: ${imagePath}`);
    }
    
    const { base64, mimeType } = imageToBase64(imagePath);
    
    const userQuestion = "Quais são as opções de menu disponíveis nesta interface?";
    const prompt = IMAGE_PROMPT.replace("{{user_question}}", userQuestion);
    
    const result = await geminiClient.extractTextFromImage(prompt, base64, mimeType);
    console.log("✅ Resultado:");
    console.log(result);
    
    console.log("\n🎉 Teste de extractTextFromImage completado com sucesso!");
    
  } catch (error) {
    console.error("❌ Teste de extractTextFromImage falhou:", error);
  }
}

async function runAllTests() {
  console.log("🚀 Iniciando testes do GeminiClient...\n");
  
  await testCreateChatCompletion();
  
  await testExtractTextFromImage();

}

runAllTests(); 