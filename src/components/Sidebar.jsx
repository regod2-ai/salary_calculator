import React from 'react';
import { Users, Clock, Home, FileText } from 'lucide-react';

const Sidebar = ({ currentPath, navigate }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'time', label: 'Time Entry', icon: Clock },
        { id: 'report', label: 'Payroll Report', icon: FileText },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>PayMaster</h2>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${currentPath === item.id ? 'active' : ''}`}
                            onClick={() => navigate(item.id)}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
