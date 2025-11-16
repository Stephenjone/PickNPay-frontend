import './App.css';
import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

import { requestForToken, onMessageListener } from './Components/firebase';
import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import Navbar from './Components/Navbar';
import Items from './Components/Items';
import Cart from './Components/Cart';
import AdminOrders from './Components/AdminOrders';
import MyOrders from './Components/MyOrders';
import ResetPassword from './Components/resetPassword';
import Footer from './Components/Footer';

function AppWrapper() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  const socket = io("https://picknpay-backend-5.onrender.com", {
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  useEffect(() => {
    if (currentUserEmail) requestForToken(currentUserEmail);
    if (currentUserEmail) socket.emit("joinRoom", currentUserEmail);

    return () => {
      if (currentUserEmail) socket.emit("leaveRoom", currentUserEmail);
    };
  }, [currentUserEmail]);

  // Handle foreground notifications
  useEffect(() => {
    if (!("Notification" in window)) return;

    const handleForegroundMessage = async () => {
      try {
        const payload = await onMessageListener();

        if (payload?.notification) {
          const { title, body } = payload.notification;

          const notification = new Notification(title, {
            body,
            icon: "/logo192.png",
            badge: "/logo192.png",
            tag: 'picknpay-notification',
            requireInteraction: true,
            actions: [{ action: 'open', title: 'View Order' }]
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
            window.location.href = '/myorders';
          };
        }
      } catch (err) {
        console.error("Notification Listener Error:", err);
      }
    };

    handleForegroundMessage();

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Hide navbar + footer on some routes
  const hideLayoutRoutes = ['/login', '/register', '/resetpassword'];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div className="app-wrapper">   {/* UPDATED */}

      {!hideLayout && (
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      )}

      <div className="main-content">   {/* UPDATED */}
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setCurrentUserEmail={setCurrentUserEmail} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Items searchTerm={searchTerm} />} />
          <Route path="/items" element={<Items searchTerm={searchTerm} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/adminorders" element={<AdminOrders />} />
          <Route path="/myorders" element={<MyOrders socket={socket} currentUserEmail={currentUserEmail} />} />
        </Routes>
      </div>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  );
}
