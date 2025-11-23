import './App.css';
import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  const location = useLocation();

  // SOCKET INITIALIZED ONLY ONCE — FIXES PERFORMANCE LAG
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("https://picknpay-backend-5.onrender.com", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // JOIN USER ROOM
  useEffect(() => {
    if (!socketRef.current) return;

    if (currentUserEmail) {
      socketRef.current.emit("joinRoom", currentUserEmail);
      requestForToken(currentUserEmail);
    }

    return () => {
      if (currentUserEmail) {
        socketRef.current.emit("leaveRoom", currentUserEmail);
      }
    };
  }, [currentUserEmail]);

  // FOREGROUND FCM NOTIFICATIONS — ONLY SETUP ONCE
  useEffect(() => {
    const unsubscribe = onMessageListener().then((payload) => {
      if (payload?.notification) {
        const { title, body } = payload.notification;

        const notification = new Notification(title, {
          body,
          icon: "/logo192.png",
          tag: 'picknpay-notification',
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          window.location.href = '/myorders';
        };
      }
    });

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // HIDE LAYOUT ON AUTH PAGES
  const hideLayout = useMemo(() => {
    return ["/login", "/register", "/resetpassword"].includes(location.pathname);
  }, [location.pathname]);


  return (
    <div className="app-wrapper">
      {!hideLayout && (
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      )}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setCurrentUserEmail={setCurrentUserEmail} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Items searchTerm={searchTerm} />} />
          <Route path="/items" element={<Items searchTerm={searchTerm} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/adminorders" element={<AdminOrders />} />
          <Route path="/myorders" element={<MyOrders socket={socketRef.current} currentUserEmail={currentUserEmail} />} />
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
