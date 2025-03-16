import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { mongoDbService } from "./services/mongodb.service";
import { encryptionService } from "./services/encryption.service";
import { aiService } from "./services/ai.service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all logs (keystroke, screenshot, clipboard)
  app.get("/api/logs", async (req: Request, res: Response) => {
    try {
      const logs = await mongoDbService.getAllLogs();
      
      // Apply filtering based on query params
      const { type, user, limit, page } = req.query;
      
      let filteredLogs = logs;
      
      if (type) {
        filteredLogs = filteredLogs.filter(log => log.type === type);
      }
      
      if (user) {
        filteredLogs = filteredLogs.filter(log => log.user === user);
      }
      
      // Pagination
      const pageSize = limit ? parseInt(limit as string) : 50;
      const currentPage = page ? parseInt(page as string) : 1;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filteredLogs.length / pageSize);
      
      res.json({
        logs: paginatedLogs,
        pagination: {
          total: filteredLogs.length,
          currentPage,
          totalPages,
          pageSize
        }
      });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  
  // Get a specific screenshot by ID
  app.get("/api/screenshots/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const screenshot = await mongoDbService.getScreenshotById(id);
      
      if (!screenshot) {
        return res.status(404).json({ message: "Screenshot not found" });
      }
      
      res.json(screenshot);
    } catch (error) {
      console.error("Error fetching screenshot:", error);
      res.status(500).json({ message: "Failed to fetch screenshot" });
    }
  });
  
  // Get dashboard analytics data
  app.get("/api/analytics", async (req: Request, res: Response) => {
    try {
      const analytics = await mongoDbService.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  
  // Get recent activity for dashboard
  app.get("/api/activity", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const activity = await mongoDbService.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // Get activity over time chart data
  app.get("/api/charts/activity", async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const chartData = await mongoDbService.getActivityOverTime(days);
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });
  
  // AI Analysis endpoints
  app.post("/api/ai/analyze", async (req: Request, res: Response) => {
    try {
      const { username, analysisType, startDate, endDate } = req.body;
      
      if (!username || !analysisType || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Get the relevant data based on analysis type
      let dataToAnalyze: any[] = [];
      
      if (analysisType === "keystroke") {
        const allLogs = await mongoDbService.getAllLogs();
        dataToAnalyze = allLogs.filter(log => 
          log.user === username && 
          log.type === "Keystroke" &&
          new Date(log.timestamp) >= new Date(startDate) &&
          new Date(log.timestamp) <= new Date(endDate)
        );
      }
      
      if (dataToAnalyze.length === 0) {
        return res.status(404).json({ message: "No data found for the selected criteria" });
      }
      
      const analysisResult = await aiService.analyzeKeystrokeData(
        username,
        dataToAnalyze,
        startDate,
        endDate
      );
      
      res.json(analysisResult);
    } catch (error) {
      console.error("Error performing AI analysis:", error);
      res.status(500).json({ message: "Failed to perform AI analysis" });
    }
  });
  
  // AI Chat endpoint
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { question, analysisContext } = req.body;
      
      if (!question || !analysisContext) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const answer = await aiService.answerQuestion(analysisContext, question);
      
      res.json({ answer });
    } catch (error) {
      console.error("Error processing AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });
  
  // Get users (list of unique usernames from logs)
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const analytics = await mongoDbService.getAnalytics();
      const userDistribution = analytics.userDistribution || [];
      
      // Convert to the required format
      const users = userDistribution.map(user => ({
        id: user.username,
        username: user.username,
        lastActive: new Date().toISOString() // This would need to come from actual data
      }));
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
