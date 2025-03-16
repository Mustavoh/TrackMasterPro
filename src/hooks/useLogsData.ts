import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LogEntry } from "@shared/types";

export function useLogsData(initialFilter: {
  type?: string;
  user?: string;
  page?: number;
  limit?: number;
} = {}) {
  const [filter, setFilter] = useState({
    type: initialFilter.type || "All Types",
    user: initialFilter.user || "All Users",
    page: initialFilter.page || 1,
    limit: initialFilter.limit || 50
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Prepare API query parameters
  const getQueryParams = () => {
    const params: {
      type?: string;
      user?: string;
      page: number;
      limit: number;
    } = {
      page: filter.page,
      limit: filter.limit
    };
    
    if (filter.type && filter.type !== "All Types") {
      params.type = filter.type;
    }
    
    if (filter.user && filter.user !== "All Users") {
      params.user = filter.user;
    }
    
    return params;
  };
  
  // Fetch logs with current filter
  const {
    data: logsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/logs', getQueryParams()],
  });
  
  // Fetch all users for user filter dropdown
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch analytics data for statistics
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/analytics'],
  });
  
  // Delete a log entry
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const response = await apiRequest("DELETE", `/api/logs/${logId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Log entry deleted successfully",
      });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
    },
    onError: (error) => {
      console.error("Error deleting log:", error);
      toast({
        title: "Error",
        description: "Failed to delete log entry",
        variant: "destructive"
      });
    }
  });
  
  // Export logs as CSV
  const exportLogs = () => {
    if (!logsData?.logs?.length) {
      toast({
        title: "No data",
        description: "There are no logs to export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const headers = ['Timestamp', 'User', 'IP', 'Type', 'Content'];
      const rows = logsData.logs.map((log: LogEntry) => [
        log.timestamp,
        log.user,
        log.ip,
        log.type,
        log.data.replace(/,/g, ' ')  // Remove commas to avoid CSV formatting issues
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `monitoring-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Logs exported successfully",
      });
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast({
        title: "Error",
        description: "Failed to export logs",
        variant: "destructive"
      });
    }
  };
  
  // Update filter and refetch data
  const updateFilter = (newFilter: Partial<typeof filter>) => {
    // Reset to page 1 if anything other than page is changed
    const shouldResetPage = Object.keys(newFilter).some(key => key !== 'page');
    
    setFilter(prev => ({
      ...prev,
      ...newFilter,
      page: shouldResetPage ? 1 : (newFilter.page || prev.page)
    }));
  };
  
  return {
    logs: logsData?.logs || [],
    pagination: logsData?.pagination || { total: 0, currentPage: 1, totalPages: 1, pageSize: filter.limit },
    isLoading,
    isError,
    filter,
    updateFilter,
    deleteLog: deleteLogMutation.mutate,
    isDeleting: deleteLogMutation.isPending,
    exportLogs,
    refetchLogs: refetch,
    users,
    analyticsData
  };
}
