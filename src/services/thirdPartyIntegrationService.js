import axiosInstance from '../api/userAxios';

const API_URL = '/integrations';

const formatError = (error) => {
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  const { status, data } = error.response;

  if (status === 401) {
    return 'You are not authorized to access this resource.';
  }

  if (status === 404) {
    return 'Integration not found.';
  }

  if (status === 400) {
    return data?.message || data?.details || 'Please check your input and try again.';
  }

  return data?.message || data?.details || 'Something went wrong. Please try again later.';
};

const thirdPartyIntegrationService = {
  // Admin endpoints
  async listIntegrations(params = {}) {
    try {
      const response = await axiosInstance.get(API_URL, { params });
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  async getIntegrationDetails(id) {
    try {
      const response = await axiosInstance.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  async createIntegration(integrationData) {
    try {
      const response = await axiosInstance.post(API_URL, integrationData);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  async updateIntegration(id, integrationData) {
    try {
      const response = await axiosInstance.put(`${API_URL}/${id}`, integrationData);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  async deleteIntegration(id) {
    try {
      const response = await axiosInstance.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  async testIntegration(id) {
    try {
      const response = await axiosInstance.post(`${API_URL}/${id}/test`);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  async updateIntegrationStatus(id, statusData) {
    try {
      const response = await axiosInstance.patch(`${API_URL}/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },

  // User endpoints
  async getUserAccessibleIntegrations() {
    try {
      const response = await axiosInstance.get(`${API_URL}/user/accessible`);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  }
};

export default thirdPartyIntegrationService;