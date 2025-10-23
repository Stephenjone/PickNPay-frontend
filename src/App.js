// src/App.js
import './App.css';
import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Firebase imports
import { messaging, requestForToken, onMessageListener } from './Components/firebase';

// Pages/Components
import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import Navbar from './Components/Navbar';
import Items from './Components/Items';
import Cart from './Components/Cart';
import AdminOrders from './Components/AdminOrders';
import MyOrders from './Components/MyOrders';
import ResetPassword from './Components/resetPassword';
// import Footer from './Components/Footer'; // Optional

function AppWrapper() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Store FCM token in state or send to backend here
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Request permission and get FCM token
    requestForToken().then((token) => {
      if (token) {
        setFcmToken(token);
        // TODO: Send token to backend to save it for the user
      }
    });

    // Listen for foreground messages
    const unsubscribe = onMessageListener((payload) => {
      console.log('📩 Message received:', payload);
      if (payload.notification) {
        alert(`Notification: ${payload.notification.title} - ${payload.notification.body}`);
      }
    });

    return () => unsubscribe();
  }, []);

  // Routes where Navbar/Footer should be hidden
  const hideLayoutRoutes = ['/login', '/register', '/resetpassword'];
  const hideLayout =
    hideLayoutRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/resetpassword');

  return (
    <div className="app-container">
      {!hideLayout && <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />}

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
