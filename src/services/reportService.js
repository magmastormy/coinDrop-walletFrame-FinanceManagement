import axiosInstance from '../api/userAxios';

class ReportService {
    async getReportTypes() {
        const response = await axiosInstance.get('/reports/types');
        return response;
    }

    async generateReport(reportData) {
        const response = await axiosInstance.post('/reports/generate', reportData);
        return response.data;
    }

    async getReportStatus(reportId) {
        const response = await axiosInstance.get(`/reports/${reportId}/status`);
        return response;
    }

    async downloadReport(reportId) {
        const response = await axiosInstance.get(`/reports/${reportId}/download`, {
            responseType: 'blob'
        });
        return response.data;
    }
}

export default new ReportService();
