// src/components/AdminOrders.js
import React, { useEffect, useState } from "react";
import "./AdminOrders.css";
import Navbar from "./Navbar";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const API_BASE = `${REACT_API_URL}/api/orders`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Accept
  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/accept`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to accept order");
      const json = await res.json();
      const updated = json.order;
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      console.error("Error accepting order:", err);
    }
  };

  // Reject
  const handleReject = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/reject`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to reject order");
      const json = await res.json();
      const updated = json.order;
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      console.error("Error rejecting order:", err);
    }
  };

  // Received
  const handleMarkReceived = async (id, value) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReceived: value }),
      });
      if (!res.ok) throw new Error("Failed to update order received status");
      const json = await res.json();
      const updated = json.order;
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      console.error("Error marking received:", err);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="admin-orders">
        <h2>Admin Orders</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Date</th><th>Items</th>
              <th>Order ID</th><th>Token</th><th>Status</th>
              <th>Order Received</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No orders found.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.username || "N/A"}</td>
                <td>{order.email || "N/A"}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  {order.items?.length
                    ? order.items.map((item, idx) => (
                        <div key={idx}>
                          {item.name} × {item.quantity}
                        </div>
                      ))
                    : <em>No items</em>}
                </td>
                <td>{order.orderId || "N/A"}</td>
                <td>{order.token || "N/A"}</td>
                <td>
                  {order.status === "Pending" && (
                    <>
                      <button onClick={() => handleAccept(order._id)}>Accept</button>
                      <button onClick={() => handleReject(order._id)}>Reject</button>
                    </>
                  )}
                  {order.status === "Accepted" && <span style={{ color: "green" }}>✅ Accepted</span>}
                  {order.status === "Rejected" && <span style={{ color: "red" }}>❌ Rejected</span>}
                </td>
                <td>
                  <button
                    onClick={() => handleMarkReceived(order._id, true)}
                    disabled={order.isReceived === false}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleMarkReceived(order._id, false)}
                    disabled={order.isReceived === true}
                  >
                    No
                  </button>
                </td>
                <td>
                  <button onClick={() => handleDelete(order._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
