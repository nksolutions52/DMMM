import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { 
  FileText, 
  Download, 
  Calendar, 
  Car, 
  IndianRupee, 
  Users, 
  TrendingUp,
  BarChart3,
  PieChart,
  FileBarChart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Wrench,
  DollarSign,
  Shield,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { reportsAPI } from '../services/api';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
  endpoint: string;
}

interface ReportData {
  id: string;
  [key: string]: any;
}

const Reports: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [showReportTable, setShowReportTable] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportCard | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [reportFilters, setReportFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: generateReport } = useApiMutation();

  const reportCategories = [
    { id: 'all', name: 'All Reports', count: 12 },
    { id: 'vehicle', name: 'Vehicle Reports', count: 4 },
    { id: 'service', name: 'Service Reports', count: 3 },
    { id: 'revenue', name: 'Revenue Reports', count: 2 },
    { id: 'compliance', name: 'Compliance Reports', count: 2 },
    { id: 'operational', name: 'Operational Reports', count: 1 }
  ];

  const reports: ReportCard[] = [
    // Vehicle Reports
    {
      id: 'vehicle-registration',
      title: 'Vehicle Registration Report',
      description: 'Complete list of all registered vehicles with owner details and registration information',
      icon: <Car className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-blue-500',
      endpoint: '/vehicles/registration'
    },
    {
      id: 'vehicle-by-type',
      title: 'Vehicles by Type Report',
      description: 'Breakdown of vehicles by Transport/Non-Transport categories with fuel type analysis',
      icon: <PieChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-green-500',
      endpoint: '/vehicles/by-type'
    },
    {
      id: 'vehicle-by-manufacturer',
      title: 'Vehicles by Manufacturer',
      description: 'Vehicle count grouped by manufacturer brands with market share analysis',
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-purple-500',
      endpoint: '/vehicles/by-manufacturer'
    },
    {
      id: 'monthly-trends',
      title: 'Monthly Registration Trends',
      description: 'Monthly vehicle registration trends with revenue correlation analysis',
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-indigo-500',
      endpoint: '/trends/monthly'
    },

    // Service Reports
    {
      id: 'service-orders-summary',
      title: 'Service Orders Summary',
      description: 'Complete overview of all service orders with status tracking and revenue analysis',
      icon: <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-blue-600',
      endpoint: '/services/summary'
    },
    {
      id: 'agent-performance',
      title: 'Agent Performance Report',
      description: 'Service completion statistics and performance metrics by agent',
      icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-purple-600',
      endpoint: '/agents/performance'
    },
    {
      id: 'appointment-summary',
      title: 'Appointment Summary',
      description: 'Overview of scheduled and completed appointments with efficiency metrics',
      icon: <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-blue-700',
      endpoint: '/appointments/summary'
    },

    // Revenue Reports
    {
      id: 'daily-revenue',
      title: 'Daily Revenue Report',
      description: 'Day-wise revenue collection from all services with detailed breakdown',
      icon: <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-emerald-600',
      endpoint: '/revenue/daily'
    },
    {
      id: 'revenue-trends',
      title: 'Revenue Trends Analysis',
      description: 'Revenue analysis with trends, forecasting and service-wise breakdown',
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-green-800',
      endpoint: '/revenue/trends'
    },

    // Compliance Reports
    {
      id: 'renewal-dues',
      title: 'Renewal Dues Report',
      description: 'Upcoming and overdue renewals (Insurance, Tax, FC, Permit, PUC) with urgency levels',
      icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'compliance',
      color: 'bg-red-600',
      endpoint: '/renewals/dues'
    },
    {
      id: 'compliance-status',
      title: 'Compliance Status Report',
      description: 'Overall compliance status of vehicles with document expiry tracking',
      icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'compliance',
      color: 'bg-red-700',
      endpoint: '/compliance/status'
    },

    // Operational Reports
    {
      id: 'system-usage',
      title: 'System Usage Report',
      description: 'User activity and system utilization statistics with performance metrics',
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'operational',
      color: 'bg-gray-600',
      endpoint: '/system/usage'
    }
  ];

  const quickStats = [
    {
      id: 'vehicles',
      value: '1,256',
      label: 'Total Vehicles',
      icon: <Car size={24} className="sm:w-7 sm:h-7" />,
      color: '#2563eb',
      bgColor: '#dbeafe',
    },
    {
      id: 'services',
      value: '342',
      label: 'Services Done',
      icon: <Wrench size={24} className="sm:w-7 sm:h-7" />,
      color: '#059669',
      bgColor: '#d1fae5',
    },
    {
      id: 'revenue',
      value: '₹2.5L',
      label: 'Total Revenue',
      icon: <DollarSign size={24} className="sm:w-7 sm:h-7" />,
      color: '#f59e42',
      bgColor: '#fef3c7',
    },
    {
      id: 'compliance',
      value: '23',
      label: 'Renewal Dues',
      icon: <Shield size={24} className="sm:w-7 sm:h-7" />,
      color: '#7c3aed',
      bgColor: '#ede9fe',
    },
  ];

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateReport = async (report: ReportCard) => {
    setLoading(true);
    setError(null);
    setCurrentReport(report);
    
    try {
      const filters = {
        ...reportFilters,
        startDate: dateRange.from,
        endDate: dateRange.to,
        page: 1,
        limit: 50
      };

      let data;
      switch (report.id) {
        case 'vehicle-registration':
          data = await generateReport(() => reportsAPI.getVehicleRegistration(filters));
          break;
        case 'service-orders-summary':
          data = await generateReport(() => reportsAPI.getServicesSummary(filters));
          break;
        case 'daily-revenue':
          data = await generateReport(() => reportsAPI.getDailyRevenue(filters));
          break;
        case 'renewal-dues':
          data = await generateReport(() => reportsAPI.getRenewalDues(filters));
          break;
        case 'vehicle-by-type':
          data = await generateReport(() => reportsAPI.getVehiclesByType());
          break;
        case 'vehicle-by-manufacturer':
          data = await generateReport(() => reportsAPI.getVehiclesByManufacturer());
          break;
        case 'appointment-summary':
          data = await generateReport(() => reportsAPI.getAppointmentsSummary(filters));
          break;
        default:
          throw new Error('Report type not implemented');
      }
      
      setReportData(data.data);
      setCurrentPage(1);
      setShowReportTable(true);
    } catch (error: any) {
      setError(error.message || 'Failed to generate report');
      console.error('Report generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReport = () => {
    setShowReportTable(false);
    setCurrentReport(null);
    setReportData(null);
    setCurrentPage(1);
    setError(null);
  };

  const handleExportReport = async (format: 'csv' | 'pdf') => {
    if (!currentReport) return;
    
    try {
      // This would trigger the export functionality
      const exportData = await generateReport(() => 
        reportsAPI.exportReport(currentReport.id, format)
      );
      
      // Handle the download
      alert(`${format.toUpperCase()} export will be downloaded`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    // Handle different report types
    if (currentReport?.id === 'vehicle-registration' && reportData.vehicles) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration No</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner Name</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Type</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Date</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.vehicles.map((vehicle: any, index: number) => (
                <tr key={vehicle.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{vehicle.registration_number}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{vehicle.registered_owner_name}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{vehicle.type}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{vehicle.makers_name}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{new Date(vehicle.date_of_registration).toLocaleDateString()}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{vehicle.mobile_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (currentReport?.id === 'service-orders-summary' && reportData.serviceOrders) {
      return (
        <div>
          {/* Statistics Cards */}
          {reportData.statistics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.statistics.total_orders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">₹{Number(reportData.statistics.total_revenue || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{reportData.statistics.pending_orders}</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{reportData.statistics.completed_orders}</div>
                <div className="text-sm text-gray-600">Completed Orders</div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.serviceOrders.map((order: any, index: number) => (
                  <tr key={order.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{order.registration_number}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{order.service_type}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{order.customer_name}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">₹{order.amount}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{order.agent_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (currentReport?.id === 'daily-revenue' && reportData.dailyRevenue) {
      return (
        <div>
          {/* Summary Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">₹{Number(reportData.summary.grand_total || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹{Number(reportData.summary.total_collected || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Collected</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">₹{Number(reportData.summary.total_pending || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{reportData.summary.total_orders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fitness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.dailyRevenue.map((day: any, index: number) => (
                  <tr key={day.date || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{day.total_orders}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">₹{Number(day.total_revenue || 0).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">₹{Number(day.collected_revenue || 0).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">₹{Number(day.pending_revenue || 0).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">₹{Number(day.transfer_revenue || 0).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">₹{Number(day.fitness_revenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Generic table renderer for other report types
    if (Array.isArray(reportData)) {
      if (reportData.length === 0) {
        return <div className="text-center py-8 text-gray-500">No data available for this report.</div>;
      }

      const headers = Object.keys(reportData[0]).filter(key => key !== 'id');
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.map((row: any, index: number) => (
                <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {headers.map(header => (
                    <td key={header} className="px-4 sm:px-6 py-4 text-sm text-gray-900 break-words">
                      {row[header] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="text-center py-8 text-gray-500">No data available for this report.</div>;
  };

  if (showReportTable && currentReport) {
    return (
      <MainLayout>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mt-3 gap-4">
          <div className="flex items-center">
            <button
              onClick={handleCloseReport}
              className="mr-3 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{currentReport.title}</h1>
              <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              leftIcon={<Download size={18} />}
              onClick={() => handleExportReport('csv')}
              className="w-full sm:w-auto"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              leftIcon={<Download size={18} />}
              onClick={() => handleExportReport('pdf')}
              className="w-full sm:w-auto"
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={18} />}
              onClick={() => handleGenerateReport(currentReport)}
              className="w-full sm:w-auto"
              isLoading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          {loading ? (
            <LoadingSpinner size="lg" text="Generating report..." className="h-64" />
          ) : error ? (
            <ErrorMessage message={error} onRetry={() => handleGenerateReport(currentReport)} />
          ) : (
            renderReportContent()
          )}
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Quick Statistics */}
      <Card className="mb-6 mt-3">
        <div className="mb-4 text-lg font-bold text-gray-800">Quick Statistics</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickStats.map((stat) => (
            <div
              key={stat.id}
              className="flex items-center bg-white rounded-xl shadow-md p-3 sm:p-5 border border-gray-100 hover:shadow-lg transition"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full mr-3 sm:mr-4"
                style={{ backgroundColor: stat.bgColor || "#e0e7ff", color: stat.color || "#3730a3" }}
              >
                {stat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
          <div className="flex-1">
            <Input
              label="Search Reports"
              placeholder="Search by report name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              fullWidth
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              label="From Date"
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="min-w-[140px]"
            />
            <Input
              label="To Date"
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="min-w-[140px]"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="xl:col-span-1">
          <Card title="Report Categories">
            <div className="space-y-2">
              {reportCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm truncate">{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      {category.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="xl:col-span-3">
          <div className="max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`flex flex-col bg-white rounded-xl shadow-md border-l-4 p-4 sm:p-5 mb-4 transition-transform hover:scale-105 hover:shadow-lg`}
                  style={{ borderColor: report.color }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gray-100 mr-3 sm:mr-4" style={{ color: report.color }}>
                      {report.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-lg text-gray-800 break-words">{report.title}</h3>
                      <span className="text-xs text-gray-400 uppercase">{report.category}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm flex-1 mb-4">{report.description}</p>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleGenerateReport(report)}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-sm"
                      isLoading={loading && currentReport?.id === report.id}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No reports found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or category filter.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;