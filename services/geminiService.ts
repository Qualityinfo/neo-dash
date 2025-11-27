import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Level, ObstacleType } from "../types";
import { NEON_COLORS } from "../constants";

export const generateLevel = async (prompt: string): Promise<Level> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  const obstacleSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: [ObstacleType.SPIKE, ObstacleType.BLOCK, ObstacleType.FLYING_SPIKE],
        description: "The type of obstacle. SPIKE kills on touch. BLOCK can be landed on. FLYING_SPIKE is in the air."
      },
      xOffset: {
        type: Type.INTEGER,
        description: "The horizontal distance in pixels from the PREVIOUS obstacle. Must be between 200 and 600 to be playable."
      },
      yLevel: {
        type: Type.INTEGER,
        description: "The vertical grid height. 0 is ground level. 1 is one block up. 2 is two blocks up."
      }
    },
    required: ["type", "xOffset", "yLevel"]
  };

  const levelSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "A cool, neon-cyberpunk name for the level" },
      description: { type: Type.STRING, description: "Short flavor text" },
      themeColor: { type: Type.STRING, description: "Hex color code for the level theme" },
      speed: { type: Type.NUMBER, description: "Player speed, usually between 5 (slow) and 9 (fast)" },
      data: {
        type: Type.ARRAY,
        items: obstacleSchema,
        description: "A sequence of at least 20 obstacles making up the level track."
      }
    },
    required: ["name", "description", "themeColor", "speed", "data"]
  };

  const systemInstruction = `
    You are a level designer for a rhythm-based platformer game like Geometry Dash.
    Create exciting, playable levels. 
    Ensure jumps are possible. 
    Use 'xOffset' to space obstacles out; a standard jump covers about 150-250 pixels horizontally. 
    Blocks should be placed to allow platforming. 
    Spikes should be placed on the ground or on blocks.
    Return only valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a level based on this description: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: levelSchema,
        temperature: 0.7, // Slightly creative
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const levelData = JSON.parse(text) as Level;
    
    // Fallback if color isn't provided or invalid
    if (!levelData.themeColor || !levelData.themeColor.startsWith('#')) {
        levelData.themeColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    }

    return levelData;
  } catch (error) {
    console.error("Gemini Level Generation Error:", error);
    // Return a fallback basic level on error
    return {
      name: "Fallback Fields",
      description: "Gemini couldn't reach the server, so here is a local backup.",
      speed: 6,
      themeColor: "#00f3ff",
      data: [
        { type: ObstacleType.SPIKE, xOffset: 500, yLevel: 0 },
        { type: ObstacleType.BLOCK, xOffset: 300, yLevel: 0 },
        { type: ObstacleType.SPIKE, xOffset: 400, yLevel: 0 },
        { type: ObstacleType.BLOCK, xOffset: 300, yLevel: 0 },
        { type: ObstacleType.BLOCK, xOffset: 40, yLevel: 1 }, // Stair
        { type: ObstacleType.SPIKE, xOffset: 300, yLevel: 0 },
        { type: ObstacleType.BLOCK, xOffset: 300, yLevel: 1 },
        { type: ObstacleType.FLYING_SPIKE, xOffset: 200, yLevel: 0 },
        { type: ObstacleType.SPIKE, xOffset: 400, yLevel: 0 },
      ]
    };
  }
};
