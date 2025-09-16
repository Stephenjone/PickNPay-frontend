import React, { useEffect, useState } from "react";
import "./AdminOrders.css";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = `${process.env.REACT_APP_API_URL}/api/orders`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("[AdminOrders] Error fetching orders:", err);
    }
  };

  const playSound = () => {
    const audio = new Audio("/ding.mp3");
    audio.play().catch((err) => console.warn("[AdminOrders] Sound play error:", err));
  };

  useEffect(() => {
    fetchOrders();

    // Initialize SSE connection
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/api/orders/stream`);
    console.log("SSE Connection Established");

    eventSource.onopen = () => {
      console.log("[AdminOrders] SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const order = JSON.parse(event.data);
        console.log("[AdminOrders] New order received via SSE:", order);

        toast.info(`📥 New order from ${order.username}`, {
          position: "top-right",
          autoClose: 3000,
        });

        playSound();
        setOrders((prev) => [order, ...prev]);
        setHighlightedId(order._id);

        setTimeout(() => setHighlightedId(null), 5000);
      } catch (err) {
        console.error("[AdminOrders] Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[AdminOrders] SSE error:", err);
      toast.error("Error receiving real-time updates. Please try again.");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Handle order accept
  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/accept`, {
        method: "PUT",
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) => (order._id === orderId ? data.order : order))
        );
        toast.success("✅ Order accepted!");
      } else {
        toast.error("❌ Error accepting order");
      }
    } catch (err) {
      console.error("[AdminOrders] Error accepting order:", err);
      toast.error("❌ Error accepting order");
    }
  };

  // Handle order reject
  const handleReject = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/reject`, {
        method: "PUT",
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) => (order._id === orderId ? data.order : order))
        );
        toast.success("❌ Order rejected!");
      } else {
        toast.error("❌ Error rejecting order");
      }
    } catch (err) {
      console.error("[AdminOrders] Error rejecting order:", err);
      toast.error("❌ Error rejecting order");
    }
  };

  // Handle marking order as received
  const handleMarkReceived = async (orderId, isReceived) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/received`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isReceived }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) => (order._id === orderId ? data.order : order))
        );
        toast.success(isReceived ? "✅ Order collected!" : "⏳ Order is still waiting.");
      } else {
        toast.error("❌ Error updating order status");
      }
    } catch (err) {
      console.error("[AdminOrders] Error updating order status:", err);
      toast.error("❌ Error updating order status");
    }
  };

  // Handle order deletion
  const handleDelete = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
        toast.success("🗑️ Order deleted!");
      } else {
        toast.error("❌ Error deleting order");
      }
    } catch (err) {
      console.error("[AdminOrders] Error deleting order:", err);
      toast.error("❌ Error deleting order");
    }
  };

  return (
    <div>
      <Navbar />
      <ToastContainer />
      <div className="admin-orders">
        <h2>Admin Orders</h2>
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
                <tr key={order._id} className={highlightedId === order._id ? "highlight-row" : ""}>
                  <td>{order.username}</td>
                  <td>{order.email}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>{order.items?.length > 0 ? order.items.map((item, idx) => <div key={idx}>{item.name} × {item.quantity}</div>) : <em>No items</em>}</td>
                  <td>{order.orderId}</td>
                  <td>{order.token}</td>
                  <td>
                    {order.status === "Pending" && (
                      <>
                        <button onClick={() => handleAccept(order._id)}>Accept</button>
                        <button onClick={() => handleReject(order._id)}>Reject</button>
                      </>
                    )}
                    {order.status === "Accepted" && <span style={{ color: "green" }}>✅ Accepted</span>}
                    {order.status === "Rejected" && <span style={{ color: "red" }}>❌ Rejected</span>}
                    {order.status === "Collected" && <span style={{ color: "blue" }}>📦 Collected</span>}
                    {order.status === "Waiting" && <span style={{ color: "orange" }}>⏳ Waiting</span>}
                  </td>
                  <td>
                    <button onClick={() => handleMarkReceived(order._id, true)} disabled={order.isReceived === true}>Yes</button>
                    <button onClick={() => handleMarkReceived(order._id, false)} disabled={order.isReceived === false}>No</button>
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
