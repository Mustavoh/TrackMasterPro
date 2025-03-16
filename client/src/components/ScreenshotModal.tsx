import { X, Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

interface Screenshot {
  id: string;
  timestamp: string;
  user: string;
  screenshotData: string;
  resolution?: string;
}

interface ScreenshotModalProps {
  screenshot: Screenshot | null;
  onClose: () => void;
}

export default function ScreenshotModal({ screenshot, onClose }: ScreenshotModalProps) {
  const [imageData, setImageData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (screenshot?.screenshotData) {
      // Convert base64 to image URL
      try {
        setImageData(`data:image/png;base64,${screenshot.screenshotData}`);
      } catch (error) {
        console.error("Error loading screenshot:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [screenshot]);
  
  // Format the timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };
  
  // Handle download screenshot
  const handleDownload = () => {
    if (!imageData) return;
    
    const a = document.createElement('a');
    a.href = imageData;
    a.download = `screenshot-${screenshot?.user}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  if (!screenshot) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center dialog">
      <div className="max-w-4xl mx-auto bg-primary-dark rounded-lg shadow-xl dialog-content">
        <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Screenshot from {screenshot.user} - {formatTimestamp(screenshot.timestamp)}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <img src={imageData} className="w-full rounded" alt="Screenshot full view" />
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-700 flex justify-between">
          <div className="text-sm text-gray-400">
            <span className="font-medium">Resolution:</span> {screenshot.resolution || "Unknown"}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleDownload}
              className="px-3 py-1 text-sm rounded bg-secondary text-white flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
            <button className="px-3 py-1 text-sm rounded bg-primary text-gray-300 hover:bg-primary-light flex items-center">
              <Share className="h-4 w-4 mr-1" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
