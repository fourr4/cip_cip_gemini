import React from 'react';
import { Download, FileJson, FileSpreadsheet, Clipboard } from 'lucide-react';

interface DownloadProps {
  data?: Record<string, any> | Array<any>;
  isLoading?: boolean;
}

export const DownloadData: React.FC<DownloadProps> = ({ data, isLoading = false }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('Data copied to clipboard!');
  };

  if (isLoading || !data) {
    return (
      <div className="p-4 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="mt-4">
          <div className="h-5 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="bg-white dark:bg-gray-900 p-2 rounded">
            <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
        <Download className="inline-block mr-2 mb-1" size={20} />
        Download File
      </h2>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => downloadAsJSON(data)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <FileJson className="mr-2" size={18} />
          <span>Download JSON</span>
        </button>
        
        <button
          onClick={() => downloadAsCSV(data)}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <FileSpreadsheet className="mr-2" size={18} />
          <span>Download CSV</span>
        </button>
        
        <button
          onClick={copyToClipboard}
          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <Clipboard className="mr-2" size={18} />
          <span>Copy to Clipboard</span>
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Data Preview
        </h3>
        <pre className="bg-white dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-60 text-sm border border-gray-200 dark:border-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Download functions remain the same
const downloadAsJSON = (data: Record<string, any> | Array<any>) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);
};

const downloadAsCSV = (data: Record<string, any> | Array<any>) => {
  const csvRows = [];
  
  // Extract data if the data is wrapped in the 'data' key
  if (data && 'data' in data) {
    data = data['data'];
  }

  // Function to flatten nested objects
  const flattenObject = (obj: Record<string, any>, prefix: string = '') => {
    let result: Record<string, any> = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flattenObject(value, newKey)); // Recursively flatten nested object
        } else {
          result[newKey] = value;
        }
      }
    }
    return result;
  };

  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object') {
      // Flatten each object and collect headers
      const flattenedData = data.map(item => flattenObject(item));
      const headers = Object.keys(flattenedData[0]);
      csvRows.push(headers.join(','));

      // Add data rows
      flattenedData.forEach(item => {
        const values = headers.map(header => {
          const value = item[header];
          return JSON.stringify(value ?? '').replace(/"/g, '""');
        });
        csvRows.push(values.join(','));
      });
    } else {
      // If data is not an array of objects, handle it simply
      csvRows.push('Value');
      data.forEach(item => {
        csvRows.push(JSON.stringify(item ?? '').replace(/"/g, '""'));
      });
    }
  } else {
    const flattenedData = flattenObject(data);
    const headers = Object.keys(flattenedData);
    csvRows.push(headers.join(','));

    const values = headers.map(header => {
      const value = flattenedData[header];
      return JSON.stringify(value ?? '').replace(/"/g, '""');
    });
    csvRows.push(values.join(','));
  }

  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.csv';
  a.click();
  URL.revokeObjectURL(url);
};


export default DownloadData;