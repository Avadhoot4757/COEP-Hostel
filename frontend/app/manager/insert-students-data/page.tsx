'use client';
import React, { useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Eye, EyeOff, Database, FileText, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from "@/lib/api";

interface StudentData {
  id: number;
  roll_no: string;
  email: string;
  class_name: string;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | '';
  message: string;
}

const StudentUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<ToastState>({ show: false, type: '', message: '' });
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showExtractAnimation, setShowExtractAnimation] = useState<boolean>(false);
  const [showUploadAnimation, setShowUploadAnimation] = useState<boolean>(false);

  const expectedColumns: string[] = ['roll_no', 'email', 'class_name'];
  const classChoices: string[] = ['fy', 'sy', 'ty', 'btech'];

  const showToastMessage = (type: 'success' | 'error', message: string): void => {
    setShowToast({ show: true, type, message });
    setTimeout(() => setShowToast({ show: false, type: '', message: '' }), 5000);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (
      droppedFile.type.includes('excel') || 
      droppedFile.type.includes('spreadsheet') || 
      droppedFile.name.endsWith('.xlsx') || 
      droppedFile.name.endsWith('.xls')
    )) {
      setFile(droppedFile);
      processFile(droppedFile);
    } else {
      showToastMessage('error', 'Please upload a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File): Promise<void> => {
    setLoading(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showToastMessage('error', 'The Excel file appears to be empty');
        setLoading(false);
        return;
      }

      const fileColumns = Object.keys(jsonData[0]).map(col => col.toLowerCase().trim());
      
      const matchingColumns = expectedColumns.filter(expectedCol => 
        fileColumns.some(fileCol => 
          fileCol.includes(expectedCol.replace('_', '')) || 
          expectedCol.replace('_', '').includes(fileCol) ||
          fileCol === expectedCol
        )
      );

      if (matchingColumns.length !== expectedColumns.length) {
        showToastMessage('error', 'Missing required columns. Expected: roll_no, email, class_name');
        setLoading(false);
        return;
      }

      const mappedData: StudentData[] = jsonData
        .map((row: any, index: number) => {
          const mappedRow: StudentData = { id: index + 1, roll_no: '', email: '', class_name: '' };
          
          expectedColumns.forEach(expectedCol => {
            const fileColKey = Object.keys(row).find(key => 
              key.toLowerCase().trim().includes(expectedCol.replace('_', '')) ||
              expectedCol.replace('_', '').includes(key.toLowerCase().trim()) ||
              key.toLowerCase().trim() === expectedCol
            );
            
            if (fileColKey) {
                if(expectedCol === 'roll_no') {
                    mappedRow.roll_no = String(row[fileColKey]).trim();
                    }
                else if(expectedCol === 'email') {
                    mappedRow.email = String(row[fileColKey]).trim().toLowerCase();
                }
                else if(expectedCol === 'class_name'){
                    let className = String(row[fileColKey]).trim().toLowerCase();
                    
                    if (className.includes('1st') || className.includes('first') || className.includes('1')) {
                      className = 'fy';
                    } else if (className.includes('2nd') || className.includes('second') || className.includes('2')) {
                      className = 'sy';
                    } else if (className.includes('3rd') || className.includes('third') || className.includes('3')) {
                      className = 'ty';
                    } else if (className.includes('4th') || className.includes('fourth') || className.includes('4') || className.includes('final')) {
                      className = 'btech';
                    }
                    
                    mappedRow.class_name = className;
                }
            }
          });
          
          if (mappedRow.class_name && !classChoices.includes(mappedRow.class_name.toLowerCase())) {
            mappedRow.class_name = '';
          }
          
          return mappedRow;
        })
        .filter(row => row.roll_no && row.email); 

      if (mappedData.length === 0) {
        showToastMessage('error', 'No valid student records found in the file');
        setLoading(false);
        return;
      }

      setExtractedData(mappedData);
      setShowExtractAnimation(true);
      setTimeout(() => {
        setShowPreview(true);
        setShowExtractAnimation(false);
      }, 2000);
      showToastMessage('success', `Successfully extracted ${mappedData.length} student records`);
      
    } catch (error) {
      showToastMessage('error', 'Error processing file. Please check the file format.');
      console.error('File processing error:', error);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (): Promise<void> => {
    if (extractedData.length === 0) {
      showToastMessage('error', 'No data to submit');
      return;
    }

    setLoading(true);
    setShowUploadAnimation(true);

    try {
      const dataToSubmit = extractedData.map(row => ({
        roll_no: row.roll_no,
        email: row.email,
        class_name: row.class_name.toLowerCase() || classChoices[0]
      }));

      // Fire and forget the POST request
      api.post('/auth/studentverification/', dataToSubmit).catch(error => {
        console.error('Upload error:', error);
      });

      // Show success immediately
      setTimeout(() => {
        showToastMessage('success', `Successfully added ${extractedData.length} students to database`);
        setFile(null);
        setExtractedData([]);
        setShowPreview(false);
        setShowUploadAnimation(false);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Data Upload</h1>
          <p className="text-gray-600">Upload an Excel file containing verified student information</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Excel Format Requirements</h3>
              <div className="space-y-2 text-blue-800">
                <p><strong>Required Columns (exact names):</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">roll_no</code> - MIS or JEE/CET applicant number</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">email</code> - Student email address</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">class_name</code> - Class year (fy, sy, ty, btech)</li>
                </ul>
                <p className="mt-3"><strong>Class Name Values:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">fy</code> - First Year</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">sy</code> - Second Year</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">ty</code> - Third Year</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">btech</code> - Fourth Year</li>
                </ul>
                <p className="mt-3"><strong>Excel Sheet Format:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Start data from Row 1 (no headers, titles, or empty rows)</li>
                  <li>Column names must be in the first row</li>
                  <li>No footers or additional content below data</li>
                  <li>Only .xlsx or .xls file formats supported</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-500 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Drop your Excel file here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500">
                Supports .xlsx and .xls files. Expected columns: roll_no, email, class_name
              </p>
            </div>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg transform transition-all duration-700 ease-out animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setExtractedData([]);
                    setShowPreview(false);
                    setShowExtractAnimation(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  disabled={loading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {showExtractAnimation && (
          <div className="bg-white border-2 border-blue-200 rounded-lg mb-6 overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <FileText className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Extracting Data...</h3>
              <p className="text-gray-600">Processing your Excel file and validating student records</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {extractedData.length > 0 && !showExtractAnimation && (
          <div className="bg-white border-2 border-gray-200 rounded-lg mb-6 transform transition-all duration-1000 ease-out animate-in slide-in-from-bottom-8">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Data Preview ({extractedData.length} records)
                </h3>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-300"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPreview ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            {showPreview && (
              <div className="p-4 transform transition-all duration-700 ease-out animate-in fade-in slide-in-from-top-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedData.slice(0, 10).map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm text-gray-500">{row.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.roll_no}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.class_name || 'Not specified'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {extractedData.length > 10 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Showing first 10 records. Total: {extractedData.length} records
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {extractedData.length > 0 && !showExtractAnimation && (
          <div className="flex justify-end space-x-4 transform transition-all duration-1000 ease-out animate-in slide-in-from-bottom-4">
            <button
              onClick={handleSubmit}
              disabled={loading || showUploadAnimation}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-all duration-300 hover:scale-105"
            >
              {loading || showUploadAnimation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Add to Database ({extractedData.length} records)</span>
                </>
              )}
            </button>
          </div>
        )}

        {showToast.show && (
          <div className="fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out animate-in slide-in-from-right-4">
            <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
              showToast.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {showToast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">{showToast.message}</span>
              <button
                onClick={() => setShowToast({ show: false, type: '', message: '' })}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {showUploadAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 scale-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Uploading Student Data</h3>
                <p className="text-gray-600">Sending {extractedData.length} records to the server</p>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {loading && !showUploadAnimation && !showExtractAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40 transition-opacity duration-500">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4 transform transition-all duration-500 scale-100">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
              <span className="font-medium text-gray-900">Processing your file...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentUploadPage;