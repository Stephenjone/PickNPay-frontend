import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Navbar from "./Navbar";
import "./MyOrders.css";

const API_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000"; // Your backend socket URL

const socket = io(SOCKET_URL);

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email || "";

  useEffect(() => {
    async function fetchOrders() {
      if (!email) return;
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

    // Listen for order updates relevant to this user
    socket.on("orderUpdate", (updatedOrder) => {
      // Only update if order belongs to this user (by email)
      if (updatedOrder.email === email) {
        setOrders((prevOrders) => {
          const exists = prevOrders.find((o) => o._id === updatedOrder._id);
          if (exists) {
            // Replace existing order with updated order
            return prevOrders.map((o) =>
              o._id === updatedOrder._id ? updatedOrder : o
            );
          } else {
            // New order, add to front
            return [updatedOrder, ...prevOrders];
          }
        });
      }
    });

    return () => {
      socket.off("orderUpdate");
    };
  }, [email]);

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
