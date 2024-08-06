import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DataVisualization = ({ revenueData, costData }) => {
  const [selectedSources, setSelectedSources] = useState({ revenue: [], cost: [] });
  const [outliers, setOutliers] = useState({ revenue: [], cost: [] });

  const sources = useMemo(() => ({
    revenue: Object.keys(revenueData[0]).filter(key => key !== 'Source' && key.trim() !== ''),
    cost: Object.keys(costData[0]).filter(key => key !== 'Source' && key.trim() !== ''),
  }), [revenueData, costData]);

  const prepareChartData = (data, type) => {
    return data.flatMap(row => 
      Object.entries(row)
        .filter(([key]) => key !== 'Source' && selectedSources[type].includes(key))
        .map(([month, value]) => ({
          month,
          [row.Source]: parseFloat(value) || 0,
          type,
        }))
    ).reduce((acc, curr) => {
      const existingEntry = acc.find(item => item.month === curr.month);
      if (existingEntry) {
        return acc.map(item => 
          item.month === curr.month 
            ? { ...item, ...curr } 
            : item
        );
      }
      return [...acc, curr];
    }, []);
  };

  const chartData = useMemo(() => {
    const revenueChartData = prepareChartData(revenueData, 'revenue');
    const costChartData = prepareChartData(costData, 'cost');
    return [...revenueChartData, ...costChartData].sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [revenueData, costData, selectedSources]);

  const findOutliers = (data, type) => {
    const values = data.flatMap(row => 
      Object.entries(row)
        .filter(([key]) => key !== 'Source')
        .map(([_, value]) => parseFloat(value) || 0)
    );

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length);

    const threshold = 2; // Number of standard deviations to consider as an outlier

    const newOutliers = data.flatMap(row =>
      Object.entries(row)
        .filter(([key, value]) => {
          if (key === 'Source') return false;
          const numValue = parseFloat(value);
          return Math.abs(numValue - mean) > threshold * stdDev;
        })
        .map(([month, value]) => ({ source: row.Source, month, value: parseFloat(value) }))
    );

    setOutliers(prev => ({ ...prev, [type]: newOutliers }));
  };

  const handleSourceChange = (value, type) => {
    setSelectedSources(prev => ({ ...prev, [type]: Array.isArray(value) ? value : [value] }));
  };

  return (
    <div>
      <div className="mb-4 flex space-x-4">
        <Select
          onValueChange={(value) => handleSourceChange(value, 'revenue')}
          value={selectedSources.revenue}
          multiple
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Revenue Sources" />
          </SelectTrigger>
          <SelectContent>
            {sources.revenue.map(source => (
              <SelectItem key={source} value={source || 'default'}>{source || 'Default'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => handleSourceChange(value, 'cost')}
          value={selectedSources.cost}
          multiple
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Cost Sources" />
          </SelectTrigger>
          <SelectContent>
            {sources.cost.map(source => (
              <SelectItem key={source} value={source || 'default'}>{source || 'Default'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => findOutliers(revenueData, 'revenue')}>Find Revenue Outliers</Button>
        <Button onClick={() => findOutliers(costData, 'cost')}>Find Cost Outliers</Button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedSources.revenue.map(source => (
            <Line key={`revenue-${source}`} type="monotone" dataKey={source} stroke="#8884d8" />
          ))}
          {selectedSources.cost.map(source => (
            <Line key={`cost-${source}`} type="monotone" dataKey={source} stroke="#82ca9d" />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {(outliers.revenue.length > 0 || outliers.cost.length > 0) && (
        <Alert className="mt-4">
          <AlertTitle>Outliers Detected</AlertTitle>
          <AlertDescription>
            {outliers.revenue.map(({ source, month, value }) => (
              <div key={`revenue-${source}-${month}`}>Revenue outlier: {source} - {month}: {value}</div>
            ))}
            {outliers.cost.map(({ source, month, value }) => (
              <div key={`cost-${source}-${month}`}>Cost outlier: {source} - {month}: {value}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DataVisualization;
