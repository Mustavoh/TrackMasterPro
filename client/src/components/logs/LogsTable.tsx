import { useState } from "react";
import { Eye, Copy, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useScreenshot } from "@/hooks/useScreenshot";
import ScreenshotModal from "@/components/ScreenshotModal";
import { truncateText } from "@/utils/format";

interface Log {
  id: string;
  timestamp: string;
  user: string;
  ip: string;
  type: string;
  data: string;
  screenshotData?: string;
}

interface LogsTableProps {
  logs: Log[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export default function LogsTable({ 
  logs,
  currentPage,
  totalPages,
  setCurrentPage
}: LogsTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  
  const { 
    isModalOpen, 
    selectedScreenshot, 
    openScreenshotModal, 
    closeScreenshotModal 
  } = useScreenshot();
  
  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Get icon for log type
  const getTypeIcon = (type: string) => {
    const iconMap = {
      Keystroke: "bg-secondary/10 text-secondary",
      Screenshot: "bg-warning/10 text-warning",
      Clipboard: "bg-danger/10 text-danger"
    };
    
    return iconMap[type as keyof typeof iconMap] || "bg-gray-700/10 text-gray-400";
  };
  
  // Handle view screenshot
  const handleViewScreenshot = (log: Log) => {
    if (log.type === 'Screenshot' && log.screenshotData) {
      openScreenshotModal({
        id: log.id,
        timestamp: log.timestamp,
        user: log.user,
        screenshotData: log.screenshotData
      });
    }
  };
  
  // Format date for display
  const formatDate = (date: string) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString()
    };
  };
  
  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 data-grid">
          <thead className="bg-primary">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center">
                  Time
                  {sortColumn === 'timestamp' && (
                    <ChevronDown className={`h-4 w-4 ml-1 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('user')}
              >
                <div className="flex items-center">
                  User
                  {sortColumn === 'user' && (
                    <ChevronDown className={`h-4 w-4 ml-1 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('ip')}
              >
                <div className="flex items-center">
                  IP Address
                  {sortColumn === 'ip' && (
                    <ChevronDown className={`h-4 w-4 ml-1 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {sortColumn === 'type' && (
                    <ChevronDown className={`h-4 w-4 ml-1 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  Content
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-primary-dark divide-y divide-gray-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const { date, time } = formatDate(log.timestamp);
                return (
                  <tr 
                    key={log.id} 
                    className="row hover:bg-primary-light transition-colors"
                    onClick={() => log.type === 'Screenshot' && handleViewScreenshot(log)}
                    onMouseEnter={() => setHoveredRowId(log.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    style={{ cursor: log.type === 'Screenshot' ? 'pointer' : 'default' }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="font-medium">{date}</span>
                        <span className="ml-1 text-gray-400">{time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="h-6 w-6 rounded-full bg-secondary-dark text-white flex items-center justify-center mr-2 text-xs">
                          {log.user.charAt(0).toUpperCase()}
                        </span>
                        {log.user}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {log.ip}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeIcon(log.type)}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-md truncate relative">
                      <div className="has-tooltip">
                        <span className={`tooltip bg-gray-900 text-white text-xs rounded py-1 px-2 -mt-10 ${hoveredRowId === log.id ? 'visible' : 'invisible'}`}>
                          {log.data}
                        </span>
                        {truncateText(log.data, 50)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex space-x-2">
                        <button className="text-gray-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-white">
                          <Copy className="h-4 w-4" />
                        </button>
                        {log.type === "Clipboard" && (
                          <button className="text-gray-400 hover:text-warning">
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{logs.length}</span> of <span className="font-medium">1,284</span> entries
        </div>
        <div className="flex space-x-1">
          <button 
            className="px-3 py-1 rounded bg-primary text-gray-400 hover:bg-primary-light"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => (
            <button 
              key={i + 1}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-secondary text-white' : 'bg-primary text-gray-400 hover:bg-primary-light'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            className="px-3 py-1 rounded bg-primary text-gray-400 hover:bg-primary-light"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {isModalOpen && <ScreenshotModal screenshot={selectedScreenshot} onClose={closeScreenshotModal} />}
    </>
  );
}
