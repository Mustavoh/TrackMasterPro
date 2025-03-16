
import { Groq } from 'groq-sdk';
import { timeAgo } from '@shared/utils';
import { mongoDbService } from './mongodb.service';

// Initialize Groq client
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

class AIService {
  async analyzeKeystrokeData(
    username: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // Get logs in batches to handle large datasets
      const BATCH_SIZE = 100;
      let allLogs = [];
      let skip = 0;
      
      while (true) {
        const batch = await mongoDbService.db.collection('logs')
          .find({
            user: username,
            timestamp: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          })
          .skip(skip)
          .limit(BATCH_SIZE)
          .toArray();

        if (batch.length === 0) break;
        allLogs = allLogs.concat(batch);
        skip += BATCH_SIZE;
      }

      console.log(`AI analyzing data for ${username}, ${allLogs.length} entries`);
      
      // Check what types of logs we have
      const logTypes = new Set(allLogs.map(log => log.type));
      console.log(`Log types found: ${Array.from(logTypes).join(', ')}`);
      
      // Prepare the data for analysis based on log types present
      let formattedData: any = [];
      let analysisType = "activity"; // Default
      
      if (logTypes.has("Keystroke")) {
        const keystrokeData = logData.filter(log => log.type === "Keystroke");
        formattedData = keystrokeData.map(session => ({
          timestamp: session.timestamp,
          keystrokes: session.data,
          avgSpeed: session.avgSpeed
        }));
        analysisType = "keystroke";
      } else if (logTypes.has("Screenshot")) {
        const screenshotData = logData.filter(log => log.type === "Screenshot");
        formattedData = screenshotData.map(screenshot => ({
          timestamp: screenshot.timestamp,
          type: "Screenshot"
        }));
        analysisType = "screenshot";
      } else if (logTypes.has("Clipboard")) {
        const clipboardData = logData.filter(log => log.type === "Clipboard");
        formattedData = clipboardData.map(clipboard => ({
          timestamp: clipboard.timestamp,
          content: clipboard.data
        }));
        analysisType = "clipboard";
      } else {
        // Mixed or other data types
        formattedData = logData.map(log => ({
          timestamp: log.timestamp,
          type: log.type,
          data: log.type === "Keystroke" ? log.data.substring(0, 100) + "..." : log.data
        }));
      }
      
      // Create appropriate prompt based on analysis type
      let prompt = "";
      
      if (analysisType === "keystroke") {
        prompt = `
          You are a cybersecurity analyst examining user keystroke data.
          Analyze the following data for user "${username}" from ${startDate} to ${endDate}:
          
          ${JSON.stringify(formattedData, null, 2)}
          
          Provide a detailed analysis with the following sections:
          1. Unusual typing patterns (if any)
          2. Authentication and login patterns
          3. Potential sensitive data exposure
          4. Specific recommendations based on your findings
          5. A risk assessment (Low, Medium, or High)
        `;
      } else if (analysisType === "screenshot") {
        prompt = `
          You are a cybersecurity analyst examining user screenshot activity.
          Analyze the following screenshot timestamps for user "${username}" from ${startDate} to ${endDate}:
          
          ${JSON.stringify(formattedData, null, 2)}
          
          Provide a detailed analysis with the following sections:
          1. Screenshot frequency patterns
          2. Time of day patterns
          3. Potential security concerns
          4. Specific recommendations based on your findings
          5. A risk assessment (Low, Medium, or High)
        `;
      } else if (analysisType === "clipboard") {
        prompt = `
          You are a cybersecurity analyst examining user clipboard data.
          Analyze the following clipboard content for user "${username}" from ${startDate} to ${endDate}:
          
          ${JSON.stringify(formattedData, null, 2)}
          
          Provide a detailed analysis with the following sections:
          1. Types of clipboard content
          2. Potential sensitive data exposure
          3. Security implications
          4. Specific recommendations based on your findings
          5. A risk assessment (Low, Medium, or High)
        `;
      } else {
        prompt = `
          You are a cybersecurity analyst examining user activity data.
          Analyze the following mixed activity data for user "${username}" from ${startDate} to ${endDate}:
          
          ${JSON.stringify(formattedData, null, 2)}
          
          Provide a detailed analysis with the following sections:
          1. Activity patterns and frequency
          2. Time of day patterns
          3. Security implications
          4. Specific recommendations based on your findings
          5. A risk assessment (Low, Medium, or High)
        `;
      }
      
      // Add common formatting instructions to prompt
      prompt += `
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
            analysisType: analysisType,
            dateRangeStart: startDate,
            dateRangeEnd: endDate,
            generatedAt: new Date().toISOString()
          };
        }
        
        throw new Error("Could not extract JSON from AI response");
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
          analysisType: analysisType,
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
