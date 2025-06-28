import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Search, AlertCircle, Calendar, X } from 'lucide-react';

interface RenewalDue {
  id: string;
  vehicleNumber: string;
  ownerName: string;
  renewalType: 'Insurance' | 'Tax' | 'FC' | 'Permit';
  dueDate: string;
  status: 'upcoming' | 'overdue';
  daysLeft: number;
  vehicleDetails?: {
    makersName: string;
    model: string;
    registrationDate: string;
    chassisNumber: string;
    engineNumber: string;
    fuelType: string;
  };
}

const mockRenewalDues: RenewalDue[] = [
  {
    id: '1',
    vehicleNumber: 'MH02AB2021',
    ownerName: 'Priya Patel',
    renewalType: 'Insurance',
    dueDate: '2024-03-25',
    status: 'upcoming',
    daysLeft: 3,
    vehicleDetails: {
      makersName: 'Hyundai',
      model: 'Creta',
      registrationDate: '2021-11-10',
      chassisNumber: 'MBLHA10ATCGJ67890',
      engineNumber: 'HA10ENCGJ67890',
      fuelType: 'Diesel'
    }
  },
  {
    id: '2',
    vehicleNumber: 'KA01MJ2022',
    ownerName: 'Rahul Sharma',
    renewalType: 'Tax',
    dueDate: '2024-03-15',
    status: 'overdue',
    daysLeft: -7,
    vehicleDetails: {
      makersName: 'Maruti Suzuki',
      model: 'Swift',
      registrationDate: '2022-05-15',
      chassisNumber: 'MBLHA10ATCGJ12345',
      engineNumber: 'HA10ENCGJ12345',
      fuelType: 'Petrol'
    }
  },
  {
    id: '3',
    vehicleNumber: 'DL01RT2023',
    ownerName: 'Arun Kumar',
    renewalType: 'FC',
    dueDate: '2024-04-05',
    status: 'upcoming',
    daysLeft: 15,
    vehicleDetails: {
      makersName: 'Tata Motors',
      model: 'Harrier',
      registrationDate: '2023-01-20',
      chassisNumber: 'MBLHA10ATCGJ24680',
      engineNumber: 'HA10ENCGJ24680',
      fuelType: 'Petrol'
    }
  }
];

const RenewalDues: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalDue | null>(null);
  const [renewalAmount, setRenewalAmount] = useState('');
  const [showProcessDialog, setShowProcessDialog] = useState(false);

  const filteredDues = mockRenewalDues.filter(due => {
    const matchesSearch = 
      due.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || due.renewalType.toLowerCase() === selectedType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const handleProcessRenewal = (renewal: RenewalDue) => {
    setSelectedRenewal(renewal);
    setShowProcessDialog(true);
  };

  const handleSubmitRenewal = () => {
    if (!selectedRenewal || !renewalAmount) return;

    const serviceOrder = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleNumber: selectedRenewal.vehicleNumber,
      serviceType: `${selectedRenewal.renewalType} Renewal`,
      amount: parseFloat(renewalAmount),
      status: 'pending',
      customerName: selectedRenewal.ownerName,
      createdAt: new Date().toISOString()
    };

    alert('Service order created successfully!');
    setShowProcessDialog(false);
    setRenewalAmount('');
    setSelectedRenewal(null);
  };

  const getStatusStyle = (status: string, daysLeft: number) => {
    if (status === 'overdue') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-100',
        text: 'text-red-800',
        badge: 'bg-red-200'
      };
    }
    if (daysLeft <= 7) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-100',
        text: 'text-yellow-800',
        badge: 'bg-yellow-200'
      };
    }
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-800',
      badge: 'bg-blue-200'
    };
  };

  return (
    <MainLayout>
      <Card className='mt-3'>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by vehicle number or owner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              fullWidth
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={selectedType === 'insurance' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('insurance')}
              size="sm"
            >
              Insurance
            </Button>
            <Button
              variant={selectedType === 'tax' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('tax')}
              size="sm"
            >
              Tax
            </Button>
            <Button
              variant={selectedType === 'fc' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('fc')}
              size="sm"
            >
              FC
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredDues.map((due) => {
            const style = getStatusStyle(due.status, due.daysLeft);
            
            return (
              <div
                key={due.id}
                className={`p-4 ${style.bg} border ${style.border} rounded-lg`}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${style.bg} flex-shrink-0`}>
                      {due.status === 'overdue' ? (
                        <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${style.text}`} />
                      ) : (
                        <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${style.text}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                        <h3 className={`font-medium ${style.text}`}>
                          {due.renewalType} Renewal
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${style.badge} ${style.text} self-start sm:self-auto mt-1 sm:mt-0`}>
                          {due.status === 'overdue' 
                            ? `${Math.abs(due.daysLeft)} days overdue`
                            : `${due.daysLeft} days left`}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Vehicle: <span className="font-medium break-words">{due.vehicleNumber}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Owner: <span className="font-medium break-words">{due.ownerName}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Due Date: {new Date(due.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={due.status === 'overdue' ? 'danger' : 'primary'}
                    onClick={() => handleProcessRenewal(due)}
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    Process Renewal
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredDues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No renewal dues found matching your criteria.
            </div>
          )}
        </div>
      </Card>

      {/* Process Renewal Dialog */}
      {showProcessDialog && selectedRenewal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Process Renewal</h2>
              <button
                onClick={() => setShowProcessDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium mb-4">Vehicle Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm block">Registration Number:</span>
                      <span className="font-medium break-words">{selectedRenewal.vehicleNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Make & Model:</span>
                      <span className="font-medium">
                        {selectedRenewal.vehicleDetails?.makersName} {selectedRenewal.vehicleDetails?.model}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Registration Date:</span>
                      <span className="font-medium">
                        {new Date(selectedRenewal.vehicleDetails?.registrationDate || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Chassis Number:</span>
                      <span className="font-medium break-all">{selectedRenewal.vehicleDetails?.chassisNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Engine Number:</span>
                      <span className="font-medium break-all">{selectedRenewal.vehicleDetails?.engineNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Fuel Type:</span>
                      <span className="font-medium">{selectedRenewal.vehicleDetails?.fuelType}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Renewal Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm block">Owner Name:</span>
                      <span className="font-medium break-words">{selectedRenewal.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Renewal Type:</span>
                      <span className="font-medium">{selectedRenewal.renewalType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Due Date:</span>
                      <span className="font-medium">
                        {new Date(selectedRenewal.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Status:</span>
                      <span className={`font-medium ${
                        selectedRenewal.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {selectedRenewal.status.charAt(0).toUpperCase() + selectedRenewal.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <Input
                  label="Renewal Amount"
                  type="number"
                  value={renewalAmount}
                  onChange={(e) => setRenewalAmount(e.target.value)}
                  placeholder="Enter amount"
                  fullWidth
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowProcessDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRenewal}
                  disabled={!renewalAmount}
                  className="w-full sm:w-auto"
                >
                  Create Service Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default RenewalDues;