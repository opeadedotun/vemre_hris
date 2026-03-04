import React from 'react';
import HelpdeskTab from '../components/HelpdeskTab';
import { MessageSquare, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TicketManagementPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-primary-600" size={32} />
                        Ticket Management
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Review and respond to all employee support tickets</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[600px]">
                <HelpdeskTab employeeId={0} isAdminView={true} />
            </div>
        </div>
    );
};

export default TicketManagementPage;
