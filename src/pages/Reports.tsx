import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
  Shield
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
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
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const reportCategories = [
    { id: 'all', name: 'All Reports', count: 24 },
    { id: 'vehicle', name: 'Vehicle Reports', count: 8 },
    { id: 'service', name: 'Service Reports', count: 6 },
    { id: 'revenue', name: 'Revenue Reports', count: 5 },
    { id: 'compliance', name: 'Compliance Reports', count: 3 },
    { id: 'operational', name: 'Operational Reports', count: 2 }
  ];

  const reports: ReportCard[] = [
    // Vehicle Reports
    {
      id: 'vehicle-registration',
      title: 'Vehicle Registration Report',
      description: 'Complete list of all registered vehicles with details',
      icon: <Car className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-blue-500'
    },
    {
      id: 'vehicle-by-type',
      title: 'Vehicles by Type Report',
      description: 'Breakdown of vehicles by Transport/Non-Transport categories',
      icon: <PieChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-green-500'
    },
    {
      id: 'vehicle-by-fuel',
      title: 'Vehicles by Fuel Type',
      description: 'Distribution of vehicles by fuel type (Petrol, Diesel, CNG, etc.)',
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-purple-500'
    },
    {
      id: 'vehicle-by-manufacturer',
      title: 'Vehicles by Manufacturer',
      description: 'Vehicle count grouped by manufacturer brands',
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-indigo-500'
    },
    {
      id: 'vehicle-age-analysis',
      title: 'Vehicle Age Analysis',
      description: 'Analysis of vehicle fleet by manufacturing year',
      icon: <Clock className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-orange-500'
    },
    {
      id: 'new-registrations',
      title: 'New Registrations Report',
      description: 'Recently registered vehicles within specified date range',
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-cyan-500'
    },
    {
      id: 'vehicle-ownership-transfer',
      title: 'Ownership Transfer Report',
      description: 'List of vehicles with ownership transfer records',
      icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-pink-500'
    },
    {
      id: 'hypothecated-vehicles',
      title: 'Hypothecated Vehicles Report',
      description: 'Vehicles with active loan/hypothecation details',
      icon: <FileBarChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'vehicle',
      color: 'bg-teal-500'
    },

    // Service Reports
    {
      id: 'service-orders-summary',
      title: 'Service Orders Summary',
      description: 'Complete overview of all service orders and their status',
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-blue-600'
    },
    {
      id: 'service-by-type',
      title: 'Services by Type Report',
      description: 'Breakdown of services by type (Transfer, Fitness, Insurance, etc.)',
      icon: <PieChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-green-600'
    },
    {
      id: 'pending-services',
      title: 'Pending Services Report',
      description: 'List of all pending service orders requiring attention',
      icon: <Clock className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-yellow-600'
    },
    {
      id: 'completed-services',
      title: 'Completed Services Report',
      description: 'Successfully completed service orders within date range',
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-green-700'
    },
    {
      id: 'service-agent-performance',
      title: 'Agent Performance Report',
      description: 'Service completion statistics by agent',
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-purple-600'
    },
    {
      id: 'service-turnaround-time',
      title: 'Service Turnaround Time',
      description: 'Average time taken to complete different types of services',
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'service',
      color: 'bg-indigo-600'
    },

    // Revenue Reports
    {
      id: 'daily-revenue',
      title: 'Daily Revenue Report',
      description: 'Day-wise revenue collection from all services',
      icon: <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-emerald-600'
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue Report',
      description: 'Month-wise revenue analysis and trends',
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-green-800'
    },
    {
      id: 'revenue-by-service',
      title: 'Revenue by Service Type',
      description: 'Revenue breakdown by different service categories',
      icon: <PieChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-teal-600'
    },
    {
      id: 'payment-status',
      title: 'Payment Status Report',
      description: 'Outstanding payments and collection status',
      icon: <FileBarChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-orange-600'
    },
    {
      id: 'revenue-forecast',
      title: 'Revenue Forecast Report',
      description: 'Projected revenue based on historical data and trends',
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'revenue',
      color: 'bg-purple-700'
    },

    // Compliance Reports
    {
      id: 'renewal-dues',
      title: 'Renewal Dues Report',
      description: 'Upcoming and overdue renewals (Insurance, Tax, FC, Permit)',
      icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'compliance',
      color:  'bg-red-600'
    },
    {
      id: 'expired-documents',
      title: 'Expired Documents Report',
      description: 'Vehicles with expired PUC, Insurance, or other documents',
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'compliance',
      color: 'bg-red-700'
    },
    {
      id: 'fitness-due',
      title: 'Fitness Certificate Due',
      description: 'Commercial vehicles due for fitness certificate renewal',
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'compliance',
      color: 'bg-yellow-700'
    },

    // Operational Reports
    {
      id: 'appointment-summary',
      title: 'Appointment Summary',
      description: 'Overview of scheduled and completed appointments',
      icon: <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'operational',
      color: 'bg-blue-700'
    },
    {
      id: 'system-usage',
      title: 'System Usage Report',
      description: 'User activity and system utilization statistics',
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />,
      category: 'operational',
      color: 'bg-gray-600'
    }
  ];

  const quickStats = [
    {
      id: 'vehicles',
      value: 120,
      label: 'Total Vehicles',
      icon: <Car size={24} className="sm:w-7 sm:h-7" />,
      color: '#2563eb',
      bgColor: '#dbeafe',
    },
    {
      id: 'services',
      value: 45,
      label: 'Services Done',
      icon: <Wrench size={24} className="sm:w-7 sm:h-7" />,
      color: '#059669',
      bgColor: '#d1fae5',
    },
    {
      id: 'revenue',
      value: '₹250000',
      label: 'Revenue',
      icon: <DollarSign size={24} className="sm:w-7 sm:h-7" />,
      color: '#f59e42',
      bgColor: '#fef3c7',
    },
    {
      id: 'compliance',
      value: 8,
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

  // Mock data generator for different report types
  const generateMockData = (reportId: string): ReportData[] => {
    switch (reportId) {
      case 'vehicle-registration':
        return Array.from({ length: 50 }, (_, i) => ({
          id: `VEH${String(i + 1).padStart(3, '0')}`,
          registrationNumber: `KA01MJ${2020 + (i % 4)}${String(i + 1).padStart(3, '0')}`,
          ownerName: `Owner ${i + 1}`,
          vehicleType: i % 2 === 0 ? 'Transport' : 'Non Transport',
          manufacturer: ['Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra'][i % 4],
          model: ['Swift', 'Creta', 'Harrier', 'Bolero'][i % 4],
          registrationDate: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          status: 'Active'
        }));

      case 'service-orders-summary':
        return Array.from({ length: 35 }, (_, i) => ({
          id: `SO${String(i + 1).padStart(3, '0')}`,
          vehicleNumber: `KA01MJ${2020 + (i % 4)}${String(i + 1).padStart(3, '0')}`,
          serviceType: ['Transfer of Ownership', 'Fitness', 'Insurance Renewal', 'Tax Payment'][i % 4],
          customerName: `Customer ${i + 1}`,
          amount: `₹${(1000 + (i * 100))}`,
          status: ['Pending', 'Completed', 'In Progress'][i % 3],
          createdDate: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          agentName: `Agent ${(i % 3) + 1}`
        }));

      case 'daily-revenue':
        return Array.from({ length: 30 }, (_, i) => ({
          id: `REV${String(i + 1).padStart(3, '0')}`,
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          totalOrders: Math.floor(Math.random() * 20) + 5,
          totalRevenue: `₹${(Math.floor(Math.random() * 50000) + 10000).toLocaleString()}`,
          transferRevenue: `₹${(Math.floor(Math.random() * 20000) + 5000).toLocaleString()}`,
          fitnessRevenue: `₹${(Math.floor(Math.random() * 15000) + 3000).toLocaleString()}`,
          insuranceRevenue: `₹${(Math.floor(Math.random() * 10000) + 2000).toLocaleString()}`,
          taxRevenue: `₹${(Math.floor(Math.random() * 8000) + 1000).toLocaleString()}`
        }));

      case 'renewal-dues':
        return Array.from({ length: 25 }, (_, i) => ({
          id: `REN${String(i + 1).padStart(3, '0')}`,
          vehicleNumber: `KA01MJ${2020 + (i % 4)}${String(i + 1).padStart(3, '0')}`,
          ownerName: `Owner ${i + 1}`,
          renewalType: ['Insurance', 'Tax', 'FC', 'Permit'][i % 4],
          dueDate: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          daysLeft: Math.floor(Math.random() * 60) - 30,
          amount: `₹${(500 + (i * 50))}`,
          status: Math.random() > 0.7 ? 'Overdue' : 'Upcoming'
        }));

      default:
        return Array.from({ length: 20 }, (_, i) => ({
          id: `GEN${String(i + 1).padStart(3, '0')}`,
          item: `Item ${i + 1}`,
          description: `Description for item ${i + 1}`,
          value: `Value ${i + 1}`,
          date: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          status: ['Active', 'Inactive', 'Pending'][i % 3]
        }));
    }
  };

  const handleGenerateReport = (report: ReportCard) => {
    setCurrentReport(report);
    const data = generateMockData(report.id);
    setReportData(data);
    setCurrentPage(1);
    setShowReportTable(true);
  };

  const handleCloseReport = () => {
    setShowReportTable(false);
    setCurrentReport(null);
    setReportData([]);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = reportData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderTableHeaders = () => {
    if (!currentData.length) return null;
    
    const headers = Object.keys(currentData[0]).filter(key => key !== 'id');
    return headers.map(header => (
      <th key={header} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
      </th>
    ));
  };

  const renderTableRows = () => {
    return currentData.map((row, index) => (
      <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        {Object.entries(row).filter(([key]) => key !== 'id').map(([key, value]) => (
          <td key={key} className="px-4 sm:px-6 py-4 text-sm text-gray-900 break-words">
            {key === 'status' ? (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                value === 'Active' || value === 'Completed' ? 'bg-green-100 text-green-800' :
                value === 'Pending' || value === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                value === 'Overdue' || value === 'Inactive' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {value}
              </span>
            ) : (
              value
            )}
          </td>
        ))}
      </tr>
    ));
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
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              leftIcon={<Download size={18} />}
              className="w-full sm:w-auto"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              leftIcon={<Download size={18} />}
              className="w-full sm:w-auto"
            >
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, reportData.length)} of {reportData.length} entries
            </div>
            <div className="text-sm text-gray-600">
              Generated on: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {renderTableHeaders()}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {renderTableRows()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft size={16} />}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight size={16} />}
              >
                Next
              </Button>
            </div>
          </div>
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
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 sm:px-4 py-2 rounded font-semibold border border-gray-300 bg-white hover:bg-blue-50 transition text-sm`}
              >
                Monthly
              </button>
              <button
                className={`px-3 sm:px-4 py-2 rounded font-semibold border border-gray-300 bg-white hover:bg-blue-50 transition text-sm`}
              >
                Quarterly
              </button>
              <button
                className={`px-3 sm:px-4 py-2 rounded font-semibold border border-gray-300 bg-white hover:bg-blue-50 transition text-sm`}
              >
                Yearly
              </button>
            </div>
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
          <div className="max-h-[500px] overflow-y-auto">
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
                    <button
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-sm"
                      onClick={() => handleGenerateReport(report)}
                    >
                      Generate
                    </button>
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