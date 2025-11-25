
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeocodedResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const geocodeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    lat: { type: Type.NUMBER, description: "Latitude of the address" },
    lng: { type: Type.NUMBER, description: "Longitude of the address" },
  },
  required: ["lat", "lng"],
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Uses Gemini to infer coordinates from a Hong Kong address.
 */
export const getCoordinatesFromAddress = async (address: string, clinicName: string, retries = 2): Promise<GeocodedResult | null> => {
  const prompt = `
    I need the precise latitude and longitude for the following clinic in Hong Kong.
    
    Clinic Name: ${clinicName}
    Address: ${address}
    
    If the address is in Chinese, please translate internally to find the location.
    Provide the coordinates for the specific building.
    
    Return ONLY the JSON object.
  `;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: geocodeSchema,
          temperature: 0.1,
        },
      });

      let text = response.text;
      if (!text) return null;
      
      // Clean potential markdown formatting
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const data = JSON.parse(text) as GeocodedResult;
      
      // Loose bounding box for Hong Kong
      if (data.lat > 22.1 && data.lat < 22.6 && data.lng > 113.8 && data.lng < 114.5) {
          return data;
      }
      // If coordinates are wildly off, treat as failure
      return null;

    } catch (error: any) {
      console.warn(`Geocoding attempt ${attempt + 1} failed for ${clinicName}:`, error);
      
      // If it's a rate limit (429) or server error (5xx), wait and retry
      if (error.status === 429 || (error.status && error.status >= 500)) {
         if (attempt < retries) {
            const backoff = 1000 * Math.pow(2, attempt);
            await delay(backoff);
            continue;
         }
      }
      // If it's other error, return null
      if (attempt === retries) return null;
    }
  }
  return null;
};
