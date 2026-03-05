import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // Load data from localStorage or default to empty array
    const [employees, setEmployees] = useState(() => {
        const saved = localStorage.getItem('salary_app_employees');
        return saved ? JSON.parse(saved) : [];
    });

    const [timeEntries, setTimeEntries] = useState(() => {
        const saved = localStorage.getItem('salary_app_time_entries');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('salary_app_employees', JSON.stringify(employees));
    }, [employees]);

    useEffect(() => {
        localStorage.setItem('salary_app_time_entries', JSON.stringify(timeEntries));
    }, [timeEntries]);

    // Employee CRUD
    const addEmployee = (employee) => {
        const newEmployee = {
            ...employee,
            id: employee.id || Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        setEmployees([...employees, newEmployee]);
    };

    const editEmployee = (id, updatedData) => {
        setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));
    };

    const deleteEmployee = (id) => {
        setEmployees(employees.filter(emp => emp.id !== id));
        // Optionally delete related time entries as well
        setTimeEntries(timeEntries.filter(entry => entry.employeeId !== id));
    };

    const importEmployees = (data) => {
        // Basic validation
        if (Array.isArray(data)) {
            setEmployees(prev => {
                // Simple merge, avoiding duplicate IDs if possible, or just append
                const newEmps = data.filter(d => !prev.find(p => p.id === d.id));
                return [...prev, ...newEmps];
            });
        }
    };

    const searchEmployeeByName = (nameQuery) => {
        return employees.filter(emp => emp.name.toLowerCase().includes(nameQuery.toLowerCase()));
    };

    // Time Entry CRUD
    const addTimeEntry = (entry) => {
        const newEntry = { ...entry, id: Date.now().toString() };
        setTimeEntries([...timeEntries, newEntry]);
    };

    const deleteTimeEntry = (id) => {
        setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    };

    const importTimeEntries = (data) => {
        if (Array.isArray(data)) {
            setTimeEntries(prev => {
                const newEntries = data.map(d => ({
                    ...d,
                    id: d.id || (Date.now() + Math.random()).toString()
                }));
                return [...prev, ...newEntries];
            });
        }
    };

    return (
        <AppContext.Provider value={{
            employees,
            addEmployee,
            editEmployee,
            deleteEmployee,
            importEmployees,
            searchEmployeeByName,
            timeEntries,
            addTimeEntry,
            deleteTimeEntry,
            importTimeEntries
        }}>
            {children}
        </AppContext.Provider>
    );
};
