import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2 } from 'lucide-react';

const TimeEntryPage = () => {
    const { employees, timeEntries, addTimeEntry, deleteTimeEntry } = useAppContext();
    const [formData, setFormData] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'DD',
        clients: 1,
        hours: 8
    });

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
            hours: Number(formData.hours)
        });

        // reset form but keep employee the same
        setFormData(prev => ({ ...prev, clients: 1, hours: 8 }));
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
                                        <td className="text-right actions-cell">
                                            <button className="icon-btn delete-btn" onClick={() => deleteTimeEntry(entry.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center empty-state">No time entries yet.</td>
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
