import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// Note: API Key is expected to be in process.env.REACT_APP_GEMINI_API_KEY
const getAiClient = () => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("REACT_APP_GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Parses a natural language search query into structured filters.
 * Example: "Show me cheap engineering colleges in Bangalore" -> { location: 'Bangalore', query: 'Engineering' }
 */
export const parseSearchQuery = async (userQuery: string) => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this user query for college admissions in India: "${userQuery}".
      
      Extract search filters:
      1. location: City or State. Fix typos (e.g. "Kolkatta" -> "Kolkata").
      2. keyword: Specific degree, course, or specialization (e.g., "B.Tech", "Computer Science", "IT", "Bio Technology", "MBA"). 
         - Do NOT generalize to broad topics (e.g. keep "Computer Science", don't convert to "Engineering").
         - Fix typos (e.g. "Coputer Scence" -> "Computer Science").
      
      Return JSON: { "location": string | null, "keyword": string | null }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING, nullable: true },
            keyword: { type: Type.STRING, nullable: true }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error parsing search query with Gemini:", error);
    return null;
  }
};

/**
 * Generates a summary or recommendation explanation for a course.
 */
export const getCourseInsights = async (courseName: string, collegeName: string, description: string) => {
  const ai = getAiClient();
  if (!ai) return "AI insights unavailable.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a 2-sentence exciting summary about the ${courseName} program at ${collegeName}, India. 
      Use the provided description for context: "${description.substring(0, 1000)}...".
      Focus on career prospects and unique selling points.`,
    });
    return response.text || "No insights available.";
  } catch (error) {
    return "No insights available.";
  }
};

/**
 * Generates a summary for a college.
 */
export const getCollegeInsights = async (collegeName: string, location: string, description: string) => {
  const ai = getAiClient();
  if (!ai) return "AI insights unavailable.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a 2-sentence highlight summary about ${collegeName} located in ${location}.
      Use the provided description for context: "${description.substring(0, 1000)}...".
      Focus on campus life, reputation, or infrastructure.`,
    });
    return response.text || "No insights available.";
  } catch (error) {
    return "No insights available.";
  }
};