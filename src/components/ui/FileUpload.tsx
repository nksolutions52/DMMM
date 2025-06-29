import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Download, Trash2 } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  label: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  existingFiles?: any[];
  onFilesChange: (files: FileList | null) => void;
  onDeleteExisting?: (fileId: string) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  accept = "image/*,.pdf",
  multiple = true,
  maxFiles = 5,
  existingFiles = [],
  onFilesChange,
  onDeleteExisting,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const totalFiles = selectedFiles.length + existingFiles.length + fileArray.length;
    
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file types
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      return isImage || isPdf;
    });

    if (validFiles.length !== fileArray.length) {
      alert('Only image files (JPEG, PNG, GIF) and PDF files are allowed');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Create a new FileList-like object
    const dataTransfer = new DataTransfer();
    [...selectedFiles, ...validFiles].forEach(file => {
      dataTransfer.items.add(file);
    });
    
    onFilesChange(dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => {
      dataTransfer.items.add(file);
    });
    
    onFilesChange(dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const isPdf = mimeType?.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
    return isPdf ? <FileText className="h-4 w-4" /> : <Image className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium text-blue-600 cursor-pointer" onClick={openFileDialog}>
            Click to upload
          </span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          Images (JPEG, PNG, GIF) or PDF files, up to 10MB each
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Maximum {maxFiles} files
        </p>
      </div>

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex items-center space-x-2">
                  {getFileIcon(file.original_name, file.mime_type)}
                  <span className="text-sm text-gray-700 truncate">{file.original_name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/api/vehicles/documents/${file.id}/download`, '_blank')}
                    className="p-1"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {onDeleteExisting && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteExisting(file.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-2">
                  {getFileIcon(file.name, file.type)}
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;