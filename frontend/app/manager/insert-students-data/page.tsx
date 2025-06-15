'use client';
import React from 'react';
import { Upload, X, CheckCircle, AlertCircle, Eye, EyeOff, Database, FileText, Info } from 'lucide-react';
import * as XLSX from 'sheetjs-style';
import api from '@/lib/api';

interface StudentData {
  roll_no: string;
  email?: string | null;
  class_name?: string | null;
  backlogs?: number | null;
  cgpa?: number | null;
  rank?: number | null;
  gender?: string | null;
  caste_id?: number | null;
}

interface ExtractedStudentData extends StudentData {
  id: number; // Unique ID for table rendering
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | '';
  message: string;
}

const StudentUploadPage: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [extractedData, setExtractedData] = React.useState<ExtractedStudentData[]>([]);
  const [presentColumns, setPresentColumns] = React.useState<string[]>([]);
  const [hasAllColumns, setHasAllColumns] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showToast, setShowToast] = React.useState<ToastState>({ show: false, type: '', message: '' });
  const [showPreview, setShowPreview] = React.useState<boolean>(false);
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false);
  const [showExtractAnimation, setShowExtractAnimation] = React.useState<boolean>(false);
  const [showSuccessScreen, setShowSuccessScreen] = React.useState<boolean>(false);

  const standardColumns: string[] = [
    'roll_no',
    'email',
    'class_name',
    'backlogs',
    'cgpa',
    'rank',
    'gender',
    'caste_id',
  ];
  const classChoices: string[] = ['fy', 'sy', 'ty', 'btech'];
  const casteToIdMap: { [key: string]: number } = {
    open: 1,
    sc: 2,
    st: 3,
    'nt-b': 5,
    'nt-c': 6,
    'nt-d': 7,
  };

  const showToastMessage = (type: 'success' | 'error' | 'warning', message: string): void => {
    setShowToast({ show: true, type, message });
    setTimeout(() => setShowToast({ show: false, type: '', message: '' }), 5000);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file =>
        file.type.includes('excel') ||
        file.type.includes('spreadsheet') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls'),
    );
    if (droppedFiles.length > 0) {
      const newFiles = droppedFiles.filter(
        newFile => !files.some(f => f.name === newFile.name && f.size === newFile.size),
      );
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      showToastMessage('error', 'Please upload valid Excel files (.xlsx or .xls)');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const newFiles = selectedFiles.filter(
        newFile => !files.some(f => f.name === newFile.name && f.size === newFile.size),
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const processSingleFile = async (file: File): Promise<StudentData[]> => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: unknown[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        throw new Error(`The Excel file ${file.name} appears to be empty`);
      }

      const fileColumnsRaw = jsonData[0] as string[];
      const fileColumns = fileColumnsRaw.map(col => col?.toLowerCase().trim() ?? '');
      const columnMapping: { [key: string]: string } = {};
      standardColumns.forEach(standardCol => {
        const lowerStandardCol = standardCol.toLowerCase().trim();
        let colIndex = fileColumns.findIndex(fileCol => fileCol === lowerStandardCol);
        if (colIndex === -1) {
          colIndex = fileColumns.findIndex(fileCol => fileCol.includes(lowerStandardCol));
        }
        if (colIndex !== -1) {
          columnMapping[standardCol] = fileColumnsRaw[colIndex];
        }
      });

      if (!columnMapping['roll_no']) {
        throw new Error(`File ${file.name} does not have a 'roll_no' column`);
      }

      const extractedData: StudentData[] = jsonData.slice(1).map((row: unknown) => {
        const rowData = row as (string | number | undefined)[];
        const student: StudentData = { roll_no: '' };

        standardColumns.forEach(standardCol => {
          const fileCol = columnMapping[standardCol];
          if (fileCol) {
            const colIndex = fileColumns.indexOf(fileCol);
            if (colIndex !== -1 && rowData[colIndex] !== undefined) {
              const value = rowData[colIndex];
              if (standardCol === 'roll_no') {
                student.roll_no = String(value).trim();
              } else if (standardCol === 'email') {
                student.email = value ? String(value).trim().toLowerCase() : null;
              } else if (standardCol === 'class_name') {
                let className = value ? String(value).trim().toLowerCase() : '';
                if (className.includes('1st') || className.includes('first') || className.includes('1')) {
                  className = 'fy';
                } else if (className.includes('2nd') || className.includes('second') || className.includes('2')) {
                  className = 'sy';
                } else if (className.includes('3rd') || className.includes('third') || className.includes('3')) {
                  className = 'ty';
                } else if (
                  className.includes('4th') ||
                  className.includes('fourth') ||
                  className.includes('4') ||
                  className.includes('final')
                ) {
                  className = 'btech';
                }
                student.class_name = classChoices.includes(className) ? className : null;
              } else if (standardCol === 'backlogs') {
                const parsed = parseInt(String(value), 10);
                student.backlogs = isNaN(parsed) ? null : parsed;
              } else if (standardCol === 'cgpa') {
                const parsed = parseFloat(String(value));
                student.cgpa = isNaN(parsed) ? null : parsed;
              } else if (standardCol === 'rank') {
                const parsed = parseInt(String(value), 10);
                student.rank = isNaN(parsed) ? null : parsed;
              } else if (standardCol === 'gender') {
                const genderValue = value ? String(value).trim().toLowerCase() : '';
                student.gender = genderValue === 'male' || genderValue === 'female' ? genderValue : null;
              } else if (standardCol === 'caste_id') {
                const casteValue = value ? String(value).trim().toLowerCase() : '';
                let casteId: number | null = null;
                for (const [casteKey, id] of Object.entries(casteToIdMap)) {
                  if (casteValue.includes(casteKey)) {
                    casteId = id;
                    break;
                  }
                }
                student.caste_id = casteId;
              }
            }
          }
        });

        return student;
      }).filter(student => student.roll_no);

      return extractedData;
    } catch (error) {
      throw new Error(`Error processing file ${file.name}: ${(error as Error).message}`);
    }
  };

  React.useEffect(() => {
    if (files.length > 0) {
      processFiles(files);
    } else {
      setExtractedData([]);
      setPresentColumns([]);
      setHasAllColumns(false);
    }
  }, [files]);

  const processFiles = async (files: File[]): Promise<void> => {
    setLoading(true);
    try {
      const allData: StudentData[][] = await Promise.all(files.map(file => processSingleFile(file)));

      const mergedMap = new Map<string, StudentData>();
      allData.forEach(data => {
        data.forEach(student => {
          const rollNo = student.roll_no;
          if (!mergedMap.has(rollNo)) {
            mergedMap.set(rollNo, { ...student });
          } else {
            const existing = mergedMap.get(rollNo)!;
            standardColumns.forEach(key => {
              if (student[key as keyof StudentData] !== undefined && student[key as keyof StudentData] !== null) {
                (existing[key as keyof StudentData] as any) = student[key as keyof StudentData];
              }
            });
          }
        });
      });

      const mergedData = Array.from(mergedMap.values());
      const allColumns = Array.from(new Set(mergedData.flatMap(student => Object.keys(student))));
      setPresentColumns(allColumns);
      const missingColumns = standardColumns.filter(col => !allColumns.includes(col));
      setHasAllColumns(missingColumns.length === 0);
      if (missingColumns.length > 0) {
        showToastMessage('warning', `Missing columns: ${missingColumns.join(', ')}. Upload more files to include all required columns.`);
      }
      const extractedDataWithId: ExtractedStudentData[] = mergedData.map((student, index) => ({
        id: index + 1,
        roll_no: student.roll_no,
        email: student.email,
        class_name: student.class_name,
        backlogs: student.backlogs,
        cgpa: student.cgpa,
        rank: student.rank,
        gender: student.gender,
        caste_id: student.caste_id,
      }));
      setExtractedData(extractedDataWithId);
      setShowExtractAnimation(true);
      setTimeout(() => {
        setShowPreview(true);
        setShowExtractAnimation(false);
      }, 2000);
      showToastMessage('success', `Successfully extracted ${mergedData.length} student records`);
    } catch (error: any) {
      showToastMessage('error', error.message || 'Error processing files');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (extractedData.length === 0 || !hasAllColumns) {
      showToastMessage('error', 'Cannot submit data. Ensure all required columns are present.');
      return;
    }

    setLoading(true);
    const dataToSubmit = extractedData.map(({ id, ...student }) => ({
      roll_no: student.roll_no,
      email: student.email ?? null,
      class_name: student.class_name ?? null,
      backlogs: student.backlogs ?? null,
      cgpa: student.cgpa ?? null,
      rank: student.rank ?? null,
      gender: student.gender ?? null,
      caste_id: student.caste_id ?? null,
    }));
    api.post('/auth/studentverification/', dataToSubmit).catch(error => {
      console.error('Submission error:', error);
    });

    // Show success screen for 1 second
    setShowSuccessScreen(true);
    setTimeout(() => {
      setShowSuccessScreen(false);
      setFiles([]);
      setExtractedData([]);
      setPresentColumns([]);
      setHasAllColumns(false);
      setShowPreview(false);
      setLoading(false);
    }, 1000);
  };

  const removeFile = (index: number): void => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const columns = Array.from(new Set(extractedData.flatMap(student => Object.keys(student)))).filter(
    col => col !== 'id',
  );

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Data Upload</h1>
          <p className="text-gray-600">Upload multiple Excel files containing verified student information</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Excel Format Requirements</h3>
              <div className="space-y-2 text-blue-800">
                <p><strong>Required Columns (must be present across all uploaded files):</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">roll_no</code> - MIS or JEE/CET applicant number (required in every file)</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">email</code> - Student email address</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">class_name</code> - Class year (fy, sy, ty, btech)</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">backlogs</code> - Number of backlogs</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">cgpa</code> - Cumulative GPA</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">rank</code> - Student rank</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">gender</code> - Student gender (male, female)</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">caste_id</code> - Student caste ID (e.g., OPEN, SC, ST, NT-B, NT-C, NT-D)</li>
                </ul>
                <p className="mt-3"><strong>Upload Requirements:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Each Excel file must contain the <code className="bg-blue-100 px-2 py-1 rounded">roll_no</code> column</li>
                  <li>Across all uploaded files, all required columns must be present in the merged data</li>
                  <li>If multiple files provide the same column (other than <code className="bg-blue-100 px-2 py-1 rounded">roll_no</code>), values from the first file are used</li>
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
              isDragOver ? 'border-blue-400 bg-blue-50 scale-105' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Drop your Excel files here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500">
                Supports .xlsx and .xls files. Each file must include 'roll_no'. All required columns must be present across files.
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg flex items-center justify-between transform transition-all duration-700 ease-out animate-in slide-in-from-bottom-4"
                >
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
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                    disabled={loading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-lg mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Columns Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {standardColumns.map(col => (
                <div key={col} className="flex items-center space-x-2">
                  {presentColumns.includes(col) ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>{col}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showExtractAnimation && (
          <div className="bg-white border-2 border-blue-200 rounded-lg mb-6 overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <FileText className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Extracting Data...</h3>
              <p className="text-gray-600">Processing your Excel files and merging student records</p>
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
                        {columns.map(col => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedData.slice(0, 10).map(row => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm text-gray-500">{row.id}</td>
                          {columns.map(col => (
                            <td key={col} className="px-4 py-3 text-sm text-gray-900">
                              {row[col as keyof ExtractedStudentData] ?? ''}
                            </td>
                          ))}
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

        {extractedData.length > 0 && hasAllColumns && !showExtractAnimation && (
          <div className="flex justify-end space-x-4 transform transition-all duration-1000 ease-out animate-in slide-in-from-bottom-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-all duration-300 hover:scale-105"
            >
              {loading ? (
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
            <div
              className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
                showToast.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : showToast.type === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}
            >
              {showToast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : showToast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
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

        {showSuccessScreen && (
          <div className="fixed inset-0 bg-green-600 flex items-center justify-center z-50 transition-opacity duration-500">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-600">Successfully submitted {extractedData.length} student records.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentUploadPage;