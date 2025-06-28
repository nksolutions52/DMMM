import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { vehiclesAPI } from '../services/api';

const VehicleDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: vehicle, loading, error } = useApi(
    () => vehiclesAPI.getById(id!),
    [id]
  );

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

  if (error || !vehicle) {
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

  const detailSections = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Registration Number', value: vehicle.registration_number },
        { label: 'Owner Name', value: vehicle.registered_owner_name },
        { label: 'Mobile Number', value: vehicle.mobile_number },
        { label: 'Aadhar Number', value: vehicle.aadhar_number },
        { label: 'Guardian Info', value: vehicle.guardian_info },
        { label: 'Address', value: vehicle.address },
        { label: 'Type', value: vehicle.type },
      ]
    },
    {
      title: 'Vehicle Details',
      fields: [
        { label: 'Maker\'s Name', value: vehicle.makers_name },
        { label: 'Model', value: vehicle.makers_classification },
        { label: 'Body Type', value: vehicle.body_type },
        { label: 'Color', value: vehicle.colour },
        { label: 'Fuel Type', value: vehicle.fuel_used },
        { label: 'Seating Capacity', value: vehicle.seating_capacity },
        { label: 'Engine Number', value: vehicle.engine_number },
        { label: 'Chassis Number', value: vehicle.chassis_number },
      ]
    },
    {
      title: 'Registration Details',
      fields: [
        { label: 'Date of Registration', value: vehicle.date_of_registration },
        { label: 'Valid Upto', value: vehicle.registration_valid_upto },
        { label: 'Tax Valid Upto', value: vehicle.tax_upto },
        { label: 'Insurance Valid Upto', value: vehicle.insurance_upto },
        { label: 'FC Valid Upto', value: vehicle.fc_valid_upto },
        { label: 'Permit Valid Upto', value: vehicle.permit_upto },
      ]
    },
    {
      title: 'Documents & Other Details',
      fields: [
        { label: 'PUC Number', value: vehicle.puc_number },
        { label: 'PUC Valid From', value: vehicle.puc_from },
        { label: 'PUC Valid To', value: vehicle.puc_to },
        { label: 'Insurance Policy Number', value: vehicle.policy_number },
        { label: 'Insurance Valid From', value: vehicle.insurance_from },
        { label: 'Insurance Valid To', value: vehicle.insurance_to },
      ]
    }
  ];

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
            {vehicle.registration_number}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            leftIcon={<Edit size={18} />}
            onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {detailSections.map((section) => (
          <Card key={section.title} title={section.title}>
            <div className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.label} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-sm text-gray-600 mb-1">{field.label}</p>
                  <p className="font-medium text-gray-900 break-words">{field.value || '-'}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default VehicleDetails;