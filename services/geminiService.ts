import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIChatResponse = async (
  message: string,
  context: string = "Você é um assistente de suporte útil e amigável para um aplicativo de transporte chamado Já vai. Responda sempre em Português do Brasil de forma concisa."
): Promise<string> => {
  if (!process.env.API_KEY) return "Serviço de IA indisponível (Falta API Key).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          { text: `Contexto do Sistema: ${context}` },
          { text: `Mensagem do Usuário: ${message}` }
        ]
      },
      config: {
        maxOutputTokens: 150,
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Estou com problemas para conectar ao servidor agora.";
  }
};