import { Groq } from 'groq-sdk';
import { timeAgo } from '@shared/utils';

// Initialize Groq client
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

class AIService {
  async analyzeKeystrokeData(
    username: string,
    keystrokeData: any[],
    startDate: string,
    endDate: string
  ) {
    try {
      // Prepare the data for analysis
      const formattedKeystrokeData = keystrokeData.map(session => ({
        timestamp: session.timestamp,
        keystrokes: session.data,
        avgSpeed: session.avgSpeed
      }));
      
      const prompt = `
        You are a cybersecurity analyst examining user keystroke data.
        Analyze the following data for user "${username}" from ${startDate} to ${endDate}:
        
        ${JSON.stringify(formattedKeystrokeData, null, 2)}
        
        Provide a detailed analysis with the following sections:
        1. Unusual typing patterns (if any)
        2. Authentication and login patterns
        3. Potential sensitive data exposure
        4. Specific recommendations based on your findings
        5. A risk assessment (Low, Medium, or High)
        
        Format your response as a structured JSON with these fields:
        - findings: Array of objects with {title, description, severity (success/warning/danger), icon (just the name of an appropriate icon)}
        - recommendations: Array of strings
        - riskLevel: "Low Risk", "Medium Risk", or "High Risk"
        - riskPercentage: 0-100 number representing risk level
      `;
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 4000,
      });
      
      const responseText = completion.choices[0]?.message?.content || "{}";
      
      // Parse the JSON response
      try {
        // Extract JSON from the response, handling any text before or after
        const jsonRegex = /{[\s\S]*}/;
        const jsonMatch = responseText.match(jsonRegex);
        
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0]);
          
          // Add metadata
          return {
            ...analysisResult,
            username,
            analysisType: "keystroke",
            dateRangeStart: startDate,
            dateRangeEnd: endDate,
            generatedAt: new Date().toISOString()
          };
        } else {
          throw new Error("Could not extract JSON from AI response");
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        return {
          findings: [{
            title: "Error Analyzing Data",
            description: "The AI was unable to properly analyze this data. Please try again.",
            severity: "danger",
            icon: "alert-circle"
          }],
          recommendations: ["Try analyzing a smaller data set"],
          riskLevel: "Medium Risk",
          riskPercentage: 50,
          username,
          analysisType: "keystroke",
          dateRangeStart: startDate,
          dateRangeEnd: endDate,
          generatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error("Error analyzing keystroke data:", error);
      throw error;
    }
  }
  
  async answerQuestion(analysisContext: any, question: string) {
    try {
      const prompt = `
        You are a cybersecurity AI assistant analyzing user activity data.
        Here is the context of the analysis you've performed:
        
        ${JSON.stringify(analysisContext, null, 2)}
        
        The user asks: "${question}"
        
        Please provide a detailed and helpful response focusing only on explaining the data and findings.
        Do not make up information that isn't presented in the context.
      `;
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192",
        temperature: 0.3,
        max_tokens: 1000,
      });
      
      return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response at this time.";
    } catch (error) {
      console.error("Error answering question:", error);
      return "I'm sorry, there was an error processing your question. Please try again later.";
    }
  }
}

export const aiService = new AIService();
