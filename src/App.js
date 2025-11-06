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
    if (!("Notification" in window)) {
      console.log("❌ This browser does not support desktop notification");
      return;
    }

    const handleForegroundMessage = async () => {
      try {
        const payload = await onMessageListener();
        console.log("📬 Foreground message received:", payload);
        
        if (payload?.notification) {
          const { title, body } = payload.notification;
          
          // Show notification using the Notifications API
          const notification = new Notification(title, {
            body,
            icon: "/logo192.png",
            badge: "/logo192.png",
            tag: 'picknpay-notification',
            requireInteraction: true,
            actions: [{ action: 'open', title: 'View Order' }]
          });

          // Handle notification clicks
          notification.onclick = function() {
            window.focus();
            notification.close();
            window.location.href = '/myorders';
          };
        }
      } catch (err) {
        console.error("FCM listener error:", err);
      }
    };

    // Start listening for messages
    handleForegroundMessage();

    // Request permission if needed
    if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("✅ Notification permission granted");
        }
      });
    }
  }, []);

  const hideLayoutRoutes = ['/login', '/register', '/resetpassword'];
  const hideLayout =
    hideLayoutRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/resetpassword');

  return (
    <div className="app-container">
      {!hideLayout && <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />}
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
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  );
}
