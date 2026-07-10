import { logError } from '../../utils/logger';

import React, { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import reportService from '../../services/reportService';
import { ErrorBoundary } from 'react-error-boundary';

const ReportButton = ({
  accountId,
  label = "Generate Report",
  isGlobal = false,
  defaultFormat = "PDF",
  defaultReportType = "financial-summary"
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
  const [selectedType, setSelectedType] = useState(defaultReportType);
  const [reportTypes, setReportTypes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDownload = (blob, filename) => {
    try {
      // Check if blob is valid
      if (!(blob instanceof Blob)) {
        // Invalid blob object
        toast.error('Error: Downloaded file is not in the correct format');
        return;
      }

      // Create URL and download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('Report downloaded successfully');
    } catch (error) {
      // Download error
      toast.error(`Error downloading file: ${error.message}`);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const response = await reportService.generateReport({
        accountId,
        isGlobal,
        format: selectedFormat,
        reportType: selectedType
      });

      if (response && response.reportId) {
        // Poll for report completion
        const checkStatus = async () => {
          const statusResponse = await reportService.getReportStatus(response.reportId);
          const status = statusResponse;

          if (status.status === 'completed') {
            const reportBlob = await reportService.downloadReport(response.reportId);
            handleDownload(reportBlob, `${selectedType}-${new Date().toISOString()}.${selectedFormat.toLowerCase()}`);
            setLoading(false);
            toast.success('Report generated successfully');
          } else if (status.status === 'failed') {
            setLoading(false);
            toast.error('Failed to generate report');
          } else {
            setTimeout(checkStatus, 1000);
          }
        };

        checkStatus();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      // Error already handled by service
      setLoading(false);
      toast.error(`Error generating report: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReportTypeSelect = (typeId, format) => {
    setSelectedType(typeId);
    setSelectedFormat(format);
  };

  const fetchReportTypes = async () => {
    try {
      const types = await reportService.getReportTypes();
      setReportTypes(types);
    } catch (error) {
      logError('Report types loading failed:', error);
      setReportTypes([]); // Fail gracefully with empty state
    }
  };

  useEffect(() => {
    fetchReportTypes();
  }, []);

  return (
    <div className="relative">
      <Button
        onClick={handleMenuClick}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {label}
      </Button>

      {anchorEl && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleMenuClose}
          />
          <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
            {reportTypes.map(type => (
              type.formats.map(format => (
                <button
                  key={`${type.id}-${format}`}
                  onClick={() => {
                    handleReportTypeSelect(type.id, format);
                    handleGenerateReport();
                    handleMenuClose();
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground"
                >
                  {type.name} ({format})
                </button>
              ))
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ReportErrorComponent = () => {
  return (
    <div className="text-destructive p-4">
      Error loading report types. Please try again later.
    </div>
  );
};

const ReportButtonWithBoundary = (props) => (
  <ErrorBoundary fallback={<ReportErrorComponent />}>
    <ReportButton {...props} />
  </ErrorBoundary>
);

export default ReportButtonWithBoundary;
