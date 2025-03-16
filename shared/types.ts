export interface LogEntry {
  id: number;
  timestamp: string;
  user: string;
  ip: string;
  type: "Keystroke" | "Screenshot" | "Clipboard";
  data: string;
  avgSpeed?: string;
}

export interface KeystrokeSession {
  id: number;
  timestamp: string;
  startTime: string;
  endTime: string;
  user: string;
  ip: string;
  keystrokes: string;
  avgSpeed: string;
}

export interface User {
  id: number;
  username: string;
  lastActive?: string;
  isAdmin: boolean;
}

export interface ActivityItem {
  id: number;
  type: "keystroke" | "screenshot" | "clipboard" | "login";
  user: string;
  timestamp: string;
  timeAgo: string;
  data: string;
  ip: string;
}

export interface StatCard {
  title: string;
  value: number | string;
  change: number;
  status: "increase" | "decrease";
  icon: string;
  color: "success" | "secondary" | "warning" | "danger";
  liveText: string;
}

export interface ChartDataPoint {
  date: string;
  keystrokes: number;
  clipboard: number;
  screenshots: number;
}

export interface UserDistribution {
  username: string;
  percentage: number;
  color: string;
}

export interface AIAnalysisResult {
  id: number;
  username: string;
  analysisType: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  findings: Array<{
    title: string;
    description: string;
    severity: "success" | "warning" | "danger";
    icon: string;
  }>;
  recommendations: string[];
  riskLevel: "Low Risk" | "Medium Risk" | "High Risk";
  riskPercentage: number;
  generatedAt: string;
}

export interface AIChat {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}
