import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "./layout/Header";
import { User, Clock, ArrowUpRight, LogIn, Shield, EyeOff } from "lucide-react";
import { timeAgo } from "@/utils/format";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch analytics for user activity
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
  });
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Filter users based on search term
  const filteredUsers = users?.filter((user: any) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Get user activity percentage from analytics
  const getUserActivity = (username: string) => {
    if (!analytics?.userDistribution) return 0;
    const userStats = analytics.userDistribution.find((u: any) => u.username === username);
    return userStats?.percentage || 0;
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Users" onSearch={handleSearch} />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="text-lg font-medium">Monitored Users</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-400">
                No users found matching your search criteria
              </div>
            ) : (
              filteredUsers.map((user: any) => (
                <div key={user.id} className="bg-primary rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-secondary-dark text-white flex items-center justify-center mr-3">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">{user.username}</h4>
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Last active: {user.lastActive ? timeAgo(user.lastActive) : "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button className="p-1.5 rounded-full bg-primary-light text-gray-300 hover:text-white">
                        <EyeOff className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-full bg-primary-light text-gray-300 hover:text-white">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Activity Level</span>
                      <span className="font-medium">{getUserActivity(user.username)}%</span>
                    </div>
                    <div className="w-full bg-primary-light rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full" 
                        style={{ width: `${getUserActivity(user.username)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-primary-light rounded p-2">
                      <div className="flex items-center text-xs text-gray-400 mb-1">
                        <LogIn className="h-3 w-3 mr-1" />
                        <span>Sessions</span>
                      </div>
                      <div className="text-lg font-semibold">38</div>
                    </div>
                    <div className="bg-primary-light rounded p-2">
                      <div className="flex items-center text-xs text-gray-400 mb-1">
                        <Shield className="h-3 w-3 mr-1" />
                        <span>Risk Score</span>
                      </div>
                      <div className="text-lg font-semibold text-warning">Medium</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 bg-secondary hover:bg-secondary-light text-white text-sm py-1.5 rounded">
                      View Logs
                    </button>
                    <button className="flex-1 bg-primary-light hover:bg-gray-700 text-gray-200 text-sm py-1.5 rounded">
                      View Screenshots
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
