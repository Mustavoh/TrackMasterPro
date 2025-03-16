import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "./layout/Header";
import { 
  AlertTriangle, 
  Shield, 
  AlertCircle, 
  Eye, 
  Check, 
  Bell, 
  ChevronDown,
  Clock
} from "lucide-react";
import { timeAgo } from "@/utils/format";

// Mock alerts data structure (in production this would come from the API)
interface Alert {
  id: string;
  userId: number;
  username: string;
  type: "sensitive_data" | "unusual_behavior" | "security";
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  isRead: boolean;
}

export default function Alerts() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Fetch alerts
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['/api/alerts', { severity: selectedSeverity !== "all" ? selectedSeverity : undefined, type: selectedType !== "all" ? selectedType : undefined, page: currentPage }],
  });
  
  // Since our API might not be fully implemented yet, we'll use some sample data
  // In a real implementation, this would come from the API
  const mockAlerts: Alert[] = [
    {
      id: "1",
      userId: 1,
      username: "john.doe",
      type: "sensitive_data",
      message: "Credit card information detected in clipboard content",
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      severity: "high",
      isRead: false
    },
    {
      id: "2",
      userId: 2,
      username: "alice.smith",
      type: "unusual_behavior",
      message: "Unusual login time detected: 3:15 AM local time",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      severity: "medium",
      isRead: false
    },
    {
      id: "3",
      userId: 3,
      username: "robert.johnson",
      type: "security",
      message: "Multiple failed login attempts from IP 192.168.1.45",
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      severity: "high",
      isRead: true
    },
    {
      id: "4",
      userId: 1,
      username: "john.doe",
      type: "sensitive_data",
      message: "SSN pattern detected in keystroke sequence",
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      severity: "medium",
      isRead: true
    },
    {
      id: "5",
      userId: 4,
      username: "emma.davis",
      type: "unusual_behavior",
      message: "Unusual keystroke rhythm detected for user",
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      severity: "low",
      isRead: false
    },
  ];
  
  // Filter alerts based on selected criteria
  const filterAlerts = (alerts: Alert[]) => {
    return alerts.filter(alert => {
      if (selectedSeverity !== "all" && alert.severity !== selectedSeverity) return false;
      if (selectedType !== "all" && alert.type !== selectedType) return false;
      return true;
    });
  };
  
  // Use the API data if available, otherwise use mock data
  const alerts = alertsData?.alerts || mockAlerts;
  const filteredAlerts = filterAlerts(alerts);
  
  // Get the icon for alert type
  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case "sensitive_data":
        return <Shield className="h-5 w-5 text-blue-400" />;
      case "unusual_behavior":
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case "security":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Get the color for alert severity
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-500";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500";
      case "low":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };
  
  // Mark an alert as read
  const markAsRead = (alertId: string) => {
    // In a real implementation, this would call an API to update the alert
    console.log(`Mark alert ${alertId} as read`);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Security Alerts" />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Alerts</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <select 
                  className="bg-primary border border-gray-700 rounded px-3 py-1 text-sm appearance-none pr-8"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              
              <div className="relative">
                <select 
                  className="bg-primary border border-gray-700 rounded px-3 py-1 text-sm appearance-none pr-8"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="sensitive_data">Sensitive Data</option>
                  <option value="unusual_behavior">Unusual Behavior</option>
                  <option value="security">Security</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-700">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No alerts found matching your criteria</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 hover:bg-primary-light transition-colors ${!alert.isRead ? 'bg-primary-light/30' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type, alert.severity)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {alert.message}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAlertSeverityColor(alert.severity)}`}>
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-sm text-gray-400 flex items-center">
                          <span className="inline-flex items-center text-sm mr-3">
                            <span className="h-6 w-6 rounded-full bg-secondary-dark text-white flex items-center justify-center mr-1.5 text-xs">
                              {alert.username.charAt(0).toUpperCase()}
                            </span>
                            {alert.username}
                          </span>
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {timeAgo(alert.timestamp)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className="text-secondary hover:text-secondary-light text-sm flex items-center"
                            onClick={() => {}}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                          {!alert.isRead && (
                            <button 
                              className="text-gray-400 hover:text-white text-sm flex items-center"
                              onClick={() => markAsRead(alert.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {filteredAlerts.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing <span className="font-medium">{filteredAlerts.length}</span> alerts
              </div>
              <div className="flex space-x-1">
                <button 
                  className="px-3 py-1 rounded bg-primary text-gray-400 hover:bg-primary-light"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button 
                  className="px-3 py-1 rounded bg-secondary text-white"
                >
                  {currentPage}
                </button>
                <button 
                  className="px-3 py-1 rounded bg-primary text-gray-400 hover:bg-primary-light"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
