'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricChartProps {
  instanceId: string;
  metricName: string;
  displayName: string;
  hours?: number;
  color?: string;
  format?: (value: number) => string;
  type?: 'line' | 'area';
}

export function MetricChart({ 
  instanceId, 
  metricName, 
  displayName, 
  hours = 24, 
  color = '#8b5cf6',
  format = (v) => v.toFixed(0),
  type = 'area'
}: MetricChartProps) {
  const [data, setData] = useState<{ time: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/system/metrics/history?instanceId=${instanceId}&metricName=${metricName}&hours=${hours}`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const result = await response.json();
        if (result.success && result.data.history.length > 0) {
          const history = result.data.history;
          
          // Format data for chart
          const chartData = history.map((item: { timestamp: string; value: number }) => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            }),
            value: item.value
          }));
          
          setData(chartData);
          
          // Calculate trend
          if (history.length > 1) {
            const recent = history[history.length - 1].value;
            const previous = history[0].value;
            const change = ((recent - previous) / previous) * 100;
            
            setCurrentValue(recent);
            setChangePercent(change);
            
            if (change > 1) setTrend('up');
            else if (change < -1) setTrend('down');
            else setTrend('stable');
          }
        }
      } catch (error) {
        console.error('Error fetching metric history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [instanceId, metricName, hours]);

  if (loading) {
    return (
      <div className="bg-fd-card border border-fd-border rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-fd-muted rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-fd-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-fd-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-fd-card border border-fd-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-fd-muted-foreground mb-2">{displayName}</h3>
        <p className="text-sm text-fd-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-fd-card border border-fd-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-fd-muted-foreground">{displayName}</h3>
        <div className="flex items-center gap-2">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          {trend === 'stable' && <Minus className="w-4 h-4 text-fd-muted-foreground" />}
          <span className={`text-xs ${
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-red-500' : 
            'text-fd-muted-foreground'
          }`}>
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {currentValue !== null && (
        <div className="text-2xl font-bold mb-4">{format(currentValue)}</div>
      )}
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                fontSize={10}
                tickFormatter={(value) => value}
              />
              <YAxis 
                stroke="#666"
                fontSize={10}
                tickFormatter={format}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)' 
                }}
                formatter={(value: number) => format(value)}
              />
              <Line
                dataKey="value"
                stroke={color}
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                fontSize={10}
                tickFormatter={(value) => value}
              />
              <YAxis 
                stroke="#666"
                fontSize={10}
                tickFormatter={format}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)' 
                }}
                formatter={(value: number) => format(value)}
              />
              <Area
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}