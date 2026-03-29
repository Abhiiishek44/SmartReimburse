import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ApprovalRules from './pages/ApprovalRules';
import CompanyProfile from './pages/CompanyProfile';
import UserManagement from './pages/UserManagement';
import ExpenseListPage from './pages/ExpenseListPage';
import MyExpenses from './pages/MyExpenses';
import PendingApprovals from './pages/PendingApprovals';
import ManagerApprovals from './pages/ManagerApprovals';
import SubmitExpense from './pages/SubmitExpense';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen font-sans antialiased text-gray-900 bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/rules" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ApprovalRules />
              </ProtectedRoute>
            } />
            <Route path="/company" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CompanyProfile />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <PendingApprovals />
              </ProtectedRoute>
            } />
            <Route path="/manager/approvals" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerApprovals />
              </ProtectedRoute>
            } />
            <Route path="/expenses/all" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExpenseListPage mode="all" />
              </ProtectedRoute>
            } />
            <Route path="/expenses/team" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ExpenseListPage mode="team" />
              </ProtectedRoute>
            } />
            <Route path="/expenses/my" element={
              <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
                <MyExpenses />
              </ProtectedRoute>
            } />
            <Route path="/expenses/submit" element={
              <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
                <SubmitExpense />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
