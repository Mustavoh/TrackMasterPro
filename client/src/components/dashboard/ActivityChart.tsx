import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  keystrokes: number;
  screenshots: number;
  clipboard: number;
}

interface ActivityChartProps {
  data: ChartDataPoint[];
  selectedTimeRange: "day" | "week" | "month";
  setSelectedTimeRange: (range: "day" | "week" | "month") => void;
}

export default function ActivityChart({ 
  data, 
  selectedTimeRange, 
  setSelectedTimeRange 
}: ActivityChartProps) {
  // Format the date for display in the chart
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));
  
  // Calculate totals for the summary stats
  const totalKeystrokes = formattedData.reduce((sum, item) => sum + item.keystrokes, 0);
  const totalScreenshots = formattedData.reduce((sum, item) => sum + item.screenshots, 0);
  const totalClipboard = formattedData.reduce((sum, item) => sum + item.clipboard, 0);
  
  return (
    <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium">Activity Over Time</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-2 py-1 text-xs rounded ${selectedTimeRange === "day" ? "bg-secondary text-white" : "bg-primary text-gray-400 hover:bg-primary-light"}`}
            onClick={() => setSelectedTimeRange("day")}
          >
            Day
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded ${selectedTimeRange === "week" ? "bg-secondary text-white" : "bg-primary text-gray-400 hover:bg-primary-light"}`}
            onClick={() => setSelectedTimeRange("week")}
          >
            Week
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded ${selectedTimeRange === "month" ? "bg-secondary text-white" : "bg-primary text-gray-400 hover:bg-primary-light"}`}
            onClick={() => setSelectedTimeRange("month")}
          >
            Month
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={formattedData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0F172A", 
                  border: "1px solid #334155",
                  borderRadius: "0.375rem"
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="keystrokes" 
                stroke="#38BDF8" 
                activeDot={{ r: 8 }} 
                name="Keystrokes"
              />
              <Line 
                type="monotone" 
                dataKey="screenshots" 
                stroke="#10B981" 
                name="Screenshots"
              />
              <Line 
                type="monotone" 
                dataKey="clipboard" 
                stroke="#F59E0B" 
                name="Clipboard"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Keystrokes</div>
            <div className="text-lg font-semibold text-secondary">
              {totalKeystrokes > 1000 
                ? `${(totalKeystrokes / 1000).toFixed(1)}k` 
                : totalKeystrokes}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Clipboard</div>
            <div className="text-lg font-semibold text-warning">{totalClipboard}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Screenshots</div>
            <div className="text-lg font-semibold text-success">{totalScreenshots}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
