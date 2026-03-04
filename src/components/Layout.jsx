import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, currentPath, navigate }) => {
    return (
        <div className="app-layout">
            <Sidebar currentPath={currentPath} navigate={navigate} />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
