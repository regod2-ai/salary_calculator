import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, Plus, Upload, Download, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const EmployeeDirectory = () => {
    const { employees, addEmployee, editEmployee, deleteEmployee, importEmployees } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ id: '', name: '', hourlyRate: 20 });
    const [idError, setIdError] = useState('');

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.id.includes(searchQuery)
    );

    const handleOpenModal = (employee = null) => {
        if (employee) {
            setEditingId(employee.id);
            setFormData({ id: employee.id, name: employee.name, hourlyRate: employee.hourlyRate || 20 });
        } else {
            setEditingId(null);
            setFormData({ id: '', name: '', hourlyRate: 20 });
        }
        setIdError('');
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        // Check for duplicate ID if adding new or changing ID (though usually IDs are fixed)
        if (!editingId && formData.id.trim()) {
            const isDuplicate = employees.some(emp => emp.id === formData.id.trim());
            if (isDuplicate) {
                setIdError('This ID is already in use.');
                return;
            }
        }

        if (editingId) {
            editEmployee(editingId, { name: formData.name, hourlyRate: Number(formData.hourlyRate) });
        } else {
            addEmployee({ id: formData.id.trim(), name: formData.name, hourlyRate: Number(formData.hourlyRate) });
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

    const handleExportExcel = () => {
        const worksheetData = employees.map(emp => ({
            'ID': emp.id,
            'Name': emp.name,
            'Date Added': new Date(emp.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

        XLSX.writeFile(workbook, `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                // Map fields if necessary (supporting 'Name' or 'name')
                const formattedData = json.map(item => ({
                    name: item.Name || item.name || item.fullName || 'Unknown',
                    id: item.ID || item.id
                })).filter(item => item.name !== 'Unknown');

                if (formattedData.length === 0) {
                    alert('No valid employee data found in Excel.');
                    return;
                }

                importEmployees(formattedData);
                alert(`Successfully imported ${formattedData.length} employees!`);
            } catch (err) {
                console.error(err);
                alert('Error reading Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
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
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={handleExport} title="Export JSON">
                            <Download size={16} /> JSON
                        </button>
                        <button className="btn btn-secondary" onClick={handleExportExcel} title="Export Excel">
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <label className="btn btn-secondary cursor-pointer" title="Import JSON">
                            <Upload size={16} /> JSON
                            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                        <label className="btn btn-secondary cursor-pointer" title="Import Excel">
                            <FileSpreadsheet size={16} /> Excel
                            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                        </label>
                    </div>
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
                                <label>Employee ID</label>
                                <input
                                    type="text"
                                    value={formData.id}
                                    onChange={e => {
                                        setFormData({ ...formData, id: e.target.value });
                                        setIdError('');
                                    }}
                                    placeholder="Leave blank to auto-generate"
                                    disabled={!!editingId}
                                />
                                {idError && <small style={{ color: 'var(--primary)', marginTop: 4, display: 'block' }}>{idError}</small>}
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                    autoFocus={!!editingId}
                                />
                            </div>
                            <div className="form-group">
                                <label>Hourly Rate ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.hourlyRate}
                                    onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                                    required
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
