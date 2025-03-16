import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "./layout/Header";
import { 
  BarChart2, 
  PieChart, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Download,
  ChevronDown
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsP, Pie, Cell } from 'recharts';

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  
  // Fetch activity chart data
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/charts/activity', timeRange === "day" ? 1 : timeRange === "week" ? 7 : 30],
  });
  
  // Fetch analytics data for summary stats and user distribution
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['/api/analytics'],
  });
  
  // Generate hourly activity data (this would ideally come from the server)
  const generateHourlyData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hour: `${hour}:00`,
      activity: Math.floor(Math.random() * 100)
    }));
  };
  
  const hourlyData = generateHourlyData();
  
  // Process user distribution data for pie chart
  const processUserDistribution = () => {
    if (!analyticsData?.userDistribution) return [];
    
    const colors = ['#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return analyticsData.userDistribution.map((user: any, index: number) => ({
      name: user.username,
      value: user.percentage,
      color: colors[index % colors.length]
    }));
  };
  
  const userDistribution = processUserDistribution();
  
  // Calculate the daily averages from activity data
  const calculateDailyAverages = () => {
    if (!activityData?.length) return { keystrokes: 0, screenshots: 0, clipboard: 0 };
    
    const totalKeystrokes = activityData.reduce((sum: number, day: any) => sum + day.keystrokes, 0);
    const totalScreenshots = activityData.reduce((sum: number, day: any) => sum + day.screenshots, 0);
    const totalClipboard = activityData.reduce((sum: number, day: any) => sum + day.clipboard, 0);
    
    return {
      keystrokes: Math.round(totalKeystrokes / activityData.length),
      screenshots: Math.round(totalScreenshots / activityData.length),
      clipboard: Math.round(totalClipboard / activityData.length)
    };
  };
  
  const dailyAverages = calculateDailyAverages();
  
  // Loading state
  if (isLoadingActivity || isLoadingAnalytics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  // Export statistics as CSV
  const handleExportStats = () => {
    if (!activityData) return;
    
    const headers = ['Date', 'Keystrokes', 'Screenshots', 'Clipboard'];
    const rows = activityData.map((day: any) => [
      day.date,
      day.keystrokes,
      day.screenshots,
      day.clipboard
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `monitoring-statistics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Statistics" />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Daily Average Keystrokes</h3>
                <p className="text-2xl font-semibold text-white">{dailyAverages.keystrokes}</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Based on {timeRange} data</span>
            </div>
          </div>
          
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Daily Average Screenshots</h3>
                <p className="text-2xl font-semibold text-white">{dailyAverages.screenshots}</p>
              </div>
              <div className="bg-warning/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Based on {timeRange} data</span>
            </div>
          </div>
          
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Daily Average Clipboard</h3>
                <p className="text-2xl font-semibold text-white">{dailyAverages.clipboard}</p>
              </div>
              <div className="bg-danger/10 p-3 rounded-full">
                <PieChart className="h-6 w-6 text-danger" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Based on {timeRange} data</span>
            </div>
          </div>
        </div>
        
        {/* Activity Over Time Chart */}
        <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Activity Over Time</h3>
            <div className="flex space-x-2">
              <button 
                className={`px-2 py-1 text-xs rounded ${timeRange === "day" ? "bg-secondary text-white" : "bg-primary text-gray-400 hover:bg-primary-light"}`}
                onClick={() => setTimeRange("day")}
              >
                Day
              </button>
              <button 
                className={`px-2 py-1 text-xs rounded ${timeRange === "week" ? "bg-secondary text-white" : "bg-primary text-gray-400 hover:bg-primary-light"}`}
                onClick={() => setTimeRange("week")}
              >
                Week
              </button>
              <button 
                className={`px-2 py-1 text-xs rounded ${timeRange === "month" ? "bg-secondary text-white" : "bg-primary text-gray-400 hover:bg-primary-light"}`}
                onClick={() => setTimeRange("month")}
              >
                Month
              </button>
              <button 
                onClick={handleExportStats}
                className="px-2 py-1 text-xs rounded bg-primary text-gray-400 hover:bg-primary-light flex items-center"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="p-4">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={(value) => {
                      // Format the date for better display
                      const date = new Date(value);
                      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    }}  
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0F172A", 
                      border: "1px solid #334155",
                      borderRadius: "0.375rem"
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="keystrokes" 
                    stroke="#38BDF8" 
                    activeDot={{ r: 8 }} 
                    name="Keystrokes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="screenshots" 
                    stroke="#10B981" 
                    name="Screenshots"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clipboard" 
                    stroke="#F59E0B" 
                    name="Clipboard"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* User Activity and Hourly Activity Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Activity Distribution */}
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-medium">User Activity Distribution</h3>
            </div>
            <div className="p-4">
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsP>
                    <Pie
                      data={userDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{ 
                        backgroundColor: "#0F172A", 
                        border: "1px solid #334155",
                        borderRadius: "0.375rem"
                      }}
                    />
                  </RechartsP>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
                {userDistribution.map((user, index) => (
                  <div key={index} className="flex items-center">
                    <span 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: user.color }}
                    ></span>
                    <span className="text-xs">{user.name} ({user.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Hourly Activity Chart */}
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-medium">Hourly Activity Distribution</h3>
            </div>
            <div className="p-4">
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#0F172A", 
                        border: "1px solid #334155",
                        borderRadius: "0.375rem"
                      }} 
                    />
                    <Bar dataKey="activity" fill="#38BDF8" name="Activity Level" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center text-sm text-gray-400">
                <p>Peak activity hours: 9:00 - 11:00 and 14:00 - 16:00</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
