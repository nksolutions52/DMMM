import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Search, FileText, MoreVertical } from 'lucide-react';
import { ServiceOrder } from '../types';
import Popover from '../components/ui/Popover';

const mockServiceOrders: ServiceOrder[] = [
  {
    id: '1',
    vehicleNumber: 'KA01MJ2022',
    serviceType: 'Transfer of Ownership',
    amount: 1500,
    amountPaid: 1000,
    status: 'pending',
    createdAt: '2024-03-20T10:00:00',
    customerName: 'Rahul Sharma'
  },
  {
    id: '2',
    vehicleNumber: 'MH02AB2021',
    serviceType: 'Fitness',
    amount: 600,
    amountPaid: 300,
    status: 'completed',
    createdAt: '2024-03-19T15:30:00',
    customerName: 'Priya Patel'
  }
];

const ServiceOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState(mockServiceOrders);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = mockServiceOrders.filter(order =>
      order.vehicleNumber.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.serviceType.toLowerCase().includes(term)
    );
    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handlePay = () => {
    if (selectedOrder && payAmount > 0) {
      selectedOrder.amountPaid = Number(selectedOrder.amountPaid ?? 0) + payAmount;
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPayAmount(0);
    }
  };

  const handleComplete = (order: ServiceOrder) => {
    setPopoverOpenId(null);
  };
  const handleCancel = (order: ServiceOrder) => {
    setPopoverOpenId(null);
  };
  const handlePayOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
    setPopoverOpenId(null);
    setAnchorRect(null);
  };
  const handleView = (order: ServiceOrder) => {
    setPopoverOpenId(null);
  };

  useEffect(() => {
    if (!popoverOpenId) return;
    function handleClick(event: MouseEvent) {
      setPopoverOpenId(null);
      setAnchorRect(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpenId]);

  return (
    <MainLayout>
      <Card className='mt-3'>
        <div className="mb-6">
          <Input
            placeholder="Search by vehicle number, customer name, or service type..."
            value={searchTerm}
            onChange={handleSearch}
            leftIcon={<Search size={18} />}
            fullWidth
          />
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-xs text-gray-500">Customer:</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Vehicle:</span>
                  <span className="text-sm text-gray-700 ml-1">{order.vehicleNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Service:</span>
                  <span className="text-sm text-gray-700 ml-1">{order.serviceType}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Amount</span>
                    <span className="font-medium">₹{order.amount}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Paid</span>
                    <span className="font-medium">₹{order.amountPaid ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Pending</span>
                    <span className="font-medium">₹{Number(order.amount) - Number(order.amountPaid ?? 0)}</span>
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
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleComplete(order)}>Complete</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleCancel(order)}>Cancel</button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => handlePayOrder(order)}
                  >
                    Pay
                  </button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleView(order)}>View</button>
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
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-700" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                        <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.vehicleNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.serviceType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{order.amount}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{order.amountPaid ?? 0}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{Number(order.amount) - Number(order.amountPaid ?? 0)}</div>
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
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleComplete(order)}>Complete</button>
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleCancel(order)}>Cancel</button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => handlePayOrder(order)}
                      >
                        Pay
                      </button>
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => handleView(order)}>View</button>
                    </Popover>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPaymentModal(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Make Payment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Total Amount</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.amount} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Amount Paid</label>
                <input className="w-full bg-gray-100 rounded px-3 py-2" readOnly value={selectedOrder.amountPaid ?? 0} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Pending Amount</label>
                <input
                  className="w-full bg-gray-100 rounded px-3 py-2"
                  readOnly
                  value={Number(selectedOrder.amount) - Number(selectedOrder.amountPaid ?? 0)}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Pay Amount</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  min={1}
                  max={Number(selectedOrder.amount) - Number(selectedOrder.amountPaid ?? 0)}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={handlePay}
                  disabled={
                    payAmount < 1 ||
                    payAmount > (Number(selectedOrder.amount) - Number(selectedOrder.amountPaid ?? 0))
                  }
                >
                  Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ServiceOrders;