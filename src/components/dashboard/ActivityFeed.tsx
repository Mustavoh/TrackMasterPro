import { useState } from "react";
import { Filter, MoreVertical, Edit, Camera, Shield, LogIn } from "lucide-react";
import { timeAgo } from "../../utils/format";
import { truncateText } from "../../utils/format";

interface ActivityItem {
  id: string;
  type: string;
  user: string;
  timestamp: string;
  data: string;
  ip: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  // Get initial letter of username for avatar
  const getUserInitial = (username: string) => {
    return username && username.length > 0 ? username[0].toUpperCase() : "U";
  };
  
  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Keystroke":
        return <Edit className="h-4 w-4" />;
      case "Screenshot":
        return <Camera className="h-4 w-4" />;
      case "Clipboard":
        return <Shield className="h-4 w-4" />;
      default:
        return <LogIn className="h-4 w-4" />;
    }
  };
  
  // Get background color for icon container
  const getIconBgColor = (type: string) => {
    switch (type) {
      case "Keystroke":
        return "bg-secondary-dark";
      case "Screenshot":
        return "bg-warning-dark";
      case "Clipboard":
        return "bg-danger-dark";
      default:
        return "bg-success-dark";
    }
  };
  
  // Get activity title
  const getActivityTitle = (type: string) => {
    switch (type) {
      case "Keystroke":
        return "Keystroke session detected";
      case "Screenshot":
        return "Screenshot captured";
      case "Clipboard":
        return "Clipboard content detected";
      default:
        return "New user activity session";
    }
  };
  
  return (
    <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium">Recent Activity</h3>
        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-white">
            <Filter className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-white">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin">
        {activities.length === 0 ? (
          <div className="text-center text-gray-400 py-6">
            No recent activity to display
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start mb-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getIconBgColor(activity.type)} text-white flex items-center justify-center mr-3 mt-1`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium">{getActivityTitle(activity.type)}</h4>
                  <span className="text-xs text-gray-400">{timeAgo(activity.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-400 mb-1">
                  User <span className={`text-${activity.type === "Keystroke" ? "secondary" : activity.type === "Screenshot" ? "warning" : "danger"}`}>{activity.user}</span> at <span className={`text-${activity.type === "Keystroke" ? "secondary" : activity.type === "Screenshot" ? "warning" : "danger"}`}>{activity.ip}</span>
                </p>
                
                {activity.type === "Keystroke" && (
                  <pre className="bg-primary/50 p-2 rounded text-xs font-mono scrollbar-thin whitespace-pre-wrap">
                    {truncateText(activity.data, 150)}
                  </pre>
                )}
                
                {activity.type === "Screenshot" && (
                  <div className="bg-primary/50 p-1 rounded">
                    <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center text-gray-400">
                      <Camera className="h-5 w-5 mr-2" /> Screenshot Available (click to view)
                    </div>
                  </div>
                )}
                
                {activity.type === "Clipboard" && (
                  <div className="bg-primary/50 p-2 rounded text-xs font-mono scrollbar-thin whitespace-pre-wrap">
                    {truncateText(activity.data, 150)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-700">
        <button className="text-sm text-secondary hover:text-secondary-light flex items-center">
          View all activity
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
