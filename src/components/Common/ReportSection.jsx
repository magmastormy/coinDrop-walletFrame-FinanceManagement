import React from 'react';
import ReportButton from './reportButton';

const ReportSection = ({ title, accountId, reportType }) => {
    return (
        <div className="flex flex-col items-center p-2 bg-card border border-border rounded-lg">
            <ReportButton
                accountId={accountId}
                defaultReportType={reportType}
                label={`Export ${title}`}
            />
        </div>
    );
};

export default ReportSection;
