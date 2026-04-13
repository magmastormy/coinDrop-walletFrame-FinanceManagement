import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../services/adminService';

const initialState = {
  dashboard: {
    overview: null,
    statistics: null,
    loading: false,
    error: null
  },
  users: {
    list: [],
    pagination: null,
    currentUser: null,
    loading: false,
    error: null
  },
  transactions: {
    list: [],
    pagination: null,
    statistics: null,
    loading: false,
    error: null
  },
  system: {
    health: null,
    metrics: null,
    loading: false,
    error: null
  },
  reports: {
    summary: null,
    detailed: null,
    loading: false,
    error: null
  }
};

export const fetchDashboardOverview = createAsyncThunk(
  'admin/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboardOverview();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchDashboardStatistics = createAsyncThunk(
  'admin/fetchDashboardStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboardStatistics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.listUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchUserDetails = createAsyncThunk(
  'admin/fetchUserDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserDetails(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await adminService.createUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateUser(id, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.deleteUser(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'admin/fetchTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.listTransactions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchTransactionDetails = createAsyncThunk(
  'admin/fetchTransactionDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.getTransactionDetails(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchTransactionStatistics = createAsyncThunk(
  'admin/fetchTransactionStatistics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getTransactionStatistics(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchSystemHealth = createAsyncThunk(
  'admin/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSystemHealth();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchSystemMetrics = createAsyncThunk(
  'admin/fetchSystemMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSystemMetrics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchSummaryReport = createAsyncThunk(
  'admin/fetchSummaryReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getSummaryReport(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchDetailedReport = createAsyncThunk(
  'admin/fetchDetailedReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getDetailedReport(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.dashboard.error = null;
      state.users.error = null;
      state.transactions.error = null;
      state.system.error = null;
      state.reports.error = null;
    },
    clearCurrentUser: (state) => {
      state.users.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.overview = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
      })
      .addCase(fetchDashboardStatistics.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardStatistics.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.statistics = action.payload;
      })
      .addCase(fetchDashboardStatistics.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
      })
      .addCase(fetchUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.list = action.payload.users;
        state.users.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      .addCase(fetchUserDetails.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.currentUser = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.list = [action.payload, ...state.users.list];
      })
      .addCase(createUser.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      .addCase(updateUser.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.list = state.users.list.map(user =>
          user._id === action.payload._id ? action.payload : user
        );
        if (state.users.currentUser?._id === action.payload._id) {
          state.users.currentUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      .addCase(deleteUser.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.list = state.users.list.filter(user => user._id !== action.payload.id);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      .addCase(fetchTransactions.pending, (state) => {
        state.transactions.loading = true;
        state.transactions.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions.loading = false;
        state.transactions.list = action.payload.transactions;
        state.transactions.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactions.loading = false;
        state.transactions.error = action.payload;
      })
      .addCase(fetchTransactionStatistics.pending, (state) => {
        state.transactions.loading = true;
        state.transactions.error = null;
      })
      .addCase(fetchTransactionStatistics.fulfilled, (state, action) => {
        state.transactions.loading = false;
        state.transactions.statistics = action.payload;
      })
      .addCase(fetchTransactionStatistics.rejected, (state, action) => {
        state.transactions.loading = false;
        state.transactions.error = action.payload;
      })
      .addCase(fetchSystemHealth.pending, (state) => {
        state.system.loading = true;
        state.system.error = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.system.loading = false;
        state.system.health = action.payload;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.system.loading = false;
        state.system.error = action.payload;
      })
      .addCase(fetchSystemMetrics.pending, (state) => {
        state.system.loading = true;
        state.system.error = null;
      })
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.system.loading = false;
        state.system.metrics = action.payload;
      })
      .addCase(fetchSystemMetrics.rejected, (state, action) => {
        state.system.loading = false;
        state.system.error = action.payload;
      })
      .addCase(fetchSummaryReport.pending, (state) => {
        state.reports.loading = true;
        state.reports.error = null;
      })
      .addCase(fetchSummaryReport.fulfilled, (state, action) => {
        state.reports.loading = false;
        state.reports.summary = action.payload;
      })
      .addCase(fetchSummaryReport.rejected, (state, action) => {
        state.reports.loading = false;
        state.reports.error = action.payload;
      })
      .addCase(fetchDetailedReport.pending, (state) => {
        state.reports.loading = true;
        state.reports.error = null;
      })
      .addCase(fetchDetailedReport.fulfilled, (state, action) => {
        state.reports.loading = false;
        state.reports.detailed = action.payload;
      })
      .addCase(fetchDetailedReport.rejected, (state, action) => {
        state.reports.loading = false;
        state.reports.error = action.payload;
      });
  }
});

export const { clearAdminError, clearCurrentUser } = adminSlice.actions;
export default adminSlice.reducer;
