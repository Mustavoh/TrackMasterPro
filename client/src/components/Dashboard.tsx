import { useQuery } from "@tanstack/react-query";
import Header from "./layout/Header";
import StatusCard from "./dashboard/StatusCard";
import ActivityFeed from "./dashboard/ActivityFeed";
import ActivityChart from "./dashboard/ActivityChart";
import UserDistributionChart from "./dashboard/UserDistributionChart";
import LogsTable from "./logs/LogsTable";
import { useState } from "react";
import { Activity, AlertTriangle, Users, Image } from "lucide-react";

export default function Dashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<"day" | "week" | "month">("week");
  const [selectedUser, setSelectedUser] = useState<string>("All Users");
  const [selectedLogType, setSelectedLogType] = useState<string>("All Types");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['/api/analytics'],
  });
  
  // Fetch recent activity
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/activity', 5],
  });
  
  // Fetch activity chart data
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['/api/charts/activity', selectedTimeRange === "day" ? 1 : selectedTimeRange === "week" ? 7 : 30],
  });
  
  // Fetch logs data for the table
  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/logs', { limit: 5, page: 1 }],
  });
  
  // Loading state
  if (isLoadingAnalytics || isLoadingActivity || isLoadingChart || isLoadingLogs) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Dashboard" />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatusCard 
            title="Active Users"
            value={analyticsData?.activeUsers || 0}
            change={2}
            status="increase"
            icon={<Users className="h-6 w-6 text-success" />}
            color="success"
            liveText={`${analyticsData?.activeUsers || 0} users active now`}
          />
          
          <StatusCard 
            title="Keystroke Sessions"
            value={analyticsData?.keystrokeSessions || 0}
            change={152}
            status="increase"
            icon={<Activity className="h-6 w-6 text-secondary" />}
            color="secondary"
            liveText="32 new sessions today"
          />
          
          <StatusCard 
            title="Screenshots"
            value={analyticsData?.screenshots || 0}
            change={47}
            status="increase"
            icon={<Image className="h-6 w-6 text-warning" />}
            color="warning"
            liveText="11 captured in last hour"
          />
          
          <StatusCard 
            title="Security Alerts"
            value={7}
            change={3}
            status="increase"
            icon={<AlertTriangle className="h-6 w-6 text-danger" />}
            color="danger"
            liveText="2 high priority alerts"
          />
        </div>
        
        {/* Activity and Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ActivityFeed activities={activityData || []} />
          
          <div className="grid grid-cols-1 gap-6">
            <ActivityChart 
              data={chartData || []} 
              selectedTimeRange={selectedTimeRange}
              setSelectedTimeRange={setSelectedTimeRange}
            />
            
            <UserDistributionChart
              data={analyticsData?.userDistribution || []}
            />
          </div>
        </div>
        
        {/* Recent Logs Table */}
        <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Recent Logs</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <select 
                  className="bg-primary border border-gray-700 rounded px-3 py-1 text-sm appearance-none pr-8"
                  value={selectedLogType}
                  onChange={(e) => setSelectedLogType(e.target.value)}
                >
                  <option>All Types</option>
                  <option>Keystroke</option>
                  <option>Screenshot</option>
                  <option>Clipboard</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              <div className="relative">
                <select 
                  className="bg-primary border border-gray-700 rounded px-3 py-1 text-sm appearance-none pr-8"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option>All Users</option>
                  {analyticsData?.userDistribution?.map((user: any) => (
                    <option key={user.username}>{user.username}</option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
          
          <LogsTable 
            logs={logsData?.logs || []} 
            totalPages={logsData?.pagination?.totalPages || 1}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
}
