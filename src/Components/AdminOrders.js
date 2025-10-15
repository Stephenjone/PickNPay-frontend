import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Navbar from "./Navbar";
import "./AdminOrders.css";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const API_BASE = `${REACT_API_URL}/api/orders`;
const socket = io(REACT_API_URL, { transports: ["websocket"] });

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState({});
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const alertSoundRef = useRef(null);

  useEffect(() => {
    alertSoundRef.current = new Audio("/notification.mp3");
    alertSoundRef.current.load();

    fetchOrders();

    const playAlertSound = () => {
      if (!soundEnabled) return;
      if (alertSoundRef.current) {
        alertSoundRef.current.currentTime = 0;
        alertSoundRef.current.play().catch((err) => console.error(err));
      }
    };

    socket.on("newOrder", (order) => {
      playAlertSound();
      setOrders((prev) => [
        { ...order, items: Array.isArray(order.items) ? order.items : [] },
        ...prev,
      ]);
    });

    socket.on("orderUpdatedAdmin", (updated) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updated._id
            ? { ...updated, items: Array.isArray(updated.items) ? updated.items : [] }
            : o
        )
      );
    });

    socket.on("orderDeleted", (deleted) => {
      setOrders((prev) => prev.filter((o) => o._id !== deleted._id));
    });

    return () => {
      socket.off("newOrder");
      socket.off("orderUpdatedAdmin");
      socket.off("orderDeleted");
    };
  }, [soundEnabled]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      setProcessing((prev) => ({ ...prev, [orderId]: true }));
      const res = await fetch(`${API_BASE}/${orderId}/accept`, { method: "PUT" });
      if (!res.ok) throw new Error("Accept failed");
      const body = await res.json();
      setOrders((prev) =>
        prev.map((o) =>
          o._id === body.order._id
            ? { ...body.order, items: Array.isArray(body.order.items) ? body.order.items : [] }
            : o
        )
      );
    } catch (err) {
      setError(`Accept error: ${err.message}`);
    } finally {
      setProcessing((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleReady = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/ready`, { method: "PUT" });
      if (!res.ok) throw new Error("Ready failed");
      const body = await res.json();
      setOrders((prev) =>
        prev.map((o) =>
          o._id === body.order._id
            ? { ...body.order, items: Array.isArray(body.order.items) ? body.order.items : [] }
            : o
        )
      );
    } catch (err) {
      setError(`Ready error: ${err.message}`);
    }
  };

  const handleCollected = async (orderId, collected) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/collected`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collected }),
      });
      if (!res.ok) throw new Error("Collected failed");
      const body = await res.json();
      setOrders((prev) =>
        prev.map((o) =>
          o._id === body.order._id
            ? { ...body.order, items: Array.isArray(body.order.items) ? body.order.items : [] }
            : o
        )
      );
    } catch (err) {
      setError(`Collected error: ${err.message}`);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`${API_BASE}/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      setError(`Delete error: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="admin-orders">
        <h2>Admin Orders</h2>
        {!soundEnabled && (
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={() => setSoundEnabled(true)}>🔔 Enable Notification Sound</button>
          </div>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Loading orders...</p>
        ) : (
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
                <th>Ready?</th>
                <th>Collected?</th>
                <th>Action</th>
                <th>Order Feedback</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(orders) && orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id}>
                    {/* Display actual username or fallback to email prefix */}
                    <td>{order.username || (order.email ? order.email.split("@")[0] : "—")}</td>
                    <td>{order.email || "—"}</td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td>
                    <td>
                      {Array.isArray(order.items) && order.items.length > 0
                        ? order.items.map((it, i) => (
                            <div key={i} style={{ marginBottom: "0.4rem" }}>
                              <strong>{it.name}</strong> × {it.quantity}
                            </div>
                          ))
                        : "No items"}
                    </td>
                    <td>{order.orderId || "—"}</td>
                    <td>{order.token || "—"}</td>
                    <td>
                      {order.adminStatus === "Pending" && (
                        <button
                          className="accept-order-btn"
                          onClick={() => handleAccept(order._id)}
                          disabled={processing[order._id]}
                        >
                          {processing[order._id] ? "Accepting..." : "Accept Order"}
                        </button>
                      )}
                      {order.adminStatus === "Accepted" && <span>Food is being prepared</span>}
                      {order.adminStatus === "Ready to Serve" && <span>Ready to Serve</span>}
                      {order.adminStatus === "Collected" && <span>Order Completed</span>}
                      {order.adminStatus === "Waiting for pickup" && <span>Waiting for Pickup</span>}
                    </td>
                    <td>
                      {order.adminStatus === "Accepted" && (
                        <button onClick={() => handleReady(order._id)}>Yes</button>
                      )}
                      {order.adminStatus === "Ready to Serve" && <button disabled>Yes</button>}
                    </td>
                    <td>
                      {(order.adminStatus === "Ready to Serve" ||
                        order.adminStatus === "Waiting for pickup") && (
                        <>
                          <button onClick={() => handleCollected(order._id, true)}>Yes</button>
                          <button onClick={() => handleCollected(order._id, false)}>No</button>
                        </>
                      )}
                      {order.adminStatus === "Collected" && <span>Collected</span>}
                    </td>
                    <td>
                      <button
                        className="delete-order-btn"
                        onClick={() => handleDelete(order._id)}
                      >
                        Delete
                      </button>
                    </td>
                    <td>
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map(
                          (item, idx) =>
                            item.rating && (
                              <div key={idx} style={{ marginBottom: "0.5rem" }}>
                                <strong>{item.name}</strong>: ⭐ {item.rating}/5
                                <br />
                                <em>{item.feedback}</em>
                              </div>
                            )
                        )
                      ) : (
                        "No feedback"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
