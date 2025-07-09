import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Search, AlertCircle, Calendar, X, RefreshCw, CheckCircle } from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { renewalsAPI } from '../services/api';

const RenewalDues: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRenewal, setSelectedRenewal] = useState<any>(null);
  const [renewalAmount, setRenewalAmount] = useState('');
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showCheckDuesModal, setShowCheckDuesModal] = useState(false);
  const [checkDuesResult, setCheckDuesResult] = useState<any>(null);

  const { data: renewalsData, loading, error, refetch } = useApi(
    () => renewalsAPI.getAll({ 
      page: currentPage, 
      limit: 10, 
      search: searchTerm,
      type: selectedType 
    }),
    [currentPage, searchTerm, selectedType]
  );

  const { mutate: processRenewal, loading: processing } = useApiMutation();
  const { mutate: checkDues, loading: checking } = useApiMutation();

  const renewals = renewalsData?.renewals || [];
  const pagination = renewalsData?.pagination;

  const handleProcessRenewal = (renewal: any) => {
    setSelectedRenewal(renewal);
    setRenewalAmount(renewal.amount?.toString() || '');
    setShowProcessDialog(true);
  };

  const handleSubmitRenewal = async () => {
    if (!selectedRenewal || !renewalAmount) return;

    try {
      await processRenewal(() => renewalsAPI.processRenewal(selectedRenewal.id, parseFloat(renewalAmount)));
      alert('Service order created successfully!');
      setShowProcessDialog(false);
      setRenewalAmount('');
      setSelectedRenewal(null);
      refetch();
    } catch (error) {
      console.error('Process renewal failed:', error);
      alert('Failed to process renewal. Please try again.');
    }
  };

  const handleCheckDues = async () => {
    try {
      const result = await checkDues(() => renewalsAPI.checkDues());
      if (result.data) {
        setCheckDuesResult(result.data);
        setShowCheckDuesModal(true);
      }
      refetch();
    } catch (error) {
      console.error('Check dues failed:', error);
      alert('Failed to check renewal dues. Please try again.');
    }
  };

  // Color map for each renewal type
  const typeColorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    PUC: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      badge: 'bg-purple-200',
    },
    Insurance: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-200',
    },
    Tax: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badge: 'bg-yellow-200',
    },
    FC: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-200',
    },
    Permit: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-800',
      badge: 'bg-pink-200',
    },
    default: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      badge: 'bg-gray-200',
    },
  };

  const getTypeStyle = (type: string) => typeColorMap[type] || typeColorMap.default;

  const getStatusStyle = (status: string, daysLeft: number) => {
    if (status === 'overdue' || daysLeft < 0) {
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading renewal dues: {error}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Card className='mt-3'>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by vehicle number or owner name..."
              value={searchTerm}
              onChange={handleSearch}
              leftIcon={<Search size={18} />}
              fullWidth
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === '' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={selectedType === 'PUC' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('PUC')}
              size="sm"
            >
              PUC
            </Button>
            <Button
              variant={selectedType === 'Insurance' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('Insurance')}
              size="sm"
            >
              Insurance
            </Button>
            <Button
              variant={selectedType === 'Tax' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('Tax')}
              size="sm"
            >
              Tax
            </Button>
            <Button
              variant={selectedType === 'FC' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('FC')}
              size="sm"
            >
              FC
            </Button>
            <Button
              variant={selectedType === 'Permit' ? 'primary' : 'outline'}
              onClick={() => setSelectedType('Permit')}
              size="sm"
            >
              Permit
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckDues}
              leftIcon={<RefreshCw size={16} />}
              size="sm"
              isLoading={checking}
              className="ml-2"
            >
              Check Dues
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {renewals.map((due: any) => {
            const style = getTypeStyle(due.renewal_type);
            
            return (
              <div
                key={due.id}
                className={`p-4 ${style.bg} border ${style.border} rounded-lg`}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${style.bg} flex-shrink-0`}>
                      {due.status === 'overdue' || due.days_left < 0 ? (
                        <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${style.text}`} />
                      ) : (
                        <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${style.text}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                        <h3 className={`font-medium ${style.text}`}>
                          {due.renewal_type} Renewal
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${style.badge} ${style.text} self-start sm:self-auto mt-1 sm:mt-0`}>
                          {due.days_left < 0 
                            ? `${Math.abs(due.days_left)} days overdue`
                            : `${due.days_left} days left`}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Vehicle: <span className="font-medium break-words">{due.registration_number}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Owner: <span className="font-medium break-words">{due.registered_owner_name}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Due Date: {new Date(due.due_date).toLocaleDateString()}
                        </p>
                        {/* Remove amount display here if present */}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={due.days_left < 0 ? 'danger' : 'primary'}
                    onClick={() => handleProcessRenewal(due)}
                    className="w-full sm:w-auto flex-shrink-0"
                    disabled={due.status === 'processing' || due.status === 'completed'}
                  >
                    {due.status === 'processing' ? 'Processing...' : 
                     due.status === 'completed' ? 'Completed' : 'Process Renewal'}
                  </Button>
                </div>
              </div>
            );
          })}

          {renewals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No renewal dues found</h3>
              <p>No renewal dues found matching your criteria.</p>
              <Button
                onClick={handleCheckDues}
                leftIcon={<RefreshCw size={16} />}
                className="mt-4"
                isLoading={checking}
              >
                Check for New Dues
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalCount)} of {pagination.totalCount} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
                      <span className="font-medium break-words">{selectedRenewal.registration_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Make & Model:</span>
                      <span className="font-medium">
                        {selectedRenewal.makers_name} {selectedRenewal.makers_classification}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Registration Date:</span>
                      <span className="font-medium">
                        {new Date(selectedRenewal.date_of_registration).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Chassis Number:</span>
                      <span className="font-medium break-all">{selectedRenewal.chassis_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Engine Number:</span>
                      <span className="font-medium break-all">{selectedRenewal.engine_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Fuel Type:</span>
                      <span className="font-medium">{selectedRenewal.fuel_used}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Renewal Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm block">Owner Name:</span>
                      <span className="font-medium break-words">{selectedRenewal.registered_owner_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Mobile Number:</span>
                      <span className="font-medium">{selectedRenewal.mobile_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Address:</span>
                      <span className="font-medium break-words">{selectedRenewal.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Renewal Type:</span>
                      <span className="font-medium">{selectedRenewal.renewal_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Due Date:</span>
                      <span className="font-medium">
                        {new Date(selectedRenewal.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Status:</span>
                      <span className={`font-medium ${
                        selectedRenewal.days_left < 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {selectedRenewal.days_left < 0 ? 'Overdue' : 'Upcoming'}
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
                  isLoading={processing}
                  className="w-full sm:w-auto"
                >
                  Create Service Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check Dues Result Modal */}
      {showCheckDuesModal && checkDuesResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Renewal Dues Check Result</h2>
              <button
                onClick={() => setShowCheckDuesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th className="text-left py-1">Type</th>
                    <th className="text-center py-1">Expired</th>
                    <th className="text-center py-1">Due</th>
                    <th className="text-center py-1">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {['PUC', 'Insurance', 'Permit', 'FC', 'Tax'].map(type => (
                    <tr key={type}>
                      <td className="py-1">{type}</td>
                      <td className="text-center py-1">{checkDuesResult[type]?.expired ?? 0}</td>
                      <td className="text-center py-1">{checkDuesResult[type]?.due ?? 0}</td>
                      <td className="text-center py-1">{checkDuesResult[type]?.added ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right font-semibold">
                Total new dues added: <span className="text-blue-600">{checkDuesResult.total ?? 0}</span>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setShowCheckDuesModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default RenewalDues;