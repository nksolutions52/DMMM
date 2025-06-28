import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockVehicles } from '../data/mockData';

const VehiclesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState(mockVehicles);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    const filtered = mockVehicles.filter(vehicle =>
      vehicle.registrationNumber.toLowerCase().includes(term.toLowerCase()) ||
      vehicle.registeredOwnerName.toLowerCase().includes(term.toLowerCase()) ||
      vehicle.chassisNumber.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredVehicles(filtered);
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          {/* Empty div to maintain layout */}
        </div>
      </div>

      <Card className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search vehicles by reg. number, owner name, or chassis number..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              leftIcon={<Filter size={18} />}
              className="w-full sm:w-auto"
            >
              Filter
            </Button>
            <Link to="/vehicles/add">
              <Button leftIcon={<Plus size={18} />} className="w-full sm:w-auto">
                Add Vehicle
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Car className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{vehicle.registrationNumber}</div>
                      <div className="text-xs text-gray-500">Reg. Date: {new Date(vehicle.dateOfRegistration).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span
                    className={
                      vehicle.type === "Transport"
                        ? "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-300 text-gray-900"
                        : "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-black text-white"
                    }
                  >
                    {vehicle.type}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div>
                    <span className="text-xs text-gray-500">Owner:</span>
                    <span className="text-sm font-medium text-gray-900 ml-1">{vehicle.registeredOwnerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Mobile:</span>
                    <span className="text-sm text-gray-700 ml-1">{vehicle.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Vehicle:</span>
                    <span className="text-sm text-gray-700 ml-1">{vehicle.makersName} {vehicle.makersClassification}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Details:</span>
                    <span className="text-sm text-gray-700 ml-1">{vehicle.colour} | {vehicle.fuelUsed}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                  <div className="flex space-x-3">
                    <Link to={`/vehicles/${vehicle.id}`} className="text-blue-600 hover:text-blue-800" title="View">
                      <Eye size={18} />
                    </Link>
                    <Link to={`/vehicles/edit/${vehicle.id}`} className="text-amber-600 hover:text-amber-800" title="Edit">
                      <Edit size={18} />
                    </Link>
                    <button className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No vehicles found matching your search criteria.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vehicle.registrationNumber}</div>
                          <div className="text-sm text-gray-500">Reg. Date: {new Date(vehicle.dateOfRegistration).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vehicle.registeredOwnerName}</div>
                      <div className="text-sm text-gray-500">{vehicle.mobileNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vehicle.makersName} {vehicle.makersClassification}</div>
                      <div className="text-sm text-gray-500">{vehicle.colour} | {vehicle.fuelUsed}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          vehicle.type === "Transport"
                            ? "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-300 text-gray-900"
                            : "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-black text-white"
                        }
                      >
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/vehicles/${vehicle.id}`} className="text-blue-600 hover:text-blue-800" title="View">
                          <Eye size={18} />
                        </Link>
                        <Link to={`/vehicles/edit/${vehicle.id}`} className="text-amber-600 hover:text-amber-800" title="Edit">
                          <Edit size={18} />
                        </Link>
                        <button className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vehicles found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </MainLayout>
  );
};

export default VehiclesList;