import OpenAI from "openai";
import 'dotenv'

const azureApiKey = process.env.VITE_AZURE_OPENAI_API_KEY;
const endpoint = process.env.VITE_AZURE_BASE_URL;
const apiVersion = process.env.VITE_AZURE_OPENAI_VERSION;

if (!azureApiKey || !endpoint) {
  throw new Error(
    "VITE_AZURE_OPENAI_API_KEY and VITE_AZURE_BASE_URL must be defined in your .env file"
  );
}

export class AzureOpenAIClient {
  private openai: OpenAI;
  private deploymentName: string;

  constructor(deploymentName: string) {
    if (!deploymentName) {
      throw new Error("Deployment name must be provided.");
    }
    this.deploymentName = deploymentName;

    this.openai = new OpenAI({
      apiKey: azureApiKey,
      baseURL: `${endpoint}/openai/deployments/${this.deploymentName}`,
      defaultQuery: { "api-version": apiVersion },
      defaultHeaders: { "api-key": azureApiKey },
    });
  }

  async createChatCompletion(prompt: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.deploymentName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      return response.choices[0]?.message?.content;
    } catch (error) {
      console.error("Error creating chat completion:", error);
      throw error;
    }
  }
}