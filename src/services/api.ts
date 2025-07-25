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

// Create headers for file uploads (without Content-Type)
const getFileUploadHeaders = () => {
  const token = getAuthToken();
  return {
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

// File upload API request function
const fileUploadRequest = async (endpoint: string, formData: FormData) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getFileUploadHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }

    return data;
  } catch (error) {
    console.error('File Upload Error:', error);
    throw error;
  }
};

// File update API request function
const fileUpdateRequest = async (endpoint: string, formData: FormData) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'PATCH', // <-- Change from PUT to PATCH
      headers: getFileUploadHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'File update failed');
    }

    return data;
  } catch (error) {
    console.error('File Update Error:', error);
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
      
      // Trigger auto renewal dues check on login
      try {
        await renewalsAPI.autoCheck();
      } catch (error) {
        console.warn('Auto renewal check failed:', error);
        // Don't fail login if renewal check fails
      }
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
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/vehicles${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/vehicles/${id}`);
  },

  create: async (formData: FormData) => {
    return await fileUploadRequest('/vehicles', formData);
  },

  update: async (id: string, formData: FormData) => {
    return await fileUpdateRequest(`/vehicles/${id}`, formData);
  },

  delete: async (id: string) => {
    return await apiRequest(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  searchByRegistration: async (registrationNumber: string) => {
    return await apiRequest(`/vehicles/search/${registrationNumber}`);
  },

  deleteDocument: async (documentId: string) => {
    return await apiRequest(`/vehicles/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  downloadDocument: (documentId: string) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/vehicles/documents/${documentId}/download`;
    
    // Create a temporary link and click it to download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    if (token) {
      link.setAttribute('Authorization', `Bearer ${token}`);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      if (value !== undefined && value !== null && value !== '') {
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
  },

  completeOrder: async (
    id: string,
    fromDate?: string,
    toDate?: string,
    number?: string,
    serviceType?: string,
    transferDetails?: {
      aadharNumber: string;
      mobileNumber: string;
      registeredOwnerName: string;
      guardianInfo: string;
      address: string;
    }
  ) => {
    return await apiRequest(`/services/orders/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({
        fromDate,
        toDate,
        number,
        serviceType,
        ...(transferDetails || {})
      }),
    });
  },

  completeOrderWithDocuments: async (id: string, formData: FormData) => {
    return await fileUpdateRequest(`/services/orders/${id}/complete-with-documents`, formData);
  }
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
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
      if (value !== undefined && value !== null && value !== '') {
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
  },

  // Manual trigger to check renewal dues
  checkDues: async () => {
    return await apiRequest('/renewals/check-dues', {
      method: 'POST',
    });
  },

  // Auto check on login
  autoCheck: async () => {
    return await apiRequest('/renewals/auto-check', {
      method: 'POST',
    });
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
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/vehicles/registration${queryString ? `?${queryString}` : ''}`);
  },

  getServicesSummary: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/services/summary${queryString ? `?${queryString}` : ''}`);
  },

  getDailyRevenue: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/revenue/daily${queryString ? `?${queryString}` : ''}`);
  },

  getRenewalDues: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
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
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/appointments/summary${queryString ? `?${queryString}` : ''}`);
  },

  getAgentPerformance: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/agents/performance${queryString ? `?${queryString}` : ''}`);
  },

  getMonthlyTrends: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/reports/trends/monthly${queryString ? `?${queryString}` : ''}`);
  },

  exportReport: async (reportType: string, format: string) => {
    return await apiRequest(`/reports/export/${reportType}?format=${format}`);
  }
};

// Users API
export const usersAPI = {
  getAll: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return await apiRequest(`/users${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/users/${id}`);
  },

  create: async (userData: any) => {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: any) => {
    return await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  getRoles: async () => {
    return await apiRequest('/users/roles/list');
  }
};