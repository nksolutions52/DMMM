import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Car, 
  FileCheck, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  RefreshCw,
  FilePlus,
  UserCheck,
  IndianRupee
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useApi } from '../hooks/useApi';
import { dashboardAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(
    () => dashboardAPI.getStats(),
    []
  );

  const { data: recentActivity, loading: activityLoading, error: activityError, refetch: refetchActivity } = useApi(
    () => dashboardAPI.getRecentActivity(10),
    []
  );

  const { data: upcomingRenewals, loading: renewalsLoading, error: renewalsError, refetch: refetchRenewals } = useApi(
    () => dashboardAPI.getUpcomingRenewals(5),
    []
  );

  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'car': return <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
      case 'file-plus': return <FilePlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
      case 'refresh-cw': return <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
      case 'clock': return <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
      default: return <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-600';
      case 'green': return 'bg-green-600';
      case 'orange': return 'bg-orange-600';
      case 'red': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getActivityIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'transfer of ownership':
        return <FilePlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />;
      case 'insurance renewal':
        return <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />;
      case 'tax payment':
        return <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-orange-700" />;
      default:
        return <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />;
    }
  };

  if (statsLoading) {
    return (
      <MainLayout>
        <LoadingSpinner size="lg" text="Loading dashboard..." className="h-64" />
      </MainLayout>
    );
  }

  if (statsError) {
    return (
      <MainLayout>
        <ErrorMessage message={statsError} onRetry={refetchStats} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 mt-3">
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {stats && stats.map((stat: any) => (
              <div
                key={stat.title}
                className="flex items-center bg-white/80 backdrop-blur-md rounded-xl shadow-md p-3 sm:p-6 border border-gray-100 hover:shadow-lg transition"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full mr-3 sm:mr-4 text-2xl ${getColorClass(stat.color)}`}
                >
                  {getStatIcon(stat.icon)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <Card
            title="Recent Activity"
            className="xl:col-span-2"
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/service-orders')}
              >
                View All
              </Button>
            }
          >
            {activityLoading ? (
              <LoadingSpinner className="h-32" />
            ) : activityError ? (
              <ErrorMessage message={activityError} onRetry={refetchActivity} showIcon={false} />
            ) : (
              <div className="divide-y divide-gray-200">
                {recentActivity && recentActivity.map((activity: any) => (
                  <div 
                    key={activity.id} 
                    className="py-3 flex items-start cursor-pointer hover:bg-gray-50 px-3 rounded-md transition-colors"
                    onClick={() => navigate('/service-orders')}
                  >
                    <div className="bg-blue-100 p-2 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                      {getActivityIcon(activity.service_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {activity.service_type}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        Vehicle: <span className="font-medium">{activity.registration_number}</span>
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1 gap-1">
                        <p className="text-xs text-gray-500 truncate">By: {activity.agent_name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          activity.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card 
            title="Upcoming Renewals" 
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/renewal-dues')}
              >
                View All
              </Button>
            }
          >
            {renewalsLoading ? (
              <LoadingSpinner className="h-32" />
            ) : renewalsError ? (
              <ErrorMessage message={renewalsError} onRetry={refetchRenewals} showIcon={false} />
            ) : (
              <div className="space-y-4">
                {upcomingRenewals && upcomingRenewals.slice(0, 3).map((renewal: any) => (
                  <div 
                    key={renewal.id}
                    className={`p-3 ${
                      renewal.status === 'overdue' 
                        ? 'bg-red-50 border-red-100' 
                        : renewal.days_left <= 7 
                        ? 'bg-yellow-50 border-yellow-100'
                        : 'bg-blue-50 border-blue-100'
                    } border rounded-lg cursor-pointer`}
                    onClick={() => navigate('/renewal-dues')}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                      <h4 className={`text-sm font-medium ${
                        renewal.status === 'overdue'
                          ? 'text-red-800'
                          : renewal.days_left <= 7
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      } truncate`}>
                        {renewal.renewal_type} Renewal
                      </h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                        renewal.status === 'overdue'
                          ? 'bg-red-200 text-red-800'
                          : renewal.days_left <= 7
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {renewal.status === 'overdue'
                          ? `${Math.abs(renewal.days_left)} days overdue`
                          : `${renewal.days_left} days left`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      {renewal.registration_number} - {renewal.registered_owner_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(renewal.due_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;