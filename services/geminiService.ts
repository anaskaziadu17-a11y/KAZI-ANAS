import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from '../types';

// Initialize Gemini
// Note: In a real production app, you might proxy this through a backend to hide the key,
// but for this client-side demo, we use the env var directly.
const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeJournalEntry = async (text: string): Promise<AIAnalysis> => {
  if (!text || text.length < 10) {
      throw new Error("Entry too short to analyze");
  }

  const ai = getAIClient();

  const prompt = `
    Analyze the following journal entry. 
    Provide a sentiment classification, a sentiment score (-1 negative to 1 positive), 
    extract up to 5 relevant tags, write a very brief 1-sentence summary, 
    provide a short piece of constructive advice or a stoic quote based on the content,
    and select a single emoji that best represents the mood.
    
    Journal Entry: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              enum: ['Positive', 'Neutral', 'Negative', 'Mixed']
            },
            sentimentScore: {
              type: Type.NUMBER,
              description: "A number between -1 and 1"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING },
            advice: { type: Type.STRING },
            moodEmoji: { type: Type.STRING }
          },
          required: ['sentiment', 'sentimentScore', 'tags', 'summary', 'advice', 'moodEmoji']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    return JSON.parse(resultText) as AIAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback or rethrow depending on UX preference. 
    // Here we rethrow to let the UI handle the error state.
    throw error;
  }
};
