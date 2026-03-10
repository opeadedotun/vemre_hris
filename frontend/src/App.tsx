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
import ESSDashboard from './pages/ESSDashboard';
import MyDocumentsPage from './pages/MyDocumentsPage';
import TicketManagementPage from './pages/TicketManagementPage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyLeavesPage from './pages/MyLeavesPage';
import CareersPage from './pages/CareersPage';
import RecruitmentPage from './pages/RecruitmentPage';
import MyExpensesPage from './pages/MyExpensesPage';
import ReimbursementPage from './pages/ReimbursementPage';
import MyProfilePage from './pages/MyProfilePage';
import KnowledgeDashboard from './pages/KnowledgeDashboard';
import KnowledgeArticleView from './pages/KnowledgeArticleView';
import KnowledgeArticleEdit from './pages/KnowledgeArticleEdit';
import KnowledgeSearchPage from './pages/KnowledgeSearchPage';
import OnboardingPage from './pages/OnboardingPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import MyKPIPage from './pages/MyKPIPage';
import MyPayoutPage from './pages/MyPayoutPage';
import { useState } from 'react';
import SplashScreen from './components/SplashScreen';

function App() {
    const isCareerRoute = window.location.pathname.startsWith('/careers');
    const [showSplash, setShowSplash] = useState(() => !isCareerRoute && !localStorage.getItem('vemre_splash_done'));

    const handleSplashFinish = () => {
        localStorage.setItem('vemre_splash_done', '1');
        setShowSplash(false);
    };

    if (showSplash) {
        return <SplashScreen onFinish={handleSplashFinish} />;
    }

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />

                            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                                <Route path="/users" element={<UserManagementPage />} />
                                <Route path="/departments" element={<DepartmentPage />} />
                                <Route path="/employees" element={<EmployeePage />} />
                                <Route path="/kpis" element={<KPIEntryPage />} />
                                <Route path="/templates" element={<KPIDefinitionPage />} />
                                <Route path="/performance" element={<PerformanceSummaryPage />} />
                                <Route path="/history" element={<HistoryPage />} />
                                <Route path="/attendance" element={<AttendanceManagementPage />} />
                                <Route path="/salary" element={<SalaryStructurePage />} />
                                <Route path="/payroll" element={<PayrollManagementPage />} />
                                <Route path="/reimbursements" element={<ReimbursementPage />} />
                                <Route path="/recruitment" element={<RecruitmentPage />} />
                                <Route path="/tickets" element={<TicketManagementPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Route>

                            <Route path="/profile" element={<MyProfilePage />} />
                            <Route path="/knowledge" element={<KnowledgeDashboard />} />
                            <Route path="/knowledge/:slug" element={<KnowledgeArticleView />} />
                            <Route path="/knowledge/new" element={<KnowledgeArticleEdit />} />
                            <Route path="/knowledge/edit/:slug" element={<KnowledgeArticleEdit />} />
                            <Route path="/knowledge/search" element={<KnowledgeSearchPage />} />
                            <Route path="/chat" element={<ChatPage />} />

                            <Route path="/onboarding" element={<OnboardingPage />} />
                            <Route path="/my-dashboard" element={<ESSDashboard />} />
                            <Route path="/my-documents" element={<MyDocumentsPage />} />
                            <Route path="/my-tickets" element={<MyTicketsPage />} />
                            <Route path="/my-leaves" element={<MyLeavesPage />} />
                            <Route path="/my-expenses" element={<MyExpensesPage />} />
                            <Route path="/my-kpis" element={<MyKPIPage />} />
                            <Route path="/my-payout" element={<MyPayoutPage />} />
                        </Route>
                    </Route>

                    <Route path="/careers" element={<CareersPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
