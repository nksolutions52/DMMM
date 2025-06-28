const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  }
};

// Vehicles API
export const vehiclesAPI = {
  getAll: async (params: { page?: number; limit?: number; search?: string; type?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/vehicles${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/vehicles/${id}`);
  },

  create: async (vehicleData: any) => {
    return await apiRequest('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  },

  update: async (id: string, vehicleData: any) => {
    return await apiRequest(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  searchByRegistration: async (registrationNumber: string) => {
    return await apiRequest(`/vehicles/search/${registrationNumber}`);
  }
};

// Services API
export const servicesAPI = {
  getTypes: async () => {
    return await apiRequest('/services/types');
  },

  getOrders: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/services/orders${queryString ? `?${queryString}` : ''}`);
  },

  getOrderById: async (id: string) => {
    return await apiRequest(`/services/orders/${id}`);
  },

  createOrder: async (orderData: any) => {
    return await apiRequest('/services/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateOrderStatus: async (id: string, status: string) => {
    return await apiRequest(`/services/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  makePayment: async (id: string, amount: number) => {
    return await apiRequest(`/services/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/appointments${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/appointments/${id}`);
  },

  create: async (appointmentData: any) => {
    return await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  update: async (id: string, appointmentData: any) => {
    return await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return await apiRequest(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  getAvailableSlots: async (date: string) => {
    return await apiRequest(`/appointments/available-slots/${date}`);
  }
};

// Renewals API
export const renewalsAPI = {
  getAll: async (params: { page?: number; limit?: number; search?: string; type?: string; status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/renewals${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/renewals/${id}`);
  },

  processRenewal: async (id: string, amount: number) => {
    return await apiRequest(`/renewals/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return await apiRequest(`/renewals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getStats: async () => {
    return await apiRequest('/renewals/stats/overview');
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    return await apiRequest('/dashboard/stats');
  },

  getRecentActivity: async (limit: number = 10) => {
    return await apiRequest(`/dashboard/recent-activity?limit=${limit}`);
  },

  getUpcomingRenewals: async (limit: number = 5) => {
    return await apiRequest(`/dashboard/upcoming-renewals?limit=${limit}`);
  },

  getRevenueSummary: async (period: string = 'month') => {
    return await apiRequest(`/dashboard/revenue-summary?period=${period}`);
  },

  getVehicleDistribution: async () => {
    return await apiRequest('/dashboard/vehicle-distribution');
  },

  getRegistrationTrends: async () => {
    return await apiRequest('/dashboard/registration-trends');
  }
};

// Reports API
export const reportsAPI = {
  getVehicleRegistration: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/vehicles/registration${queryString ? `?${queryString}` : ''}`);
  },

  getServicesSummary: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/services/summary${queryString ? `?${queryString}` : ''}`);
  },

  getDailyRevenue: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/revenue/daily${queryString ? `?${queryString}` : ''}`);
  },

  getRenewalDues: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/renewals/dues${queryString ? `?${queryString}` : ''}`);
  },

  getVehiclesByType: async () => {
    return await apiRequest('/reports/vehicles/by-type');
  },

  getVehiclesByManufacturer: async () => {
    return await apiRequest('/reports/vehicles/by-manufacturer');
  },

  getAppointmentsSummary: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/appointments/summary${queryString ? `?${queryString}` : ''}`);
  }
};