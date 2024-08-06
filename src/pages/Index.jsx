import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import DataVisualization from '../components/DataVisualization';

const Index = () => {
  const [data, setData] = useState({ revenue: null, cost: null });
  const [error, setError] = useState(null);

  const parseCSV = (file) => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        complete: (results) => resolve(results.data),
        header: true,
      });
    });
  };

  const parseXLSX = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet);
        resolve(parsedData);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const onDrop = async (acceptedFiles) => {
    setError(null);
    const revenueFile = acceptedFiles.find(file => file.name.toLowerCase().includes('revenue'));
    const costFile = acceptedFiles.find(file => file.name.toLowerCase().includes('cost'));

    if (!revenueFile || !costFile) {
      setError("Please upload both revenue and cost files.");
      return;
    }

    const parseFile = async (file) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'csv') {
        return parseCSV(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        return parseXLSX(file);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    };

    try {
      const [revenueData, costData] = await Promise.all([
        parseFile(revenueFile),
        parseFile(costFile)
      ]);
      setData({ revenue: revenueData, cost: costData });
    } catch (err) {
      setError(`Error parsing files: ${err.message}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Financial Data Visualization Tool</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">How to Upload Your Data</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Prepare two separate files: one for revenue data and one for cost data.</li>
          <li>Ensure the file names include "revenue" and "cost" respectively (e.g., "company_revenue_2023.xlsx", "annual_cost_data.csv").</li>
          <li>Files can be in CSV, XLSX, or XLS format.</li>
          <li>Drag and drop both files into the upload area below, or click to select them from your file system.</li>
        </ol>
      </div>
      
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop revenue and cost files here, or click to select files</p>
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
