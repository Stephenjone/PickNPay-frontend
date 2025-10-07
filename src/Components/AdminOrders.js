import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./AdminOrders.css";
import Navbar from "./Navbar";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const API_BASE = `${REACT_API_URL}/api/orders`;

// Initialize socket connection once
const socket = io(REACT_API_URL.replace(/\/api$/, ''));

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    }
  };

  useEffect(() => {
    fetchOrders();

    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    return () => {
      socket.off('newOrder');
    };
  }, []);

  // Handle accepting an order
  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/accept`, {
        method: 'PUT',
      });

      if (!res.ok) {
        throw new Error('Failed to accept order');
      }

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: "Accepted" } : order
        )
      );
    } catch (err) {
      setError(`Error accepting order: ${err.message}`);
    }
  };

  // ... (other handlers unchanged: reject, markReceived, delete)

  return (
    <div>
      <Navbar />
      <div className="admin-orders">
        <h2>Admin Orders</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Date</th><th>Items</th>
              <th>Order ID</th><th>Token</th><th>Status</th>
              <th>Order Received</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
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
                        {/* Reject button here if needed */}
                      </>
                    )}
                    {order.status === "Accepted" && <span style={{ color: "green" }}>✅ Accepted</span>}
                    {order.status === "Rejected" && <span style={{ color: "red" }}>❌ Rejected</span>}
                  </td>
                  {/* Other columns */}
                  <td>
                    {/* Mark received buttons */}
                  </td>
                  <td>
                    {/* Delete button */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
