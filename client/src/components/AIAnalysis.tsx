import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "./layout/Header";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, Database, UserCheck, AlertTriangle, Send, CheckCircle, XCircle, Download } from "lucide-react";
import { format } from "date-fns";

export default function AIAnalysis() {
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>("activity");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [question, setQuestion] = useState<string>("");
  const [chat, setChat] = useState<Array<{role: string, content: string}>>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  // Fetch users for dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Initialize selectedUser when users are loaded
  useEffect(() => {
    if (users && users.length > 0 && !selectedUser) {
      setSelectedUser(users[0].username);
    }
  }, [users, selectedUser]);
  
  // Analyze data mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/analyze', data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      // Reset chat when new analysis is performed
      setChat([]);
    }
  });
  
  // Chat with AI mutation
  const chatMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai/chat', data);
      return response.json();
    },
    onSuccess: (data) => {
      setChat(prevChat => [...prevChat, { role: "assistant", content: data.answer }]);
    }
  });
  
  // Handle analysis run
  const handleRunAnalysis = () => {
    if (!selectedUser) return;
    
    analyzeMutation.mutate({
      username: selectedUser,
      analysisType: selectedAnalysisType,
      startDate,
      endDate
    });
  };
  
  // Handle chat submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !analysisResults) return;
    
    // Add user question to chat
    setChat(prevChat => [...prevChat, { role: "user", content: question }]);
    
    // Send question to backend
    chatMutation.mutate({
      question,
      analysisContext: analysisResults
    });
    
    // Clear input
    setQuestion("");
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };
  
  // Loading state
  if (isLoadingUsers) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="AI Analysis" />
      
      <main className="flex-1 overflow-auto bg-primary p-4 scrollbar-thin">
        <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="text-lg font-medium">AI Behavioral Analysis</h3>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Analysis Type</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  className={`${selectedAnalysisType === "activity" ? "bg-secondary text-white" : "bg-primary hover:bg-primary-light text-gray-200"} px-4 py-2 rounded-md text-sm flex items-center justify-center`}
                  onClick={() => setSelectedAnalysisType("activity")}
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Activity Analysis
                </button>
                <button 
                  className={`${selectedAnalysisType === "keystroke" ? "bg-secondary text-white" : "bg-primary hover:bg-primary-light text-gray-200"} px-4 py-2 rounded-md text-sm flex items-center justify-center`}
                  onClick={() => setSelectedAnalysisType("keystroke")}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Keystroke Analysis
                </button>
                <button 
                  className={`${selectedAnalysisType === "behavior" ? "bg-secondary text-white" : "bg-primary hover:bg-primary-light text-gray-200"} px-4 py-2 rounded-md text-sm flex items-center justify-center`}
                  onClick={() => setSelectedAnalysisType("behavior")}
                >
                  <UserCheck className="h-5 w-5 mr-2" />
                  Behavior Patterns
                </button>
                <button 
                  className={`${selectedAnalysisType === "threat" ? "bg-secondary text-white" : "bg-primary hover:bg-primary-light text-gray-200"} px-4 py-2 rounded-md text-sm flex items-center justify-center`}
                  onClick={() => setSelectedAnalysisType("threat")}
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Threat Detection
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select User</label>
              <div className="relative">
                <select 
                  className="block w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm appearance-none"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Select a user</option>
                  {users?.map((user: any) => (
                    <option key={user.id} value={user.username}>{user.username}</option>
                  ))}
                </select>
                <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input 
                    type="date" 
                    className="block w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <input 
                    type="date" 
                    className="block w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="text-right">
              <button 
                className={`bg-secondary hover:bg-secondary-light text-white font-medium py-2 px-4 rounded-md text-sm flex items-center ml-auto ${analyzeMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={handleRunAnalysis}
                disabled={analyzeMutation.isPending || !selectedUser}
              >
                <Database className="h-5 w-5 mr-2" />
                {analyzeMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>
        </div>

        {analyzeMutation.isPending && (
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-300">Analyzing user data, please wait...</p>
          </div>
        )}

        {analysisResults && (
          <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium">Analysis Results</h3>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-white">
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex space-x-3 items-start mb-6">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 bg-primary p-4 rounded-lg shadow-inner-light">
                  <h4 className="text-sm font-medium mb-2">AI Analysis Summary</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    Based on analysis of <span className="text-secondary font-medium">{analysisResults.username}</span>'s keystroke patterns from <span className="text-gray-200 font-medium">{format(new Date(analysisResults.dateRangeStart), "MMMM d, yyyy")}</span> to <span className="text-gray-200 font-medium">{format(new Date(analysisResults.dateRangeEnd), "MMMM d, yyyy")}</span>, the following patterns have been identified:
                  </p>
                  
                  <div className="space-y-4">
                    {analysisResults.findings.map((finding: any, index: number) => (
                      <div key={index} className="bg-primary-light p-3 rounded">
                        <h5 className="text-sm font-medium mb-1 flex items-center">
                          {finding.severity === "warning" && <AlertTriangle className="h-4 w-4 text-warning mr-1" />}
                          {finding.severity === "danger" && <XCircle className="h-4 w-4 text-danger mr-1" />}
                          {finding.severity === "success" && <CheckCircle className="h-4 w-4 text-success mr-1" />}
                          {finding.title}
                        </h5>
                        <p className="text-sm text-gray-300">
                          {finding.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                      {analysisResults.recommendations.map((recommendation: string, index: number) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium">Risk Assessment</h4>
                        <div className={`ml-2 px-2 py-1 ${
                          analysisResults.riskLevel === "High Risk" 
                            ? "bg-danger/20 text-danger" 
                            : analysisResults.riskLevel === "Medium Risk"
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                        } text-xs rounded-full`}>
                          {analysisResults.riskLevel}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Generated on {formatTimestamp(analysisResults.generatedAt)}
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-primary-light rounded-full h-2.5">
                      <div 
                        className={`${
                          analysisResults.riskLevel === "High Risk" 
                            ? "bg-danger" 
                            : analysisResults.riskLevel === "Medium Risk"
                              ? "bg-warning"
                              : "bg-success"
                        } h-2.5 rounded-full`} 
                        style={{ width: `${analysisResults.riskPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-3">Ask AI Assistant</h4>
                <div className="border-b border-gray-700 pb-4 mb-4">
                  <form onSubmit={handleChatSubmit}>
                    <label className="sr-only">Your question</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="block w-full rounded-md border border-gray-700 shadow-sm py-2 px-3 bg-primary text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm" 
                        placeholder="Ask a question about this data..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                      <button 
                        type="submit"
                        className={`bg-secondary hover:bg-secondary-light text-white px-4 py-2 rounded-md text-sm flex-shrink-0 ${chatMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={chatMutation.isPending || !question.trim()}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="space-y-4">
                  {chat.map((message, index) => (
                    <div key={index} className="flex space-x-3 items-start">
                      <div className={`w-8 h-8 rounded-full ${message.role === "user" ? "bg-primary-light" : "bg-secondary"} text-white flex items-center justify-center flex-shrink-0`}>
                        {message.role === "user" ? (
                          <span className="text-sm">You</span>
                        ) : (
                          <Database className="h-5 w-5" />
                        )}
                      </div>
                      <div className={`flex-1 ${message.role === "user" ? "bg-primary-light" : "bg-primary shadow-inner-light"} p-3 rounded-lg`}>
                        <p className={`text-sm ${message.role === "user" ? "text-white" : "text-gray-300"}`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {chatMutation.isPending && (
                    <div className="flex space-x-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                        <Database className="h-5 w-5" />
                      </div>
                      <div className="flex-1 bg-primary p-3 rounded-lg shadow-inner-light">
                        <div className="flex space-x-2 items-center">
                          <div className="h-2 w-2 bg-secondary rounded-full animate-pulse"></div>
                          <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                          <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
