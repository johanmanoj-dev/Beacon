import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export interface AppShellProps {
  children: React.ReactNode;
  backendStatus: { connected: boolean; message: string };
}

export const AppShell: React.FC<AppShellProps> = ({ children, backendStatus }) => {
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar backendStatus={backendStatus} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
