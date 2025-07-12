import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Edit, Trash2, Download, FileText, Image, Eye, X } from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { vehiclesAPI } from '../services/api';

// Helper to format ISO date to dd-mm-yyyy
function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

const tabSections = [
  {
    key: 'basic',
    title: 'Basic Information',
    fields: [
      { label: 'Registration Number', key: 'registration_number' },
      { label: 'Owner Name', key: 'registered_owner_name' },
      { label: 'Mobile Number', key: 'mobile_number' },
      { label: 'Aadhar Number', key: 'aadhar_number' },
      { label: 'Guardian Info', key: 'guardian_info' },
      { label: 'Address', key: 'address' },
      { label: 'Type', key: 'type' },
      { label: 'Hypothecation', key: 'is_hpa', render: (val: boolean) => val ? 'Yes' : 'No' },
      { label: 'Hypothecated To', key: 'hypothicated_to' },
    ]
  },
  {
    key: 'vehicle',
    title: 'Vehicle Details',
    fields: [
      { label: "Maker's Name", key: 'makers_name' },
      { label: 'Model', key: 'makers_classification' },
      { label: 'Body Type', key: 'body_type' },
      { label: 'Color', key: 'colour' },
      { label: 'Fuel Type', key: 'fuel_used' },
      { label: 'Seating Capacity', key: 'seating_capacity' },
      { label: 'Engine Number', key: 'engine_number' },
      { label: 'Chassis Number', key: 'chassis_number' },
    ]
  },
  {
    key: 'registration',
    title: 'Registration Details',
    fields: [
      { label: 'Date of Registration', key: 'date_of_registration' },
      { label: 'Valid Upto', key: 'registration_valid_upto' },
      { label: 'Tax Valid Upto', key: 'tax_tenure_to' },
      { label: 'Insurance Valid Upto', key: 'insurance_to' },
      { label: 'FC Valid Upto', key: 'fc_tenure_to' },
      { label: 'Permit Valid Upto', key: 'permit_tenure_to' },
    ]
  },
  {
    key: 'documents',
    title: 'Documents',
    fields: [
      { label: 'PUC Number', key: 'puc_number' },
      { label: 'PUC From', key: 'puc_from' },
      { label: 'PUC To', key: 'puc_to' },
      { label: 'Insurance Policy Number', key: 'policy_number' },
      { label: 'Insurance From', key: 'insurance_from' },
      { label: 'Insurance To', key: 'insurance_to' },
      { label: 'FC Number', key: 'fc_number' },
      { label: 'FC From', key: 'fc_tenure_from' },
      { label: 'FC To', key: 'fc_tenure_to' },
      { label: 'Permit Number', key: 'permit_number' },
      { label: 'Permit From', key: 'permit_tenure_from' },
      { label: 'Permit To', key: 'permit_tenure_to' },
      { label: 'Tax Number', key: 'tax_number' },
      { label: 'Tax From', key: 'tax_tenure_from' },
      { label: 'Tax To', key: 'tax_tenure_to' },
    ]
  }
];

// Add a type for vehicle with index signature
interface Vehicle {
  [key: string]: any;
  documents?: {
    [key: string]: Array<{
      id: string;
      original_name: string;
      file_size: number;
      mime_type: string;
      created_at: string;
    }>;
  };
}

const VehicleDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () => vehiclesAPI.getById(id!),
    [id]
  ) as { data: Vehicle, loading: boolean, error: any, refetch: () => void };

  const { mutate: deleteVehicle } = useApiMutation();
  const { mutate: deleteDocument } = useApiMutation();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(() => vehiclesAPI.delete(id!));
        navigate('/vehicles');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete vehicle. Please try again.');
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(() => vehiclesAPI.deleteDocument(docId));
        refetch(); // Refresh vehicle data
        alert('Document deleted successfully!');
      } catch (error) {
        console.error('Delete document failed:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleDownloadDocument = (docId: string, fileName: string) => {
    const token = localStorage.getItem('authToken');
    const url = `http://localhost:5000/api/vehicles/documents/${docId}/download`;
    
    // Create a temporary link and click it to download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    
    // Add authorization header by creating a fetch request and converting to blob
    if (token) {
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Download failed');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Download failed:', error);
        alert('Failed to download document. Please try again.');
      });
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = (fileName: string, mimeType: string) => {
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

  const isImageFile = (mimeType: string) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const handleImagePreview = async (docId: string, mimeType: string) => {
    if (isImageFile(mimeType)) {
      setImageLoading(true);
      const token = localStorage.getItem('authToken');
      const url = `http://localhost:5000/api/vehicles/documents/${docId}/download`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load image');
        }
        
        const blob = await response.blob();
        const imageUrl = window.URL.createObjectURL(blob);
        setSelectedImage(imageUrl);
      } catch (error) {
        console.error('Failed to load image:', error);
        alert('Failed to load image preview');
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleCloseImagePreview = () => {
    if (selectedImage) {
      window.URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  // Place this near the top of the component, before the return statement, so it's in scope for all usages
  const dateFields = [
    'date_of_registration', 'registration_valid_upto', 'tax_upto', 'insurance_upto', 'fc_valid_upto', 'permit_upto',
    'puc_from', 'puc_to', 'insurance_from', 'insurance_to',
    'fc_tenure_from', 'fc_tenure_to',
    'permit_tenure_from', 'permit_tenure_to',
    'tax_tenure_from', 'tax_tenure_to'
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800">Vehicle not found</h2>
          <Button 
            onClick={() => navigate('/vehicles')}
            className="mt-4"
          >
            Back to Vehicles
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 mt-3">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/vehicles')}
            className="mr-3 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-sm text-gray-600">
            {data.registration_number}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            leftIcon={<Edit size={18} />}
            onClick={() => navigate(`/vehicles/edit/${data.id}`)}
            className="w-full sm:w-auto"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 size={18} />}
            onClick={handleDelete}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabSections.map(tab => (
              <button
                key={tab.key}
                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.title}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 sm:p-6">
          {tabSections.map(tab => (
            activeTab === tab.key && (
              <div key={tab.key}>
                <h3 className="text-lg font-medium text-gray-800 mb-4">{tab.title}</h3>
                
                {tab.key === 'documents' ? (
                  <div>
                    {/* Grouped Document Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                      {/* PUC Section (Always show) */}
                      <Card className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">PUC Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><span className="block text-xs text-gray-500 mb-1">PUC Number</span><span className="font-medium text-gray-900 break-words">{data.puc_number || '-'}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">From</span><span className="font-medium text-gray-900 break-words">{formatDate(data.puc_from)}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">To</span><span className="font-medium text-gray-900 break-words">{formatDate(data.puc_to)}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">Contact No</span><span className="font-medium text-gray-900 break-words">{data.puc_contact_no || '-'}</span></div>
                          <div className="md:col-span-2"><span className="block text-xs text-gray-500 mb-1">Address</span><span className="font-medium text-gray-900 break-words">{data.puc_address || '-'}</span></div>
                        </div>
                      </Card>
                      {/* Insurance Section (Always show) */}
                      <Card className="mb-4">
                        <h4 className="font-semibold text-blue-700 mb-2">Insurance Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><span className="block text-xs text-gray-500 mb-1">Company Name</span><span className="font-medium text-gray-900 break-words">{data.insurance_company_name || '-'}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">Policy Number</span><span className="font-medium text-gray-900 break-words">{data.policy_number || '-'}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">Type</span><span className="font-medium text-gray-900 break-words">{data.insurance_type || '-'}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">From</span><span className="font-medium text-gray-900 break-words">{formatDate(data.insurance_from)}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">To</span><span className="font-medium text-gray-900 break-words">{formatDate(data.insurance_to)}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">Contact No</span><span className="font-medium text-gray-900 break-words">{data.insurance_contact_no || '-'}</span></div>
                          <div className="md:col-span-2"><span className="block text-xs text-gray-500 mb-1">Address</span><span className="font-medium text-gray-900 break-words">{data.insurance_address || '-'}</span></div>
                        </div>
                      </Card>
                      {/* Tax Section (Always show) */}
                      <Card className="mb-4">
                        <h4 className="font-semibold text-yellow-700 mb-2">Tax Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><span className="block text-xs text-gray-500 mb-1">Tax Number</span><span className="font-medium text-gray-900 break-words">{data.tax_number || '-'}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">From</span><span className="font-medium text-gray-900 break-words">{formatDate(data.tax_tenure_from)}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">To</span><span className="font-medium text-gray-900 break-words">{formatDate(data.tax_tenure_to)}</span></div>
                          <div><span className="block text-xs text-gray-500 mb-1">Contact No</span><span className="font-medium text-gray-900 break-words">{data.tax_contact_no || '-'}</span></div>
                          <div className="md:col-span-2"><span className="block text-xs text-gray-500 mb-1">Address</span><span className="font-medium text-gray-900 break-words">{data.tax_address || '-'}</span></div>
                        </div>
                      </Card>
                      {/* Fitness Section (Transport only) */}
                      {data.type === 'TRANSPORT' && (
                        <Card className="mb-4">
                          <h4 className="font-semibold text-green-700 mb-2">Fitness (FC) Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><span className="block text-xs text-gray-500 mb-1">FC Number</span><span className="font-medium text-gray-900 break-words">{data.fc_number || '-'}</span></div>
                            <div><span className="block text-xs text-gray-500 mb-1">From</span><span className="font-medium text-gray-900 break-words">{formatDate(data.fc_tenure_from)}</span></div>
                            <div><span className="block text-xs text-gray-500 mb-1">To</span><span className="font-medium text-gray-900 break-words">{formatDate(data.fc_tenure_to)}</span></div>
                            <div><span className="block text-xs text-gray-500 mb-1">Contact No</span><span className="font-medium text-gray-900 break-words">{data.fc_contact_no || '-'}</span></div>
                            <div className="md:col-span-2"><span className="block text-xs text-gray-500 mb-1">Address</span><span className="font-medium text-gray-900 break-words">{data.fc_address || '-'}</span></div>
                          </div>
                        </Card>
                      )}
                      {/* Permit Section (Transport only) */}
                      {data.type === 'TRANSPORT' && (
                        <Card className="mb-4">
                          <h4 className="font-semibold text-purple-700 mb-2">Permit Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><span className="block text-xs text-gray-500 mb-1">Permit Number</span><span className="font-medium text-gray-900 break-words">{data.permit_number || '-'}</span></div>
                            <div><span className="block text-xs text-gray-500 mb-1">From</span><span className="font-medium text-gray-900 break-words">{formatDate(data.permit_tenure_from)}</span></div>
                            <div><span className="block text-xs text-gray-500 mb-1">To</span><span className="font-medium text-gray-900 break-words">{formatDate(data.permit_tenure_to)}</span></div>
                            <div><span className="block text-xs text-gray-500 mb-1">Contact No</span><span className="font-medium text-gray-900 break-words">{data.permit_contact_no || '-'}</span></div>
                            <div className="md:col-span-2"><span className="block text-xs text-gray-500 mb-1">Address</span><span className="font-medium text-gray-900 break-words">{data.permit_address || '-'}</span></div>
                          </div>
                        </Card>
                      )}
                    </div>
                    {/* Document Files */}
                    {data.documents && Object.keys(data.documents).length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Uploaded Documents</h4>
                        <div className="space-y-6">
                          {Object.entries(data.documents).map(([docType, files]) => (
                            <div key={docType} className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-700 mb-3 capitalize">
                                {docType} Documents ({files.length})
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {files.map((file) => (
                                  <div key={file.id} className="bg-white rounded-lg border p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                                        {getFileIcon(file.original_name, file.mime_type)}
                                        <span className="text-sm text-gray-700 truncate" title={file.original_name}>
                                          {file.original_name}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-3">
                                      {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {isImageFile(file.mime_type) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleImagePreview(file.id, file.mime_type)}
                                          className="p-1 text-blue-600 hover:text-blue-800"
                                          title="Preview"
                                          isLoading={imageLoading}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadDocument(file.id, file.original_name)}
                                        className="p-1 text-green-600 hover:text-green-800"
                                        title="Download"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteDocument(file.id)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!data.documents || Object.keys(data.documents).length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p>No documents uploaded for this vehicle.</p>
                      </div>
                    )}
                    {/* RC Details Section (if exists) */}
                    {data.documents?.rc && data.documents.rc.length > 0 && (
                      <Card className="mb-4">
                        <h4 className="font-semibold text-indigo-700 mb-2">RC Details</h4>
                        <div className="flex flex-wrap gap-4">
                          {data.documents.rc.map((file: any) => (
                            <div key={file.id} className="flex flex-col items-center">
                              <img
                                src={`http://localhost:5000/api/vehicles/documents/${file.id}/download`}
                                alt={file.original_name}
                                className="w-40 h-40 object-contain border rounded mb-2"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(file.id, file.original_name)}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(file.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {tab.fields.map(field => {
                      const value = data[field.key];
                      const displayValue = field.render ? field.render(value) : (dateFields.includes(field.key) ? formatDate(value) : (value || '-'));
                      return (
                        <div key={field.key}>
                          <span className="block text-xs text-gray-500 mb-1">{field.label}</span>
                          <span className="font-medium text-gray-900 break-words">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </div>

      {/* RC Details Section - Always show as separate section */}
      <Card className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">RC Details</h3>
        {data.documents?.rc && data.documents.rc.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.documents.rc.map((file: any) => (
              <div key={file.id} className="bg-gray-50 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Image className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">RC Document</span>
                  </div>
                </div>
                
                {/* Image Preview */}
                <div className="mb-3">
                  <img
                    src={`http://localhost:5000/api/vehicles/documents/${file.id}/download`}
                    alt={file.original_name}
                    className="w-full h-32 object-contain border rounded bg-white cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleImagePreview(file.id, file.mime_type)}
                  />
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {file.original_name} • {formatFileSize(file.file_size)}
                </div>
                
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImagePreview(file.id, file.mime_type)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Preview"
                    isLoading={imageLoading}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocument(file.id, file.original_name)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(file.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>No RC document uploaded for this vehicle.</p>
          </div>
        )}
      </Card>
      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handleCloseImagePreview}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Document preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={() => {
                console.error('Failed to load image');
                handleCloseImagePreview();
                alert('Failed to load image preview');
              }}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default VehicleDetails;