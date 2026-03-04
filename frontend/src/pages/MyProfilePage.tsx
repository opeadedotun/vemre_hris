import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    User as UserIcon,
    Mail,
    Shield,
    Camera,
    Loader2,
    CheckCircle2,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyProfilePage: React.FC = () => {
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });

    const [passport, setPassport] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [employeeData, setEmployeeData] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch user details
                const [userRes, empRes] = await Promise.all([
                    api.get(`/users/${authUser?.id}/`),
                    api.get('/employees/') // We'll filter for self
                ]);

                const userData = userRes.data;
                const me = empRes.data.find((e: any) => e.email === authUser?.email);

                setEmployeeData(me);
                setFormData({
                    first_name: userData.first_name || '',
                    last_name: '', // Split from full name usually, but let's just use first_name for display
                    email: userData.email,
                    password: '',
                    confirm_password: ''
                });

                if (me?.passport) {
                    setPreviewUrl(me.passport);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            } finally {
                setLoading(false);
            }
        };

        if (authUser?.id) fetchProfile();
    }, [authUser]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPassport(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        if (formData.password && formData.password !== formData.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            setSaving(false);
            return;
        }

        try {
            // 1. Update User Record
            const userPayload: any = {
                first_name: formData.first_name,
                email: formData.email
            };
            if (formData.password) userPayload.password = formData.password;

            await api.patch(`/users/${authUser?.id}/`, userPayload);

            // 2. Update Employee Passport if changed
            if (passport && employeeData) {
                const empPayload = new FormData();
                empPayload.append('passport', passport);
                await api.patch(`/employees/${employeeData.id}/`, empPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setFormData({ ...formData, password: '', confirm_password: '' });
        } catch (err) {
            console.error('Update failed', err);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-medium">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your personal information and security</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-center p-8">
                        <div className="relative inline-block group mb-6">
                            <div className="w-32 h-32 rounded-full border-4 border-slate-50 overflow-hidden bg-slate-100 shadow-inner mx-auto transition-transform group-hover:scale-105 duration-300">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <UserIcon size={48} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-primary-700 transition-all border-4 border-white">
                                <Camera size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">{formData.first_name || authUser?.username}</h2>
                        <p className="text-sm font-medium text-slate-400 mb-6">{employeeData?.job_title || authUser?.role}</p>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                                <Shield className="text-primary-600" size={18} />
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Role</p>
                                    <p className="text-sm font-bold text-slate-700 capitalize">{authUser?.role.toLowerCase()}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                                <Mail className="text-primary-600" size={18} />
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-bold text-slate-700 break-all">{formData.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                        <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
                            <Shield size={16} />
                            Security Tip
                        </h4>
                        <p className="text-amber-700/80 text-xs leading-relaxed font-medium">
                            Choose a strong, unique password to protect your account. Avoid using the same password across multiple sites.
                        </p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                            <h3 className="font-bold text-slate-900">Personal Information</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {message.text && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
                                    {message.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-50" />

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Lock size={16} className="text-slate-400" />
                                    Change Password
                                </h4>
                                <p className="text-xs text-slate-400 font-medium italic">Leave blank if you don't want to change your password.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                            value={formData.confirm_password}
                                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-900/10 hover:shadow-primary-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    Save Profile Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfilePage;
