import { useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  Home, 
  FileText, 
  Users, 
  Cpu, 
  BarChart2, 
  Bell, 
  Settings,
  Lock
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const [location, setLocation] = useLocation();
  
  const handleNavigation = (path: string, section: string) => {
    setLocation(path);
    setActiveSection(section);
  };
  
  const navItems = [
    { id: "dashboard", path: "/", label: "Dashboard", icon: Home },
    { id: "logs", path: "/logs", label: "Logs", icon: FileText },
    { id: "users", path: "/users", label: "Users", icon: Users },
    { id: "ai-analysis", path: "/ai-analysis", label: "AI Analysis", icon: Cpu, hasNotification: true },
    { id: "statistics", path: "/statistics", label: "Statistics", icon: BarChart2 },
    { id: "alerts", path: "/alerts", label: "Alerts", icon: Bell },
  ];
  
  return (
    <div className="w-64 h-full bg-primary-dark flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CyberSentrix 3.0</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pt-3 scrollbar-thin">
        <div className="px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path, item.id)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeSection === item.id
                  ? "text-white bg-secondary"
                  : "text-gray-300 hover:bg-primary-light hover:text-white"
              } relative`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
              {item.hasNotification && (
                <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="border-t border-gray-700 p-4">
        <button 
          onClick={() => handleNavigation("/settings", "settings")}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
            activeSection === "settings"
              ? "text-white bg-secondary"
              : "text-gray-300 hover:bg-primary-light hover:text-white"
          }`}
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </button>
      </div>
    </div>
  );
}
