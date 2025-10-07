import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./AdminOrders.css";
import Navbar from "./Navbar";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

// Base API URL for orders endpoint
const API_BASE = `${REACT_API_URL}/api/orders`;

// Initialize socket connection once, connecting to backend root URL
const socket = io(REACT_API_URL);

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch orders (${res.status}): ${errorText}`);
      }
      const data = await res.json();
      setOrders(data);
      setError("");
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(`Failed to load orders: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen for 'newOrder' events and prepend new orders to list
    socket.on("newOrder", (order) => {
      setOrders((prevOrders) => [order, ...prevOrders]);
    });

    // Clean up the socket listener on component unmount
    return () => {
      socket.off("newOrder");
    };
  }, []);

  // Handle accept order action
  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/accept`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to accept order");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: "Accepted" } : order
        )
      );
    } catch (err) {
      setError(`Error accepting order: ${err.message}`);
    }
  };

  // Handle reject order action
  const handleReject = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/reject`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to reject order");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: "Rejected" } : order
        )
      );
    } catch (err) {
      setError(`Error rejecting order: ${err.message}`);
    }
  };

  // Handle marking order as received
  const handleMarkReceived = async (orderId, isReceived) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReceived }),
      });
      if (!res.ok) throw new Error("Failed to update order status");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, isReceived } : order
        )
      );
    } catch (err) {
      setError(`Error marking order as received: ${err.message}`);
    }
  };

  // Handle deleting an order
  const handleDelete = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");

      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
    } catch (err) {
      setError(`Error deleting order: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="admin-orders">
        <h2>Admin Orders</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Date</th>
              <th>Items</th>
              <th>Order ID</th>
              <th>Token</th>
              <th>Status</th>
              <th>Order Received</th>
              <th>Action</th>
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
                    {order.items?.length ? (
                      order.items.map((item, idx) => (
                        <div key={idx}>
                          {item.name} × {item.quantity}
                        </div>
                      ))
                    ) : (
                      <em>No items</em>
                    )}
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
                    {order.status === "Accepted" && (
                      <span style={{ color: "green" }}>✅ Accepted</span>
                    )}
                    {order.status === "Rejected" && (
                      <span style={{ color: "red" }}>❌ Rejected</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleMarkReceived(order._id, true)}
                      disabled={order.isReceived === true}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleMarkReceived(order._id, false)}
                      disabled={order.isReceived === false}
                    >
                      No
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(order._id)}>Delete</button>
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
