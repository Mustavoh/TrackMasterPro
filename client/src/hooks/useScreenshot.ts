import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Screenshot {
  id: string;
  timestamp: string;
  user: string;
  screenshotData: string;
  resolution?: string;
}

export function useScreenshot() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch a specific screenshot by ID
  const getScreenshot = async (id: string) => {
    try {
      const response = await apiRequest("GET", `/api/screenshots/${id}`, undefined);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to load screenshot data",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Open the screenshot modal
  const openScreenshotModal = async (screenshot: Screenshot) => {
    setIsModalOpen(true);
    setSelectedScreenshot(screenshot);
    
    console.log("Opening screenshot modal with data:", screenshot);
    
    // Always try to fetch the full screenshot data, even if we think we have it
    try {
      console.log("Fetching screenshot with ID:", screenshot.id);
      const fullScreenshot = await getScreenshot(screenshot.id);
      console.log("Received full screenshot:", fullScreenshot);
      
      if (fullScreenshot) {
        setSelectedScreenshot(prev => ({
          ...prev!,
          screenshotData: fullScreenshot.screenshotData,
          resolution: fullScreenshot.resolution
        }));
      } else {
        toast({
          title: "Warning",
          description: "Could not fetch full screenshot data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching full screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to load screenshot details",
        variant: "destructive"
      });
    }
  };
  
  // Close the screenshot modal
  const closeScreenshotModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedScreenshot(null), 300); // Clear after animation
  };
  
  // Delete a screenshot
  const deleteScreenshotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/screenshots/${id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Screenshot deleted successfully",
      });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/screenshots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      
      // Close modal if it's currently showing the deleted screenshot
      if (isModalOpen && selectedScreenshot) {
        closeScreenshotModal();
      }
    },
    onError: (error) => {
      console.error("Error deleting screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to delete screenshot",
        variant: "destructive"
      });
    }
  });
  
  // Download a screenshot
  const downloadScreenshot = (screenshot: Screenshot) => {
    if (!screenshot.screenshotData) {
      toast({
        title: "Error",
        description: "Screenshot data not available",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const dataUrl = `data:image/png;base64,${screenshot.screenshotData}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `screenshot-${screenshot.user}-${new Date(screenshot.timestamp).getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Screenshot downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to download screenshot",
        variant: "destructive"
      });
    }
  };
  
  return {
    isModalOpen,
    selectedScreenshot,
    openScreenshotModal,
    closeScreenshotModal,
    deleteScreenshot: deleteScreenshotMutation.mutate,
    isDeleting: deleteScreenshotMutation.isPending,
    downloadScreenshot
  };
}
