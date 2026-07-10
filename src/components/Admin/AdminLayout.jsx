import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

const AdminLayout = ({ children, title }) => {
  return (
    <div className="flex min-h-screen bg-[#0b1326]">
      <AdminSidebar />
      <main className="ml-72 flex-1 relative min-h-screen">
        <AdminTopBar title={title} />
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
