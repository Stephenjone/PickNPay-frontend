import React, { useEffect, useState } from "react";
import Navbar from './Navbar';
import "./MyOrders.css";

const API_BASE = "http://localhost:5000/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email || '';

  useEffect(() => {
    async function fetchOrders() {
      if (!email) {
        console.log("No email found in localStorage");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/orders/user/${email}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        console.log("Fetched orders:", data);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }
    fetchOrders();
  }, [email]);

  return (
    <>
      <div className="myorders-navbar">
         <Navbar />
      </div>

      <h2 className="my-orders-title">My Orders</h2>
      <div className="my-orders-container">
        {orders.length === 0 && <p className="no-orders">No orders found.</p>}
        {orders.map((order, index) => (
          <div key={index} className="order-card">
            <p className="order-id">
              <strong>Order ID:</strong> {order.token ? order.token : "Pending"}
            </p>
            <p className="order-total">
              <strong>Total:</strong> ₹{order.totalAmount}
            </p>
            <p className={`order-status ${order.orderStatus}`}>
              <strong>Status:</strong>{" "}
              {order.orderStatus === "pending"
                ? "Pending"
                : order.orderStatus === "accepted"
                ? "Order Accepted"
                : "Rejected"}
            </p>
            <p><strong>Items:</strong></p>
            <ul className="items-list">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} × {item.quantity} — ₹{item.price}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
