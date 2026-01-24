import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: Missing Gemini API Key. Make sure EXPO_PUBLIC_GEMINI_API_KEY is in your .env file.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const getCoachAdvice = async (userActivities: any[], userQuestion: string) => {
  if (!genAI) {
    return "Configuration Error: AI Service is missing the API Key. Please check your settings.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const activitySummary = userActivities.length > 0 
      ? userActivities.map(a => 
          `- ${a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : 'Recent'}: ${a.athleteName} did ${a.duration} mins of ${a.name || 'training'} at Intensity ${a.intensity}/10. (Est. Burn: ${a.calories || 'N/A'} cal)`
        ).join('\n')
      : "No recent workout data available.";

    const prompt = `
      You are an elite sports physiologist and injury prevention coach named "Coach IQ".
      
      CONTEXT - ATHLETE'S RECENT DATA:
      ${activitySummary}

      USER'S QUESTION: "${userQuestion}"

      INSTRUCTIONS:
      1. Use the data provided to give specific, evidence-based advice.
      2. If the user asks about calories, use the "Est. Burn" numbers in the data.
      3. Look for high intensity (8-10) combined with high duration as injury risks.
      4. Keep your response conversational, encouraging, but concise (under 4 sentences).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "I'm having trouble connecting to the coaching server right now. Please check your internet connection.";
  }
};
