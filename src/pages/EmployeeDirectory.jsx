import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, Plus, Upload, Download, Edit2, Trash2 } from 'lucide-react';

const EmployeeDirectory = () => {
    const { employees, addEmployee, editEmployee, deleteEmployee, importEmployees } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.id.includes(searchQuery)
    );

    const handleOpenModal = (employee = null) => {
        if (employee) {
            setEditingId(employee.id);
            setFormData({ name: employee.name });
        } else {
            setEditingId(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (editingId) {
            editEmployee(editingId, { name: formData.name });
        } else {
            addEmployee({ name: formData.name });
        }
        setIsModalOpen(false);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(employees, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `employees_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                importEmployees(json);
                alert('Data imported successfully!');
            } catch (err) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
        e.target.value = null; // reset
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Employee Directory</h1>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleExport}>
                        <Download size={16} /> Export JSON
                    </button>
                    <label className="btn btn-secondary cursor-pointer">
                        <Upload size={16} /> Import
                        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Add Employee
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="search-bar">
                    <Search size={20} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Date Added</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="font-mono">{emp.id}</td>
                                        <td className="font-medium">{emp.name}</td>
                                        <td className="text-muted">{new Date(emp.createdAt).toLocaleDateString()}</td>
                                        <td className="text-right actions-cell">
                                            <button className="icon-btn edit-btn" onClick={() => handleOpenModal(emp)} title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn delete-btn" onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this employee?')) deleteEmployee(emp.id)
                                            }} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center empty-state">
                                        No employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDirectory;
