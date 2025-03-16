import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AIAnalysisResult, AIChat } from "@shared/types";

export function useAIAnalysis() {
  const [analysisConfig, setAnalysisConfig] = useState({
    username: "",
    analysisType: "keystroke",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult | null>(null);
  const [chat, setChat] = useState<AIChat[]>([]);
  const [question, setQuestion] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Run AI analysis
  const analysisMutation = useMutation({
    mutationFn: async (config: typeof analysisConfig) => {
      const response = await apiRequest("POST", "/api/ai/analyze", config);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      // Reset chat when new analysis is performed
      setChat([]);
      
      toast({
        title: "Analysis Complete",
        description: `Analysis for ${data.username} completed successfully`,
      });
    },
    onError: (error) => {
      console.error("Error performing AI analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to perform AI analysis. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Chat with AI assistant
  const chatMutation = useMutation({
    mutationFn: async (data: { question: string; analysisContext: any }) => {
      const response = await apiRequest("POST", "/api/ai/chat", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Remove typing indicator if exists
      setChat(prevChat => prevChat.filter(msg => !msg.isTyping));
      
      // Add assistant response
      setChat(prevChat => [
        ...prevChat,
        { role: "assistant", content: data.answer }
      ]);
    },
    onError: (error) => {
      console.error("Error in AI chat:", error);
      // Remove typing indicator
      setChat(prevChat => prevChat.filter(msg => !msg.isTyping));
      
      // Add error message
      setChat(prevChat => [
        ...prevChat,
        { 
          role: "assistant", 
          content: "I'm sorry, I encountered an error processing your question. Please try again." 
        }
      ]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get a response from the AI. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update analysis configuration
  const updateConfig = (newConfig: Partial<typeof analysisConfig>) => {
    setAnalysisConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  };
  
  // Run analysis with current config
  const runAnalysis = () => {
    if (!analysisConfig.username) {
      toast({
        title: "Configuration Error",
        description: "Please select a user before running analysis",
        variant: "destructive"
      });
      return;
    }
    
    analysisMutation.mutate(analysisConfig);
  };
  
  // Submit a chat question
  const submitQuestion = (userQuestion: string) => {
    if (!userQuestion.trim() || !analysisResults) {
      return;
    }
    
    // Add user question to chat
    setChat(prevChat => [
      ...prevChat,
      { role: "user", content: userQuestion }
    ]);
    
    // Add typing indicator
    setChat(prevChat => [
      ...prevChat,
      { role: "assistant", content: "", isTyping: true }
    ]);
    
    // Clear input
    setQuestion("");
    
    // Send question to backend
    chatMutation.mutate({
      question: userQuestion,
      analysisContext: analysisResults
    });
  };
  
  // Export analysis results as JSON
  const exportAnalysis = () => {
    if (!analysisResults) {
      toast({
        title: "No Data",
        description: "There are no analysis results to export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const jsonString = JSON.stringify(analysisResults, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ai-analysis-${analysisResults.username}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Analysis results exported successfully",
      });
    } catch (error) {
      console.error("Error exporting analysis:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export analysis results",
        variant: "destructive"
      });
    }
  };
  
  return {
    analysisConfig,
    updateConfig,
    runAnalysis,
    isAnalyzing: analysisMutation.isPending,
    analysisResults,
    chat,
    question,
    setQuestion,
    submitQuestion,
    isChatLoading: chatMutation.isPending,
    exportAnalysis
  };
}
