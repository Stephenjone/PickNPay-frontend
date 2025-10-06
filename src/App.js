import './App.css';
import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import Navbar from './Components/Navbar';
import Items from './Components/Items';
import Cart from './Components/Cart.js';
import AdminOrders from './Components/AdminOrders.js';
import MyOrders from './Components/MyOrders.js';
//import Footer from './Components/Footer.js';

function AppWrapper() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  
  const hideLayout = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      {!hideLayout && (
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Items searchTerm={searchTerm} />} />
        <Route path="/items" element={<Items searchTerm={searchTerm} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/adminorders" element={<AdminOrders />} />
        <Route path="/myorders" element={<MyOrders />} />
      </Routes>

     
     {
         /*!hideLayout && <Footer />
     */ }
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;
