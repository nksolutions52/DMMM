import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { mockVehicles } from '../data/mockData';

const VehicleDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const vehicle = mockVehicles.find(v => v.id === id);

  if (!vehicle) {
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
        { label: 'Registration Number', value: vehicle.registrationNumber },
        { label: 'Owner Name', value: vehicle.registeredOwnerName },
        { label: 'Mobile Number', value: vehicle.mobileNumber },
        { label: 'Aadhar Number', value: vehicle.aadharNumber },
        { label: 'Guardian Info', value: vehicle.guardianInfo },
        { label: 'Address', value: vehicle.address },
        { label: 'Type', value: vehicle.type },
      ]
    },
    {
      title: 'Vehicle Details',
      fields: [
        { label: 'Maker\'s Name', value: vehicle.makersName },
        { label: 'Model', value: vehicle.makersClassification },
        { label: 'Body Type', value: vehicle.bodyType },
        { label: 'Color', value: vehicle.colour },
        { label: 'Fuel Type', value: vehicle.fuelUsed },
        { label: 'Seating Capacity', value: vehicle.seatingCapacity },
        { label: 'Engine Number', value: vehicle.engineNumber },
        { label: 'Chassis Number', value: vehicle.chassisNumber },
      ]
    },
    {
      title: 'Registration Details',
      fields: [
        { label: 'Date of Registration', value: vehicle.dateOfRegistration },
        { label: 'Valid Upto', value: vehicle.registrationValidUpto },
        { label: 'Tax Valid Upto', value: vehicle.taxUpto },
        { label: 'Insurance Valid Upto', value: vehicle.insuranceUpto },
        { label: 'FC Valid Upto', value: vehicle.fcValidUpto },
        { label: 'Permit Valid Upto', value: vehicle.permitUpto },
      ]
    },
    {
      title: 'Documents & Other Details',
      fields: [
        { label: 'PUC Number', value: vehicle.pucNumber },
        { label: 'PUC Valid From', value: vehicle.pucFrom },
        { label: 'PUC Valid To', value: vehicle.pucTo },
        { label: 'Insurance Policy Number', value: vehicle.policyNumber },
        { label: 'Insurance Valid From', value: vehicle.insuranceFrom },
        { label: 'Insurance Valid To', value: vehicle.insuranceTo },
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/vehicles')}
            className="mr-3 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-sm text-gray-600">
            {vehicle.registrationNumber}
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