import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FileUpload from '../components/ui/FileUpload';
import { Search, FileText, MoreVertical, X, Clock, CheckCircle, CreditCard, User } from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { servicesAPI } from '../services/api';
import Popover from '../components/ui/Popover';

const ServiceOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [completeFromDate, setCompleteFromDate] = useState("");
  const [completeToDate, setCompleteToDate] = useState("");
  const [completeNumber, setCompleteNumber] = useState("");
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [transferAadhar, setTransferAadhar] = useState('');
  const [transferMobile, setTransferMobile] = useState('');
  const [transferOwner, setTransferOwner] = useState('');
  const [transferGuardian, setTransferGuardian] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [hpaHypothecatedTo, setHpaHypothecatedTo] = useState('');
  const [completeDocuments, setCompleteDocuments] = useState<FileList | null>(null);

  const { data: ordersData, loading, error, refetch } = useApi(
    () => servicesAPI.getOrders({ 
      page: currentPage, 
      limit: 10, 
      search: searchTerm,
      status: selectedStatus 
    }),
    [currentPage, searchTerm, selectedStatus]
  );

  const { mutate: updateOrderStatus } = useApiMutation();
  const { mutate: makePayment } = useApiMutation();
  const { mutate: getOrderDetails } = useApiMutation();

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleComplete = (order: any) => {
    setSelectedOrder(order);
    setShowCompleteModal(true);
    setPopoverOpenId(null);
  };

  const handleCancel = async (order: any) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await updateOrderStatus(() => servicesAPI.updateOrderStatus(order.id, 'cancelled'));
        refetch();
      } catch (error) {
        console.error('Update failed:', error);
      }
    }
    setPopoverOpenId(null);
  };

  const handlePayOrder = (order: any) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
    setPopoverOpenId(null);
    setAnchorRect(null);
  };

  const handleViewDetails = async (order: any) => {
    try {
      const details = await getOrderDetails(() => servicesAPI.getOrderById(order.id));
      setOrderDetails(details.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
    setPopoverOpenId(null);
  };

  const handlePay = async () => {
    const payValue = Number(payAmount);
    if (selectedOrder && payValue > 0) {
      try {
        await makePayment(() => servicesAPI.makePayment(selectedOrder.id, payValue));
        setShowPaymentModal(false);
        setSelectedOrder(null);
        setPayAmount("");
        refetch();
      } catch (error) {
        console.error('Payment failed:', error);
      }
    }
  };

  const getNumberLabel = (serviceType: string) => {
    switch (serviceType?.toLowerCase()) {
      case 'fitness': return 'FC Number';
      case 'insurance': return 'Policy Number';
      case 'permit': return 'Permit Number';
      case 'pollution': return 'PUC Number';
      case 'tax': return 'Tax Number';
      case 'transfer': return 'Transfer Number';
      case 'hpa': return 'HPA Number';
      case 'hpt': return 'HPT Number';
      default: return 'Number';
    }
  };

  const handleSubmitComplete = async () => {
    if (!completeFromDate || !completeToDate || !completeNumber) {
      alert("Please enter all required fields.");
      return;
    }
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('fromDate', completeFromDate);
      formData.append('toDate', completeToDate);
      formData.append('number', completeNumber);
      formData.append('serviceType', selectedOrder.service_type);
      
      // Add document files if any
      if (completeDocuments) {
        Array.from(completeDocuments).forEach(file => {
          formData.append('service_documents', file);
        });
      }

      // Call backend to update status and create service record with documents
      await updateOrderStatus(() => servicesAPI.completeOrderWithDocuments(selectedOrder.id, formData));
      
      setShowCompleteModal(false);
      setSelectedOrder(null);
      setCompleteFromDate("");
      setCompleteToDate("");
      setCompleteNumber("");
      setCompleteDocuments(null);
      refetch();
    } catch (error) {
      console.error('Complete failed:', error);
      alert('Failed to complete order.');
    }
  };

  const handleSubmitTransferComplete = async () => {
    if (!transferAadhar || !transferMobile || !transferOwner || !transferAddress) {
      alert("Please enter all required fields.");
      return;
    }
    try {
      await updateOrderStatus(() =>
        servicesAPI.completeOrder(
          selectedOrder.id,
          undefined, // fromDate
          undefined, // toDate
          undefined, // number
          selectedOrder.service_type,
          {
            aadharNumber: transferAadhar,
            mobileNumber: transferMobile,
            registeredOwnerName: transferOwner,
            guardianInfo: transferGuardian,
            address: transferAddress,
          }
        )
      );
      setShowCompleteModal(false);
      setSelectedOrder(null);
      setTransferAadhar('');
      setTransferMobile('');
      setTransferOwner('');
      setTransferGuardian('');
      setTransferAddress('');
      refetch();
    } catch (error) {
      console.error('Complete failed:', error);
      alert('Failed to complete transfer.');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'initial':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading service orders: {error}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </MainLayout>
    );
  }

  const isTransfer = selectedOrder && selectedOrder.service_type?.toLowerCase() === 'transfer';
  const isHpaOrHpt = selectedOrder && ['hpa', 'hpt'].includes(selectedOrder.service_type?.toLowerCase());

  return (
    <MainLayout>
      <Card className='mt-3'>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by vehicle number, customer name, or service type..."
              value={searchTerm}
              onChange={handleSearch}
              leftIcon={<Search size={18} />}
              fullWidth
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-xs text-gray-500">Customer:</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Vehicle:</span>
                  <span className="text-sm text-gray-700 ml-1">{order.registration_number}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Service:</span>
                  <span className="text-sm text-gray-700 ml-1">{order.service_type}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Amount</span>
                    <span className="font-medium">₹{order.amount}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Paid</span>
                    <span className="font-medium">₹{order.amount_paid ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Pending</span>
                    <span className="font-medium">₹{Number(order.amount) - Number(order.amount_paid ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={e => {
                    if (popoverOpenId === order.id) {
                      setPopoverOpenId(null);
                      setAnchorRect(null);
                    } else {
                      setPopoverOpenId(order.id);
                      setAnchorRect(e.currentTarget.getBoundingClientRect());
                    }
                  }}
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
                <Popover
                  open={popoverOpenId === order.id}
                  anchorRect={anchorRect}
                  onClose={() => {
                    setPopoverOpenId(null);
                    setAnchorRect(null);
                  }}
                >
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleViewDetails(order)}>View Details</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleComplete(order)}>Complete</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleCancel(order)}>Cancel</button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => handlePayOrder(order)}
                  >
                    Pay
                  </button>
                </Popover>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Amount
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
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-700" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                        <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500">{order.registration_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.service_type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{order.amount}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{order.amount_paid ?? 0}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{Number(order.amount) - Number(order.amount_paid ?? 0)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      className="p-2 rounded-full hover:bg-gray-100"
                      onClick={e => {
                        if (popoverOpenId === order.id) {
                          setPopoverOpenId(null);
                          setAnchorRect(null);
                        } else {
                          setPopoverOpenId(order.id);
                          setAnchorRect(e.currentTarget.getBoundingClientRect());
                        }
                      }}
                    >
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>
                    <Popover
                      open={popoverOpenId === order.id}
                      anchorRect={anchorRect}
                      onClose={() => {
                        setPopoverOpenId(null);
                        setAnchorRect(null);
                      }}
                    >
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleViewDetails(order)}>View Details</button>
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleComplete(order)}>Complete</button>
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleCancel(order)}>Cancel</button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => handlePayOrder(order)}
                      >
                        Pay
                      </button>
                    </Popover>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPaymentModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Make Payment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Total Amount</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.amount} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Amount Paid</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.amount_paid ?? 0} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Pending Amount</label>
                <input
                  className="w-full bg-gray-100 rounded px-3 py-2"
                  readOnly
                  value={Number(selectedOrder.amount) - Number(selectedOrder.amount_paid ?? 0)}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Pay Amount</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  min={1}
                  max={Number(selectedOrder.amount) - Number(selectedOrder.amount_paid ?? 0)}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={handlePay}
                  disabled={
                    !payAmount ||
                    isNaN(Number(payAmount)) ||
                    Number(payAmount) < 1 ||
                    Number(payAmount) > (Number(selectedOrder.amount) - Number(selectedOrder.amount_paid ?? 0))
                  }
                >
                  Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && orderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Service Order Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-gray-800">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{orderDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Type:</span>
                      <span className="font-medium">{orderDetails.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(orderDetails.status)}`}>
                        {orderDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(orderDetails.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent:</span>
                      <span className="font-medium">{orderDetails.agent_name}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-gray-800">Customer & Vehicle</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{orderDetails.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">{orderDetails.registration_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make & Model:</span>
                      <span className="font-medium">{orderDetails.makers_name} {orderDetails.makers_classification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="font-medium">{orderDetails.fuel_used}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-8">
                <h3 className="font-semibold mb-3 text-gray-800">Payment Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">₹{orderDetails.actual_amount}</div>
                    <div className="text-sm text-gray-600">Original Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₹{orderDetails.discount}</div>
                    <div className="text-sm text-gray-600">Discount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{orderDetails.amount_paid}</div>
                    <div className="text-sm text-gray-600">Amount Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">₹{Number(orderDetails.amount) - Number(orderDetails.amount_paid)}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-4 text-gray-800">Order Timeline</h3>
                <div className="space-y-4">
                  {orderDetails.payment_history && orderDetails.payment_history.map((item: any, index: number) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                        {getTimelineIcon(item.payment_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.payment_type === 'initial' ? 'Order Created' : 'Payment Received'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.payment_type === 'initial' 
                                ? `Service order created for ₹${item.actual_amount} (after ₹${item.discount} discount = ₹${item.amount})`
                                : `Payment of ₹${item.amount} received`
                              }
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">₹{item.amount}</p>
                            <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                            {item.created_by_name && (
                              <p className="text-xs text-gray-500 flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {item.created_by_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {orderDetails.status === 'completed' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Order Completed</p>
                        <p className="text-sm text-gray-500">Service order has been completed successfully</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedOrder && isHpaOrHpt && selectedOrder.service_type?.toLowerCase() === 'hpt' ? (
        // HPT Modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCompleteModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Hypothecation Termination (HPT)</h2>
            <div className="mb-6 text-red-600 font-semibold">
              Are you sure you want to terminate hypothication?
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowCompleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={async () => {
                  try {
                    await updateOrderStatus(() =>
                      servicesAPI.completeOrder(
                        selectedOrder.id,
                        undefined, // fromDate
                        undefined, // toDate
                        undefined, // number
                        selectedOrder.service_type
                      )
                    );
                    setShowCompleteModal(false);
                    setSelectedOrder(null);
                    refetch();
                  } catch (error) {
                    alert('Failed to complete HPT order.');
                    console.error(error);
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : showCompleteModal && selectedOrder && isHpaOrHpt ? (
        // HPA Modal (if you want a separate modal for HPA, keep it here)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCompleteModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Add Hypothecation (HPA)</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Hypothecated To</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={hpaHypothecatedTo}
                  onChange={e => setHpaHypothecatedTo(e.target.value)}
                  placeholder="Enter bank or financier name"
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={async () => {
                    if (!hpaHypothecatedTo) {
                      alert('Please enter Hypothecated To');
                      return;
                    }
                    try {
                      await updateOrderStatus(() =>
                        servicesAPI.completeOrder(
                          selectedOrder.id,
                          undefined, // fromDate
                          undefined, // toDate
                          undefined, // number
                          selectedOrder.service_type,
                          { hypothicatedTo: hpaHypothecatedTo }
                        )
                      );
                      setShowCompleteModal(false);
                      setSelectedOrder(null);
                      setHpaHypothecatedTo('');
                      refetch();
                    } catch (error) {
                      alert('Failed to complete HPA order.');
                      console.error(error);
                    }
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : showCompleteModal && selectedOrder && isTransfer ? (
        // ...your transfer modal...
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCompleteModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Complete Transfer of Ownership</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Aadhar Number</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={transferAadhar} onChange={e => setTransferAadhar(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Mobile Number</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={transferMobile} onChange={e => setTransferMobile(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Registered Owner Name</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={transferOwner} onChange={e => setTransferOwner(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Guardian Info</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={transferGuardian} onChange={e => setTransferGuardian(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Address</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={transferAddress} onChange={e => setTransferAddress(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmitTransferComplete}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      ) : showCompleteModal && selectedOrder ? (
        // General/Old Modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCompleteModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Complete Service Order</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Vehicle Number</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.registration_number} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Owner Name</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.customer_name} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Service Type</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.service_type} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">{getNumberLabel(selectedOrder.service_type)}</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={completeNumber} onChange={e => setCompleteNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">From Date</label>
                <input type="date" className="w-full border rounded px-3 py-2" value={completeFromDate} onChange={e => setCompleteFromDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">To Date</label>
                <input type="date" className="w-full border rounded px-3 py-2" value={completeToDate} onChange={e => setCompleteToDate(e.target.value)} />
              </div>
              <div className="mb-4">
                <FileUpload
                  label={`Upload ${selectedOrder.service_type} Documents`}
                  name="service_documents"
                  accept="image/*,.pdf"
                  existingFiles={[]}
                  onFilesChange={(files) => setCompleteDocuments(files)}
                  maxFiles={5}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Note: Uploading new documents will replace existing documents for this service type.
                </p>
              </div>
              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmitComplete}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
};

export default ServiceOrders;