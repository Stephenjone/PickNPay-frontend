import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Navbar from "./Navbar";
import "./MyOrders.css";

const API_BASE = "http://localhost:5000/api";

const socket = io("http://localhost:5000"); // Adjust URL as needed

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email || "";
  const userId = user?._id;

  useEffect(() => {
    if (!email) return;

    async function fetchOrders() {
      try {
        const res = await fetch(`${API_BASE}/orders/user/${email}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }

    fetchOrders();

    if (userId) {
      socket.emit('joinRoom', userId);

      socket.on('orderUpdated', (update) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === update.orderId
              ? { ...order, status: update.status, notification: update.notification }
              : order
          )
        );
      });
    }

    return () => {
      socket.off('orderUpdated');
    };
  }, [email, userId]);

  return (
    <>
      <div className="myorders-navbar">
        <Navbar />
      </div>

      <h2 className="my-orders-title">My Orders</h2>
      <div className="my-orders-container">
        {orders.length === 0 && <p className="no-orders">No orders found.</p>}
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <p className="order-id">
              <strong>Order ID:</strong> {order.orderId || "Pending"}
            </p>
            {order.token && (
              <p className="order-token">
                <strong>Token:</strong> {order.token}
              </p>
            )}
            <p className="items-inline">
              <strong>Items:</strong>{" "}
              {order.items.map((item, i) => (
                <span key={i}>
                  {item.name} × {item.quantity} — ₹{item.price?.toFixed(2)}
                  {i < order.items.length - 1 && ", "}
                </span>
              ))}
            </p>
            <p className="order-total">
              <strong style={{ color: "black" }}>Total:</strong> ₹
              {order.totalAmount?.toFixed(2) ?? "0.00"}
            </p>
            <p className={`order-status ${order.status?.toLowerCase()}`}>
              <strong style={{ color: "black" }}>Status:</strong>{" "}
              {order.notification
                ? order.notification
                : order.status || "Pending"}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
