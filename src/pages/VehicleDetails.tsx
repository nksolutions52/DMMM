import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { vehiclesAPI } from '../services/api';

// Helper to format ISO date to mm/dd/yyyy
function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
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
      { label: 'Tax Valid Upto', key: 'tax_upto' },
      { label: 'Insurance Valid Upto', key: 'insurance_upto' },
      { label: 'FC Valid Upto', key: 'fc_valid_upto' },
      { label: 'Permit Valid Upto', key: 'permit_upto' },
    ]
  },
  {
    key: 'documents',
    title: 'Documents & Other Details',
    fields: [
      { label: 'PUC Number', key: 'puc_number' },
      { label: 'PUC Valid From', key: 'puc_from' },
      { label: 'PUC Valid To', key: 'puc_to' },
      { label: 'Insurance Policy Number', key: 'policy_number' },
      { label: 'Insurance Valid From', key: 'insurance_from' },
      { label: 'Insurance Valid To', key: 'insurance_to' },
    ]
  }
];

// Add a type for vehicle with index signature
interface Vehicle {
  [key: string]: any;
}

const VehicleDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');

  const { data, loading, error } = useApi(
    () => vehiclesAPI.getById(id!),
    [id]
  ) as { data: Vehicle, loading: boolean, error: any };

  const { mutate: deleteVehicle } = useApiMutation();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(() => vehiclesAPI.delete(id!));
        navigate('/vehicles');
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {tab.fields.map(field => {
                    // List of keys that are dates
                    const dateFields = [
                      'date_of_registration', 'registration_valid_upto', 'tax_upto', 'insurance_upto', 'fc_valid_upto', 'permit_upto',
                      'puc_from', 'puc_to', 'insurance_from', 'insurance_to'
                    ];
                    const value = data[field.key];
                    const displayValue = dateFields.includes(field.key) ? formatDate(value) : (value || '-');
                    return (
                      <div key={field.key}>
                        <span className="block text-xs text-gray-500 mb-1">{field.label}</span>
                        <span className="font-medium text-gray-900 break-words">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default VehicleDetails;