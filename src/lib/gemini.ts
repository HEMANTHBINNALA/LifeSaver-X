import { GoogleGenerativeAI } from "@google/generative-ai";

export async function askGemini<T>(prompt: string, fallback: T): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful fallback to deterministic engine
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        text: `You are an AI productivity engine. You must respond in valid JSON matching the requested structure if JSON is requested, otherwise return a clear concise response.\n\n${prompt}`,
      },
    ]);

    const responseText = result.response.text();
    if (!responseText) return fallback;

    // Try parsing as JSON if fallback is an object
    if (typeof fallback === "object" && fallback !== null) {
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        return { ...fallback, ...parsed };
      } catch {
        return fallback;
      }
    }

    return responseText as unknown as T;
  } catch (error) {
    console.warn("Gemini API call failed, using deterministic fallback:", error);
    return fallback;
  }
}
