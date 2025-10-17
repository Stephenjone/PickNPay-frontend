import './App.css';
import { useState } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

// Pages/Components
import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import Navbar from './Components/Navbar';
import Items from './Components/Items';
import Cart from './Components/Cart.js';
import AdminOrders from './Components/AdminOrders.js';
import MyOrders from './Components/MyOrders.js';
import ResetPassword from './Components/resetPassword'; 

// import Footer from './Components/Footer.js'; // Optional

function AppWrapper() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const hideLayoutRoutes = [
    '/login',
    '/register',
    '/resetpassword',
  ];

  const hideLayout =
    hideLayoutRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/resetpassword');

  return (
    <div className="app-container">
      {!hideLayout && (
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Items searchTerm={searchTerm} />} />
        <Route path="/items" element={<Items searchTerm={searchTerm} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/adminorders" element={<AdminOrders />} />
        <Route path="/myorders" element={<MyOrders />} />
      </Routes>

      {/* {!hideLayout && <Footer />} */}
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  );
}

export default App;
