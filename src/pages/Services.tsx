import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import { Vehicle } from '../types';
import { mockVehicles } from '../data/mockData';

const services = [
  { id: 'transfer', name: 'Transfer of Ownership', fee: 1500 },
  { id: 'permit', name: 'Permit', fee: 1000 },
  { id: 'hpa', name: 'HPA', fee: 800 },
  { id: 'hpt', name: 'HPT', fee: 800 },
  { id: 'fitness', name: 'Fitness', fee: 600 },
  { id: 'pollution', name: 'Pollution', fee: 300 },
  { id: 'insurance', name: 'Insurance', fee: 2000 },
];

const stepTitles = ['Select Service', 'Vehicle Details', 'Payment'];

const Services: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServiceFee, setSelectedServiceFee] = useState<number | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleData, setVehicleData] = useState<Vehicle | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = services.find(s => s.id === serviceId);
    setSelectedServiceFee(service ? service.fee : null);
    setStep(2);
  };

  const handleVehicleSearch = () => {
    setHasSearched(true);
    const found = mockVehicles.find(
      v => v.registrationNumber.toLowerCase() === vehicleNumber.toLowerCase()
    );
    setVehicleData(found || null);
  };

  const handleSubmit = () => {
    alert('Service booked!');
  };

  return (
    <MainLayout>
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 mt-3 overflow-x-auto">
        {stepTitles.map((title, idx) => (
          <React.Fragment key={title}>
            <div className="flex flex-col items-center min-w-0 flex-shrink-0">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm
                ${step === idx + 1
                  ? 'bg-blue-600 text-white'
                  : step > idx + 1
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'}
              `}>
                {idx + 1}
              </div>
              <span className={`mt-2 text-xs font-medium text-center
                ${step === idx + 1 ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {title}
              </span>
            </div>
            {idx < stepTitles.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded min-w-[20px]
                ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Select Service</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={`w-full p-4 sm:p-6 rounded-lg shadow transition border-2
                    ${selectedService === service.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50'}
                  `}
                >
                  <div className="text-base sm:text-lg font-bold mb-2">{service.name}</div>
                  <div className="text-xl sm:text-2xl font-extrabold">₹{service.fee}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Vehicle Details</h3>
            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-8 max-w-lg">
              <Input
                type="text"
                placeholder="Enter Registration Number"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleVehicleSearch}
                leftIcon={<Search size={18} />}
                className="px-6 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Search
              </Button>
            </div>
            {vehicleData ? (
              <div className="space-y-6">
                {/* Section Cards */}
                <div className="bg-gray-50 rounded-lg shadow-sm p-4 sm:p-6 border">
                  <h4 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <span className="block text-xs text-gray-500">Registration Number</span>
                      <span className="font-medium text-gray-900 break-words">{vehicleData.registrationNumber}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Owner Name</span>
                      <span className="font-medium text-gray-900 break-words">{vehicleData.registeredOwnerName}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Mobile Number</span>
                      <span className="font-medium text-gray-900">{vehicleData.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Aadhar Number</span>
                      <span className="font-medium text-gray-900">{vehicleData.aadharNumber}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Guardian Info</span>
                      <span className="font-medium text-gray-900 break-words">{vehicleData.guardianInfo}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Address</span>
                      <span className="font-medium text-gray-900 break-words">{vehicleData.address}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Type</span>
                      <span className="font-medium text-gray-900">{(vehicleData as any).type || '-'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Additional sections with responsive grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg shadow-sm p-4 sm:p-6 border">
                    <h4 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">Vehicle Details</h4>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs text-gray-500">Chassis Number</span>
                        <span className="font-medium text-gray-900 break-all">{vehicleData.chassisNumber}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Engine Number</span>
                        <span className="font-medium text-gray-900 break-all">{vehicleData.engineNumber}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Body Type</span>
                        <span className="font-medium text-gray-900">{vehicleData.bodyType}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Colour</span>
                        <span className="font-medium text-gray-900">{vehicleData.colour}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Vehicle Class</span>
                        <span className="font-medium text-gray-900">{vehicleData.vehicleClass}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Fuel Used</span>
                        <span className="font-medium text-gray-900">{vehicleData.fuelUsed}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg shadow-sm p-4 sm:p-6 border">
                    <h4 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">Manufacturer Details</h4>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs text-gray-500">Maker's Name</span>
                        <span className="font-medium text-gray-900">{vehicleData.makersName}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Cubic Capacity</span>
                        <span className="font-medium text-gray-900">{vehicleData.cubicCapacity}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Maker's Classification</span>
                        <span className="font-medium text-gray-900">{vehicleData.makersClassification}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Seating Capacity</span>
                        <span className="font-medium text-gray-900">{vehicleData.seatingCapacity}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Month/Year of Manufacture</span>
                        <span className="font-medium text-gray-900">{(vehicleData as any).monthYearOfManufacture || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              hasSearched && (
                <p className="text-red-500">No vehicle found with that registration number.</p>
              )
            )}
            <div className="flex flex-col sm:flex-row justify-between mt-8 gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">Back</Button>
              <Button onClick={() => vehicleData && setStep(3)} disabled={!vehicleData} className="w-full sm:w-auto">Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Payment Details</h3>
            <div className="max-w-xl">
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-gray-600 mb-1">Selected Service</label>
                  <Input
                    type="text"
                    readOnly
                    value={services.find(s => s.id === selectedService)?.name || 'N/A'}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Actual Service Amount</label>
                  <Input
                    type="text"
                    readOnly
                    value={
                      selectedServiceFee !== null
                        ? `₹${selectedServiceFee}`
                        : 'N/A'
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Discount</label>
                  <Input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    placeholder="Enter discount amount"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Amount After Discount</label>
                  <Input
                    type="text"
                    readOnly
                    value={
                      selectedServiceFee !== null
                        ? `₹${Math.max(selectedServiceFee - discount, 0)}`
                        : 'N/A'
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">Back</Button>
                <Button onClick={handleSubmit} className="w-full sm:w-auto">Submit</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </MainLayout>
  );
};

export default Services;