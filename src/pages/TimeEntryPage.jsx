import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, FileSpreadsheet, Download, Upload, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getHourlyRate } from '../utils/calculator';

const TimeEntryPage = () => {
    const { employees, timeEntries, addTimeEntry, deleteTimeEntry, importTimeEntries } = useAppContext();
    const [formData, setFormData] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'DD',
        clients: 1,
        hours: 8,
        miles: 0,
        hourlyRate: 0
    });

    const [isManualRate, setIsManualRate] = useState(false);

    // Auto-calculate suggested pay rate
    useEffect(() => {
        if (!isManualRate && formData.employeeId) {
            const employee = employees.find(e => e.id === formData.employeeId);
            const baseRate = employee ? (employee.hourlyRate || 20) : 20;
            const suggestedRate = getHourlyRate(formData.mode, Number(formData.clients), baseRate);
            setFormData(prev => ({ ...prev, hourlyRate: suggestedRate }));
        }
    }, [formData.employeeId, formData.mode, formData.clients, employees, isManualRate]);

    // Reset manual flag when employee changes
    useEffect(() => {
        setIsManualRate(false);
    }, [formData.employeeId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.employeeId) {
            alert("Please select an employee.");
            return;
        }

        addTimeEntry({
            employeeId: formData.employeeId,
            date: formData.date,
            mode: formData.mode,
            clients: Number(formData.clients),
            hours: Number(formData.hours),
            miles: Number(formData.miles) || 0,
            hourlyRate: Number(formData.hourlyRate)
        });

        // reset form but keep employee the same
        setFormData(prev => ({ ...prev, clients: 1, hours: 8, miles: 0 }));
        setIsManualRate(false);
    };

    const handleExportExcel = () => {
        const dataToExport = [...timeEntries].reverse().slice(0, 100).map(entry => {
            const emp = employees.find(e => e.id === entry.employeeId);
            return {
                'Date': entry.date,
                'Employee Name': emp ? emp.name : 'Unknown',
                'Employee ID': entry.employeeId,
                'Mode': entry.mode,
                'Clients': entry.clients,
                'Hours': entry.hours,
                'Miles': entry.miles || 0,
                'Rate': entry.hourlyRate || 0
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "TimeEntries");
        XLSX.writeFile(workbook, `time_entries_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);

                const formatted = json.map(item => {
                    let empId = item['Employee ID'] || item.employeeId || item.id;
                    if (!empId && item['Employee Name']) {
                        const found = employees.find(e => e.name.toLowerCase() === item['Employee Name'].toLowerCase());
                        if (found) empId = found.id;
                    }

                    return {
                        date: item.Date || item.date || new Date().toISOString().split('T')[0],
                        employeeId: empId,
                        mode: item.Mode || item.mode || 'DD',
                        clients: Number(item.Clients || item.clients || 1),
                        hours: Number(item.Hours || item.hours || 8),
                        miles: Number(item.Miles || item.miles || 0),
                        hourlyRate: Number(item.Rate || item.rate || 0)
                    };
                }).filter(i => i.employeeId);

                if (formatted.length > 0) {
                    importTimeEntries(formatted);
                    alert(`Imported ${formatted.length} entries!`);
                } else {
                    alert("No valid entries found (check Employee Names/IDs).");
                }
            } catch (err) {
                alert("Error reading Excel file.");
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.name : 'Unknown';
    };

    // Only show the last 10 entries for brevity
    const recentEntries = [...timeEntries].reverse().slice(0, 10);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Time Entry</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={handleExportExcel}>
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                    <label className="btn btn-secondary cursor-pointer">
                        <Upload size={16} /> Import Excel
                        <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
                    <h2>Log Hours</h2>
                    <form style={{ marginTop: '16px' }} onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Employee</label>
                            <select
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                required
                            >
                                <option value="">Select Employee...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mode</label>
                            <select
                                value={formData.mode}
                                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                            >
                                <option value="DD">DD</option>
                                <option value="CARI/FFH">CARI / FFH</option>
                                <option value="AAA">AAA</option>
                                <option value="KSSP">KSSP</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Number of Clients</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.clients}
                                onChange={(e) => setFormData({ ...formData, clients: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Hours Worked</label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Travel Miles</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.miles}
                                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="form-group">
                            <label>Pay Rate ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.hourlyRate}
                                onChange={(e) => {
                                    setFormData({ ...formData, hourlyRate: e.target.value });
                                    setIsManualRate(true);
                                }}
                            />
                            <small className="text-muted">Currently {isManualRate ? 'Manual' : 'System Calculated'}</small>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            <Plus size={16} /> Save Entry
                        </button>
                    </form>
                </div>

                <div className="card">
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0 }}>Recent Entries</h2>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Employee</th>
                                    <th>Mode / Clients</th>
                                    <th>Hours</th>
                                    <th>Rate</th>
                                    <th>Miles</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEntries.length > 0 ? recentEntries.map(entry => (
                                    <tr key={entry.id}>
                                        <td>{entry.date}</td>
                                        <td className="font-medium">{getEmployeeName(entry.employeeId)}</td>
                                        <td>{entry.mode} (Clients: {entry.clients})</td>
                                        <td className="font-mono text-primary">{entry.hours} hrs</td>
                                        <td className="font-mono text-muted">${entry.hourlyRate?.toFixed(2) || '0.00'}</td>
                                        <td className="font-mono text-muted">{entry.miles || 0} mi</td>
                                        <td className="text-right actions-cell">
                                            <button className="icon-btn delete-btn" onClick={() => deleteTimeEntry(entry.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center empty-state">No time entries yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeEntryPage;
