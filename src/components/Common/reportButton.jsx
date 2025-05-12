import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileDownload, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
  const [selectedType, setSelectedType] = useState(defaultReportType);
  const [reportTypes, setReportTypes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDownload = (blob, filename) => {
    try {
      // Check if blob is valid
      if (!(blob instanceof Blob)) {
        console.error('Invalid blob object:', blob);
        setSnackbar({ 
          open: true, 
          message: 'Error: Downloaded file is not in the correct format', 
          type: 'error' 
        });
        return;
      }
      
      console.log('Creating URL for blob:', blob.size, blob.type);
      
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
      
      setSnackbar({ 
        open: true, 
        message: 'Report downloaded successfully', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({ 
        open: true, 
        message: `Error downloading file: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setSnackbar({ open: false, message: '', type: 'info' });
      
      console.log('Generating report with:', {
        accountId,
        isGlobal,
        format: selectedFormat,
        reportType: selectedType
      });
      
      const response = await reportService.generateReport({
        accountId,
        isGlobal,
        format: selectedFormat,
        reportType: selectedType
      });

      console.log('Report generation response:', response);
      
      if (response && response.reportId) {
        // Poll for report completion
        const checkStatus = async () => {
          const statusResponse = await reportService.getReportStatus(response.reportId);
          const status = statusResponse.data || statusResponse;
          
          console.log('Report status:', status);
          
          if (status.status === 'completed') {
            const reportBlob = await reportService.downloadReport(response.reportId);
            handleDownload(reportBlob, `${selectedType}-${new Date().toISOString()}.${selectedFormat.toLowerCase()}`);
            setLoading(false);
            setSnackbar({ open: true, message: 'Report generated successfully', type: 'success' });
          } else if (status.status === 'failed') {
            setLoading(false);
            setSnackbar({ open: true, message: 'Failed to generate report', type: 'error' });
          } else {
            setTimeout(checkStatus, 1000);
          }
        };

        checkStatus();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setLoading(false);
      setSnackbar({ 
        open: true, 
        message: `Error generating report: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
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
      console.error('Report types loading failed:', error);
      setReportTypes([]); // Fail gracefully with empty state
    }
  };

  useEffect(() => {
    fetchReportTypes();
  }, []);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleMenuClick}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <FontAwesomeIcon icon={faFileDownload} />}
        endIcon={<FontAwesomeIcon icon={faChevronDown} />}
      >
        {label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {reportTypes.map(type => (
          type.formats.map(format => (
            <MenuItem 
              key={`${type.id}-${format}`}
              onClick={() => {
                handleReportTypeSelect(type.id, format);
                handleGenerateReport();
              }}
            >
              {type.name} ({format})
            </MenuItem>
          ))
        ))}
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

const ReportErrorComponent = () => {
  return <div>Error loading report types. Please try again later.</div>;
};

export default () => (
  <ErrorBoundary fallback={<ReportErrorComponent />}>
    <ReportButton />
  </ErrorBoundary>
);