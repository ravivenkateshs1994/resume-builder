import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in .env.local");
}

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const AI_MODEL = "gemini-3.1-flash-lite";

/**
 * Simple helper — sends a text prompt and returns the response text.
 */
export async function generate(prompt: string, temperature = 0.7): Promise<string> {
  const response = await genai.models.generateContent({
    model: AI_MODEL,
    contents: prompt,
    config: { temperature },
  });
  return response.text ?? "";
}

/**
 * Multimodal helper — accepts text + base64 image data URLs.
 * Used by the resume parser to read formatted PDF pages.
 */
export async function generateWithImages(
  textPrompt: string,
  imageDataUrls: string[],
  temperature = 0
): Promise<string> {
  const parts: Parameters<typeof genai.models.generateContent>[0]["contents"] =
    imageDataUrls.length > 0
      ? [
          ...imageDataUrls.map((url) => {
            const [meta, data] = url.split(",");
            const mimeType = meta.replace("data:", "").replace(";base64", "") as "image/jpeg" | "image/png" | "image/webp";
            return { inlineData: { mimeType, data } };
          }),
          { text: textPrompt },
        ]
      : textPrompt;

  const response = await genai.models.generateContent({
    model: AI_MODEL,
    contents: parts,
    config: { temperature },
  });
  return response.text ?? "";
}

