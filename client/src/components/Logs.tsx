import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "./layout/Header";
import LogsTable from "./logs/LogsTable";
import { ChevronDown, Download } from "lucide-react";

export default function Logs() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [logType, setLogType] = useState<string>("All Types");
  const [selectedUser, setSelectedUser] = useState<string>("All Users");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Fetch logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['/api/logs', { type: logType !== "All Types" ? logType : undefined, user: selectedUser !== "All Users" ? selectedUser : undefined, page: currentPage, limit: 50 }],
  });
  
  // Fetch users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Reset to first page when searching
    setCurrentPage(1);
  };
  
  // Export logs as CSV
  const handleExport = () => {
    if (!logsData?.logs?.length) return;
    
    // Convert logs to CSV format
    const headers = ['Timestamp', 'User', 'IP', 'Type', 'Content'];
    const rows = logsData.logs.map((log: any) => [
      log.timestamp,
      log.user,
      log.ip,
      log.type,
      log.data
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logs-export-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <Header title="Logs" onSearch={handleSearch} />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium">Logs</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <select 
                  className="bg-primary border border-gray-700 rounded px-3 py-1 text-sm appearance-none pr-8"
                  value={logType}
                  onChange={(e) => {
                    setLogType(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option>All Users</option>
                  {usersData?.map((user: any) => (
                    <option key={user.id}>{user.username}</option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              <button 
                className="bg-secondary hover:bg-secondary-light text-white px-3 py-1 rounded text-sm flex items-center"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          
          <LogsTable 
            logs={logsData?.logs || []} 
            currentPage={currentPage}
            totalPages={logsData?.pagination?.totalPages || 1}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
}
