import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import DataVisualization from '../components/DataVisualization';

const Index = () => {
  const [data, setData] = useState({ revenue: null, cost: null });
  const [error, setError] = useState(null);

  const onDrop = (acceptedFiles) => {
    setError(null);
    const revenueFile = acceptedFiles.find(file => file.name.toLowerCase().includes('revenue'));
    const costFile = acceptedFiles.find(file => file.name.toLowerCase().includes('cost'));

    if (!revenueFile || !costFile) {
      setError("Please upload both revenue and cost CSV files.");
      return;
    }

    const parseFile = (file, type) => {
      Papa.parse(file, {
        complete: (results) => {
          setData(prevData => ({ ...prevData, [type]: results.data }));
        },
        header: true,
      });
    };

    parseFile(revenueFile, 'revenue');
    parseFile(costFile, 'cost');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: '.csv' });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Financial Data Visualization Tool</h1>
      
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop revenue and cost CSV files here, or click to select files</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.revenue && data.cost && (
        <DataVisualization revenueData={data.revenue} costData={data.cost} />
      )}
    </div>
  );
};

export default Index;
