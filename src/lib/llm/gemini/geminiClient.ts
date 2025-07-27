import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export class GeminiClient {
  private modelName: string;
  private genAI: GoogleGenerativeAI;

  constructor(modelName: string, apiKey?: string) {
    if (!modelName) {
      throw new Error("Model name must be provided.");
    }
    this.modelName = modelName;

    const effectiveApiKey =
      apiKey ||
      (typeof import.meta !== "undefined"
        ? import.meta.env.VITE_GEMINI_API_KEY
        : undefined);

    if (!effectiveApiKey) {
      throw new Error(
        "VITE_GEMINI_API_KEY must be provided either in the constructor or in your .env file."
      );
    }
    this.genAI = new GoogleGenerativeAI(effectiveApiKey);
  }

  private getModel(vision: boolean = false) {
    const model = vision ? "gemini-2.0-flash-lite" : this.modelName;
    return this.genAI.getGenerativeModel({ model });
  }

  async createChatCompletion(prompt: string) {
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error creating chat completion:", error);
      throw error;
    }
  }

  async extractTextFromImage(
    prompt: string,
    imageBase64: string,
    imageType: string
  ) {
    try {
      const model = this.getModel(true);
      const image = {
        inlineData: {
          data: imageBase64,
          mimeType: imageType,
        },
      };
      
      const result = await model.generateContent([prompt, image]);
      const response = await result.response;
      return response.text();
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw error;
    }
  }

  async transcribeAudio(audioBase64: string, mimeType: string, language: string = "pt-BR") {
    try {
      const model = this.getModel(); // Using Gemini Flash for audio transcription
      
      const audioData = {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType,
        },
      };

      const prompt = `Transcreva o áudio fornecido para texto em ${language}. 
      Forneça apenas a transcrição do que foi falado, sem comentários adicionais.
      Se não houver fala audível, responda apenas "..." 
      Mantenha a formatação natural da fala com pontuação apropriada.`;
      
      const result = await model.generateContent([prompt, audioData]);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }
} 