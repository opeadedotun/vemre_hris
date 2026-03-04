import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    BarChart3,
    History,
    LogOut,
    TrendingUp,
    Calendar,
    Landmark,
    CreditCard,
    FileText,
    MessageSquare,
    DollarSign,
    User,
    Book,
    Search,
    Rocket,
    Key,
    UserCheck,
    Banknote,
    PieChart,
    Receipt,
    Award,
    Ticket,
    BookOpen,
    Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Strictly enforce Administrator access as per user request
    const isManagementAuthorized = user?.role === 'ADMIN';

    const managementMenus = [
        { name: 'Admin Dashboard', to: '/', icon: LayoutDashboard, color: 'text-primary-500', end: true },
        { name: 'User Access Control', to: '/users', icon: Key, color: 'text-amber-500' },
        { name: 'Employees', to: '/employees', icon: Users, color: 'text-primary-500' },
        { name: 'Departments', to: '/departments', icon: Building2, color: 'text-blue-500' },
        { name: 'Recruitment', to: '/recruitment', icon: UserCheck, color: 'text-indigo-500' },
        { name: 'Salary Setup', to: '/salary', icon: Landmark, color: 'text-emerald-500' },
        { name: 'Payroll Hub', to: '/payroll', icon: PieChart, color: 'text-rose-500' },
        { name: 'Reimbursements', to: '/reimbursements', icon: Receipt, color: 'text-cyan-500' },
        { name: 'Performance', to: '/performance', icon: Award, color: 'text-orange-500' },
        { name: 'KPI Templates', to: '/templates', icon: Shield, color: 'text-purple-500' },
        { name: 'Monthly Entry', to: '/kpis', icon: TrendingUp, color: 'text-green-500' },
        { name: 'Attendance', to: '/attendance', icon: Calendar, color: 'text-red-500' },
        { name: 'Appraisal History', to: '/history', icon: History, color: 'text-yellow-500' },
        { name: 'Ticket Management', to: '/tickets', icon: MessageSquare, color: 'text-rose-600' },
    ];

    const selfServiceMenus = [
        { name: 'My Dashboard', to: user?.role === 'STAFF' ? "/" : "/my-dashboard", icon: LayoutDashboard, color: 'text-primary-500' },
        { name: 'My Documents', to: '/my-documents', icon: FileText, color: 'text-blue-500' },
        { name: 'My Tickets', to: '/my-tickets', icon: Ticket, color: 'text-orange-500' },
        { name: 'My Leaves', to: '/my-leaves', icon: Calendar, color: 'text-emerald-500' },
        { name: 'My Expenses', to: '/my-expenses', icon: CreditCard, color: 'text-rose-500' },
        { name: 'Knowledge Base', to: '/knowledge', icon: BookOpen, color: 'text-indigo-500', end: true },
        { name: 'Search Knowledge', to: '/knowledge/search', icon: Search, color: 'text-slate-400' },
        { name: 'Onboarding Guide', to: '/onboarding', icon: Rocket, color: 'text-amber-500' },
        { name: 'My Profile', to: '/profile', icon: User, color: 'text-primary-500' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 flex flex-col shadow-2xl z-50 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 bg-slate-950 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-widest">VEMRE HRIS</h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">Enterprise Management</p>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {/* Management Section - On Top */}
                    {isManagementAuthorized && (
                        <div className="space-y-1 mb-8">
                            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-70">Management</p>
                            {managementMenus.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                        ${isActive
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={20} className={`transition-transform group-hover:scale-110 ${item.color}`} />
                                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}

                    {/* Self Service Section */}
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-70">Self Service</p>
                        {selfServiceMenus.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <item.icon size={20} className={`transition-transform group-hover:scale-110 ${item.color}`} />
                                <span className="font-bold text-sm tracking-tight">{item.name}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-950/50 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                            <p className="text-[10px] font-black uppercase text-slate-500 truncate tracking-widest">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
                    >
                        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

