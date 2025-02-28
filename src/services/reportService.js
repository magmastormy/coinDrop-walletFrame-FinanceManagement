import axiosInstance from '../api/userAxios';

const API_URL = '/reports'; //DO NOT CHANGE THIS

class ReportService {
    async getReportTypes() {
        const response = await axiosInstance.get(`${API_URL}/types`);
        return response;
    }

    async generateReport(reportData) {
        const response = await axiosInstance.post(`${API_URL}/generate`, reportData);
        return response;
    }

    async getReportStatus(reportId) {
        const response = await axiosInstance.get(`${API_URL}/${reportId}/status`);
        return response;
    }

    async downloadReport(reportId) {
        try {
            console.log(`[ReportService - downloadReport] Downloading report: ${reportId}`);
            const response = await axiosInstance.get(`${API_URL}/${reportId}/download`, {
                responseType: 'blob'
            });
            console.log('[ReportService - downloadReport] Response:', response);
            
            // Make sure we have a valid blob
            if (response instanceof Blob) {
                console.log('[ReportService - downloadReport] Received blob:', response.size, response.type);
                return response;
            } else {
                // If not a blob, try to create one
                console.warn('[ReportService - downloadReport] Response is not a Blob, attempting to create one:', response.data);
                return new Blob([response], { 
                    type: 'application/octet-stream' 
                });
            }
        } catch (error) {
            console.error('[ReportService - downloadReport] Error downloading report:', error);
            throw error;
        }
    }
}

export default new ReportService();
