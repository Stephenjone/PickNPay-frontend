import React from 'react';
import Navbar from './Navbar';
import Items from './Items';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <Items />
      </div>
    </div>
  );
};

export default Dashboard;
