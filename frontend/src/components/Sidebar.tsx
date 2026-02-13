import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    BarChart3,
    History,
    LogOut,
    ChevronRight,
    TrendingUp,
    Settings,
    Calendar,
    Landmark,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Building2, label: 'Departments', path: '/departments' },
        { icon: Users, label: 'Employees', path: '/employees' },
        { icon: LayoutDashboard, label: 'KPI Templates', path: '/templates' },
        { icon: TrendingUp, label: 'Monthly Entry', path: '/kpis' },
        { icon: BarChart3, label: 'Performance', path: '/performance' },
        { icon: Calendar, label: 'Attendance', path: '/attendance' },
        { icon: Landmark, label: 'Salary Setup', path: '/salary' },
        { icon: CreditCard, label: 'Payroll', path: '/payroll' },
        { icon: History, label: 'Appraisal History', path: '/history' },
    ];

    if (user?.role === 'ADMIN') {
        menuItems.push({ icon: Settings, label: 'User Management', path: '/users' });
    }

    return (
        <aside className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 flex flex-col shadow-2xl">
            <div className="p-6 bg-slate-950 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white tracking-widest">VEMRE HRIS</h1>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">Enterprise Management</p>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${isActive
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                : 'hover:bg-slate-800 hover:text-white'}
            `}
                    >
                        <item.icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
                >
                    <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
