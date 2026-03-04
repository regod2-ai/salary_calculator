import React, { useState } from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import Layout from './components/Layout';
import EmployeeDirectory from './pages/EmployeeDirectory';
import TimeEntryPage from './pages/TimeEntryPage';
import SalaryReport from './pages/SalaryReport';
import { Users, Clock } from 'lucide-react';
import './index.css';

const Dashboard = ({ navigate }) => {
    const { employees, timeEntries } = useAppContext();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ padding: '16px', background: 'var(--secondary)', borderRadius: '12px' }}>
                        <Users size={32} className="text-primary" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Employees</h3>
                        <p style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>{employees.length}</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ padding: '16px', background: 'var(--secondary)', borderRadius: '12px' }}>
                        <Clock size={32} className="text-primary" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Time Entries</h3>
                        <p style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>{timeEntries.length}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24, padding: 24 }}>
                <h2>Quick Actions</h2>
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => navigate('employees')}>Manage Employees</button>
                    <button className="btn btn-secondary" onClick={() => navigate('time')}>Log Hours</button>
                    <button className="btn btn-secondary" onClick={() => navigate('report')}>View Payroll</button>
                </div>
            </div>
        </div>
    );
};

const AppContent = () => {
    const [currentPath, setCurrentPath] = useState('dashboard');

    const renderContent = () => {
        switch (currentPath) {
            case 'dashboard': return <Dashboard navigate={setCurrentPath} />;
            case 'employees': return <EmployeeDirectory />;
            case 'time': return <TimeEntryPage />;
            case 'report': return <SalaryReport />;
            default: return <Dashboard navigate={setCurrentPath} />;
        }
    };

    return (
        <Layout currentPath={currentPath} navigate={setCurrentPath}>
            {renderContent()}
        </Layout>
    );
};

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
