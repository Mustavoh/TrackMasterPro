import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface UserDistribution {
  username: string;
  percentage: number;
}

interface UserDistributionChartProps {
  data: UserDistribution[];
}

export default function UserDistributionChart({ data }: UserDistributionChartProps) {
  // Colors for the chart segments
  const COLORS = ['#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  // Process data
  const chartData = data.map((item, index) => ({
    name: item.username,
    value: item.percentage,
    color: COLORS[index % COLORS.length]
  }));
  
  // Sort by percentage in descending order
  chartData.sort((a, b) => b.value - a.value);
  
  // If we have more than 4 users, combine the smallest ones into "Others"
  let processedData = chartData;
  if (chartData.length > 4) {
    const topUsers = chartData.slice(0, 3);
    const others = chartData.slice(3);
    
    const othersSum = others.reduce((sum, item) => sum + item.value, 0);
    
    processedData = [
      ...topUsers,
      {
        name: 'Others',
        value: othersSum,
        color: COLORS[3]
      }
    ];
  }
  
  return (
    <div className="bg-primary-dark rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-medium">User Activity Distribution</h3>
      </div>
      <div className="p-4">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${value}%`}
                contentStyle={{ 
                  backgroundColor: "#0F172A", 
                  border: "1px solid #334155",
                  borderRadius: "0.375rem"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {processedData.map((user, index) => (
            <div key={index} className="flex items-center">
              <span 
                className="h-3 w-3 rounded-full mr-2" 
                style={{ backgroundColor: user.color }}
              ></span>
              <span className="text-xs">{user.name} ({user.value}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
