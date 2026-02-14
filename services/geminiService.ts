import { GoogleGenAI, Type } from "@google/genai";
import { AIParsedTask, Priority, Category } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const parseNaturalLanguageTask = async (input: string): Promise<AIParsedTask | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse cette demande de tâche en français et extrais les détails structurés. 
      Date de référence: ${new Date().toISOString()}.
      Entrée utilisateur: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Le titre principal de la tâche" },
            description: { type: Type.STRING, description: "Détails supplémentaires ou contexte" },
            date: { type: Type.STRING, description: "Date d'échéance au format ISO 8601 (YYYY-MM-DD). Si non spécifié, utilise la date d'aujourd'hui." },
            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            category: { type: Type.STRING, enum: ["WORK", "PERSONAL", "SHOPPING", "HEALTH", "OTHER"] },
            suggestedSubtasks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Une liste de 3 à 5 sous-tâches logiques pour accomplir la tâche principale."
            }
          },
          required: ["title", "priority", "category"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIParsedTask;
    }
    return null;

  } catch (error) {
    console.error("Error parsing task with Gemini:", error);
    return null;
  }
};

export const suggestSubtasks = async (taskTitle: string): Promise<string[]> => {
  const ai = getAIClient();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère une liste de 3 à 5 sous-tâches concrètes pour : "${taskTitle}". Réponds uniquement avec un tableau JSON de chaînes de caractères.`,
       config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return [];
  }
};