import { ReactNode } from "react";

interface StatusCardProps {
  title: string;
  value: number | string;
  change: number;
  status: "increase" | "decrease";
  icon: ReactNode;
  color: "success" | "secondary" | "warning" | "danger";
  liveText: string;
}

const colorMap = {
  success: {
    bg: "bg-green-900/30",
    text: "text-success",
    bgLight: "bg-green-900/10",
  },
  secondary: {
    bg: "bg-blue-900/30",
    text: "text-secondary",
    bgLight: "bg-secondary/5",
  },
  warning: {
    bg: "bg-amber-900/30",
    text: "text-warning",
    bgLight: "bg-amber-900/10",
  },
  danger: {
    bg: "bg-red-900/30",
    text: "text-danger",
    bgLight: "bg-red-900/10",
  },
};

export default function StatusCard({
  title,
  value,
  change,
  status,
  icon,
  color,
  liveText
}: StatusCardProps) {
  const { bg, text, bgLight } = colorMap[color];
  
  // Format numbers if needed
  const formattedValue = typeof value === 'number' && value > 999 
    ? value.toLocaleString() 
    : value;
  
  return (
    <div className="bg-primary-dark rounded-lg shadow-lg overflow-hidden border border-gray-700">
      <div className="p-4">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded ${bg} p-2`}>
            {icon}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-400">{title}</div>
            <div className="text-2xl font-semibold">
              <div className="flex items-center">
                <span>{formattedValue}</span>
                {change > 0 && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full bg-${color}/20 ${text}`}>
                    +{change}
                  </span>
                )}
                {change < 0 && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                    {change}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-2 ${bgLight} px-4 py-1.5 flex items-center text-xs ${text}`}>
        <span className={`h-2 w-2 rounded-full ${text.replace('text', 'bg')} mr-2 live-indicator`}></span>
        <span>{liveText}</span>
      </div>
    </div>
  );
}
