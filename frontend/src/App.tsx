import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DepartmentPage from './pages/DepartmentPage';
import EmployeePage from './pages/EmployeePage';
import KPIDefinitionPage from './pages/KPIDefinitionPage';
import KPIEntryPage from './pages/KPIEntryPage';
import PerformanceSummaryPage from './pages/PerformanceSummaryPage';
import HistoryPage from './pages/HistoryPage';
import UserManagementPage from './pages/UserManagementPage';
import AttendanceManagementPage from './pages/AttendanceManagementPage';
import SalaryStructurePage from './pages/SalaryStructurePage';
import PayrollManagementPage from './pages/PayrollManagementPage';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/departments" element={<DepartmentPage />} />
                            <Route path="/employees" element={<EmployeePage />} />
                            <Route path="/kpis" element={<KPIEntryPage />} />
                            <Route path="/templates" element={<KPIDefinitionPage />} />
                            <Route path="/performance" element={<PerformanceSummaryPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/attendance" element={<AttendanceManagementPage />} />
                            <Route path="/salary" element={<SalaryStructurePage />} />
                            <Route path="/payroll" element={<PayrollManagementPage />} />
                            <Route path="/users" element={<UserManagementPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App
