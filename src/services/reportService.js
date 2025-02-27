import axiosInstance from '../api/axiosConfig';

class ReportService {
    async getReportTypes() {
        const response = await axiosInstance.get('/api/reports/types');
        return response.data;
    }

    async generateReport(reportData) {
        const response = await axiosInstance.post('/api/reports/generate', reportData);
        return response.data;
    }

    async getReportStatus(reportId) {
        const response = await axiosInstance.get(`/api/reports/${reportId}/status`);
        return response.data;
    }

    async downloadReport(reportId) {
        const response = await axiosInstance.get(`/api/reports/${reportId}/download`, {
            responseType: 'blob'
        });
        return response.data;
    }
}

export default new ReportService();
