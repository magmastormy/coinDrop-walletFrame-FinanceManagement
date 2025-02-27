//TODO: REMAKE THIS COMPONENT TO USE THE REPORTS API

import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Snackbar, Menu, MenuItem } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileDownload, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import reportService from '../../services/reportService';

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
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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

      // Poll for report completion
      const checkStatus = async () => {
        const status = await reportService.getReportStatus(response.reportId);
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
    } catch (error) {
      setLoading(false);
      setSnackbar({ open: true, message: 'Error generating report', type: 'error' });
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

  useEffect(() => {
    const fetchReportTypes = async () => {
      const types = await reportService.getReportTypes();
      setReportTypes(types);
    };

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

export default ReportButton;