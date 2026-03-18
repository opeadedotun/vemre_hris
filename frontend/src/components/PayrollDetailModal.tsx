import { X, Printer, Download, CreditCard, User, Building2, Briefcase, Calendar, Mail, Loader2 } from 'lucide-react';
import logo from '../assets/logo.png';

interface AttendanceSummary {
    total_late_30: number;
    total_late_1hr: number;
    total_query: number;
    total_late_days: number;
    absent_days: number;
    salary_deduction_amount: string;
    absent_deduction_amount: string;
    is_processed: boolean;
}

interface PayrollRecord {
    id: number;
    employee_name: string;
    employee_code: string;
    job_title: string;
    department_name: string;
    passport: string | null;
    basic_salary: string;
    other_allowances: string;
    total_allowances: string;
    late_deductions: string;
    absent_deductions: string;
    attendance_deduction: string;
    pension_deduction: string;
    nhf_deduction: string;
    tax_deduction: string;
    net_salary: string;
    attendance_summary?: AttendanceSummary | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    record: PayrollRecord | null;
    month: string;
    onEmail: (id: number) => void;
    emailLoading: boolean;
}

const PayrollDetailModal: React.FC<Props> = ({ isOpen, onClose, record, month, onEmail, emailLoading }) => {
    if (!isOpen || !record) return null;

    const fmt = (val: string | number) => {
        const n = typeof val === 'string' ? parseFloat(val) : val;
        return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/payroll-records/${record.id}/payslip_pdf/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payslip_${record.employee_code}_${month}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    const totalDeductions = parseFloat(record.late_deductions) + parseFloat(record.absent_deductions) +
        parseFloat(record.tax_deduction) + parseFloat(record.pension_deduction) +
        parseFloat(record.nhf_deduction) + parseFloat(record.attendance_deduction);
    const grossSalary = parseFloat(record.basic_salary) + parseFloat(record.total_allowances);
    const attendance = record.attendance_summary || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:rounded-none">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center print:hidden">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-primary-600" />
                        Payroll Slip Detail
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Print Slip">
                            <Printer size={20} />
                        </button>
                        <button
                            onClick={() => onEmail(record.id)}
                            disabled={emailLoading}
                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Email Payslip"
                        >
                            {emailLoading ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
                        </button>
                        <button onClick={handleDownload} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Download Data">
                            <Download size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div id="payroll-slip" className="p-8 space-y-8 print:p-12">
                    <div className="hidden print:flex flex-col items-center border-b-2 border-slate-900 pb-6 mb-8">
                        <img src={logo} alt="Company Logo" className="h-16 w-auto mb-4" />
                        <h1 className="text-2xl font-black tracking-tighter">VEMRE AREMU ENTERPRISE LIMITED</h1>
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Employee Payslip - {month}</p>
                    </div>

                    <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner flex-shrink-0">
                                {record.passport ? (
                                    <img src={record.passport} alt="Employee" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{record.employee_name}</h3>
                                <p className="text-primary-600 font-bold text-sm tracking-wide uppercase">{record.employee_code}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase">
                                        <Briefcase size={14} />
                                        {record.job_title}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase">
                                        <Building2 size={14} />
                                        {record.department_name}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                                <Calendar size={12} />
                                Period: {month}
                            </div>
                        </div>
                    </div>

                    {attendance && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Attendance Summary</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Late 30m</p>
                                    <p className="text-lg font-black text-amber-600">{attendance.total_late_30}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Late 1hr</p>
                                    <p className="text-lg font-black text-orange-600">{attendance.total_late_1hr}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Late Total</p>
                                    <p className="text-lg font-black text-red-600">{attendance.total_late_days}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Absences</p>
                                    <p className="text-lg font-black text-slate-700">{attendance.absent_days}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Earnings</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                                    <span>Basic Salary</span>
                                    <span>NGN {fmt(record.basic_salary)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>Other Allowances</span>
                                    <span>NGN {fmt(record.other_allowances)}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-lg font-black text-slate-800">
                                    <span>Gross Salary</span>
                                    <span>NGN {fmt(grossSalary)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Deductions</h4>
                            <div className="space-y-3">
                                {parseFloat(record.late_deductions) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>Lateness Deductions</span>
                                        <span className="text-red-500">- NGN {fmt(record.late_deductions)}</span>
                                    </div>
                                )}
                                {parseFloat(record.absent_deductions) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>Absence Deductions</span>
                                        <span className="text-red-500">- NGN {fmt(record.absent_deductions)}</span>
                                    </div>
                                )}
                                {parseFloat(record.pension_deduction) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>Pension (8%)</span>
                                        <span className="text-red-500">- NGN {fmt(record.pension_deduction)}</span>
                                    </div>
                                )}
                                {parseFloat(record.nhf_deduction) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>NHF (2.5%)</span>
                                        <span className="text-red-500">- NGN {fmt(record.nhf_deduction)}</span>
                                    </div>
                                )}
                                {parseFloat(record.tax_deduction) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>PAYE Tax</span>
                                        <span className="text-orange-600 font-bold">- NGN {fmt(record.tax_deduction)}</span>
                                    </div>
                                )}
                                {parseFloat(record.attendance_deduction) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>Disciplinary Deduction</span>
                                        <span className="text-red-500 font-bold">- NGN {fmt(record.attendance_deduction)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-sm font-bold text-slate-600">
                                    <span>Total Deductions</span>
                                    <span className="text-red-600">NGN {fmt(totalDeductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary-700/5 rounded-3xl p-8 flex justify-between items-center border border-primary-100">
                        <div>
                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Net Take Home</p>
                            <p className="text-sm text-slate-500">Monthly Net Salary after all statutory and internal deductions</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black text-primary-700 tracking-tighter">NGN {fmt(record.net_salary)}</p>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-400 text-center uppercase tracking-widest pt-4">
                        This is a computer generated document. No signature required.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollDetailModal;
