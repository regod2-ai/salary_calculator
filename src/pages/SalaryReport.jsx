import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { calculateWeeklyPayroll, getWeekBoundary } from '../utils/calculator';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const SalaryReport = () => {
    const { employees, timeEntries } = useAppContext();

    // Default to current week's Sunday
    const [selectedWeek, setSelectedWeek] = useState(getWeekBoundary(new Date().toISOString().split('T')[0]));
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

    const reportData = useMemo(() => {
        // ... (keep existing logic)
        // Filter entries by the selected week
        const weekStart = new Date(selectedWeek);
        const weekEnd = new Date(selectedWeek);
        weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Saturday

        // Normalize string dates to timestamps for comparison
        const weekStartMs = weekStart.getTime();
        const weekEndMs = weekEnd.getTime() + (24 * 60 * 60 * 1000) - 1; // End of Saturday

        const weekEntries = timeEntries.filter(entry => {
            const entryTime = new Date(entry.date).getTime();
            return entryTime >= weekStartMs && entryTime <= weekEndMs;
        });

        // Group entries by employee
        const entriesByEmp = {};
        weekEntries.forEach(entry => {
            if (!entriesByEmp[entry.employeeId]) entriesByEmp[entry.employeeId] = [];
            entriesByEmp[entry.employeeId].push(entry);
        });

        const results = [];

        // Calculate payroll for each employee
        employees.forEach(emp => {
            if (selectedEmployeeId !== 'all' && emp.id !== selectedEmployeeId) return;

            const empEntries = entriesByEmp[emp.id] || [];
            const payroll = calculateWeeklyPayroll(empEntries, emp.hourlyRate || 20);
            const totalMiles = empEntries.reduce((sum, entry) => sum + (entry.miles || 0), 0);

            // Only include employees with logged hours or if specifically selected
            if (payroll.totalPay > 0 || totalMiles > 0 || selectedEmployeeId === emp.id) {
                const effectiveRate = payroll.regularHours > 0
                    ? payroll.regularPay / payroll.regularHours
                    : (emp.hourlyRate || 20);

                results.push({
                    employee: emp,
                    ...payroll,
                    effectiveRate,
                    totalMiles
                });
            }
        });

        return results;
    }, [timeEntries, employees, selectedWeek, selectedEmployeeId]);

    const handleExportCSV = () => {
        if (reportData.length === 0) return;

        const headers = ['Employee ID', 'Name', 'Pay Rate', 'Regular Hours', 'Regular Pay', 'Daily OT Pay', 'Weekly OT Pay', 'Total Pay', 'Miles Traveled'];
        const rows = reportData.map(r => [
            r.employee.id,
            r.employee.name,
            r.effectiveRate.toFixed(2),
            r.regularHours.toFixed(2),
            r.regularPay.toFixed(2),
            r.dailyOTPay.toFixed(2),
            r.weeklyOTPay.toFixed(2),
            r.totalPay.toFixed(2),
            (r.totalMiles || 0).toFixed(1)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Payroll_Report_Week_${selectedWeek}.csv`;
        link.click();
    };

    const handleExportExcel = () => {
        if (reportData.length === 0) return;

        const worksheetData = reportData.map(r => ({
            'Employee ID': r.employee.id,
            'Name': r.employee.name,
            'Pay Rate ($)': r.effectiveRate,
            'Regular Hours': r.regularHours,
            'Regular Pay ($)': r.regularPay,
            'Daily OT Pay ($)': r.dailyOTPay,
            'Weekly OT Pay ($)': r.weeklyOTPay,
            'Total Pay ($)': r.totalPay,
            'Travel Miles': r.totalMiles || 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

        XLSX.writeFile(workbook, `Payroll_Report_Week_${selectedWeek}.xlsx`);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Payroll Report</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleExportCSV}
                        disabled={reportData.length === 0}
                    >
                        <Download size={16} /> CSV
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExportExcel}
                        disabled={reportData.length === 0}
                    >
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div className="form-group" style={{ margin: 0, minWidth: 200 }}>
                        <label>Select Week (Sunday)</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} className="text-muted" style={{ position: 'absolute', left: 12, top: 12 }} />
                            <input
                                type="date"
                                value={selectedWeek}
                                onChange={e => setSelectedWeek(getWeekBoundary(e.target.value))}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                        <small className="text-muted">Pick any day, will snap to Sunday</small>
                    </div>

                    <div className="form-group" style={{ margin: 0, minWidth: 250 }}>
                        <label>Filter Employee</label>
                        <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                            <option value="all">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Pay Rate</th>
                                <th>Regular Hrs</th>
                                <th>Regular Pay ($)</th>
                                <th>Daily OT ($)</th>
                                <th>Weekly OT ($)</th>
                                <th>Miles</th>
                                <th className="text-right">Total Pay ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? reportData.map(row => (
                                <tr key={row.employee.id}>
                                    <td className="font-medium">{row.employee.name}</td>
                                    <td>${row.effectiveRate.toFixed(2)}</td>
                                    <td>{row.regularHours.toFixed(1)}</td>
                                    <td>${row.regularPay.toFixed(2)}</td>
                                    <td className="text-muted">${row.dailyOTPay.toFixed(2)}</td>
                                    <td className="text-muted">${row.weeklyOTPay.toFixed(2)}</td>
                                    <td className="text-muted">{row.totalMiles?.toFixed(1) || '0.0'}</td>
                                    <td className="text-right font-medium text-primary">${row.totalPay.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="text-center empty-state">No payroll data found for this week.</td>
                                </tr>
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'var(--secondary)', fontWeight: 'bold' }}>
                                    <td colSpan="3" className="text-right">Totals:</td>
                                    <td>${reportData.reduce((sum, r) => sum + r.regularPay, 0).toFixed(2)}</td>
                                    <td>${reportData.reduce((sum, r) => sum + r.dailyOTPay, 0).toFixed(2)}</td>
                                    <td>${reportData.reduce((sum, r) => sum + r.weeklyOTPay, 0).toFixed(2)}</td>
                                    <td>{reportData.reduce((sum, r) => sum + (r.totalMiles || 0), 0).toFixed(1)}</td>
                                    <td className="text-right text-primary">${reportData.reduce((sum, r) => sum + r.totalPay, 0).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalaryReport;
