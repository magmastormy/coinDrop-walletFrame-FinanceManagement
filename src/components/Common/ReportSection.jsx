import React from 'react';
import ReportButton from './reportButton';

const ReportSection = ({ title, accountId, reportType }) => {
    return (
        <div className="flex items-center justify-between p-4 mb-4 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <ReportButton
                accountId={accountId}
                defaultReportType={reportType}
                label={`Export ${title}`}
            />
        </div>
    );
};

export default ReportSection;