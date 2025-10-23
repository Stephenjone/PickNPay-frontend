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

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.removeItem("adminOrders");
        setOrders(data);
        localStorage.setItem("adminOrders", JSON.stringify(data));
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update a single order in state (deep copy for items)
  const updateOrderInState = (order) => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o._id === order._id ? { ...order, items: [...order.items] } : o
      );
      localStorage.setItem("adminOrders", JSON.stringify(updated));
      return updated;
    });
  };

  // Socket setup
  useEffect(() => {
    alertSoundRef.current = new Audio("/notification.mp3");
    alertSoundRef.current.load();

    fetchOrders();

    const playAlertSound = () => {
      if (soundEnabled && alertSoundRef.current) {
        alertSoundRef.current.currentTime = 0;
        alertSoundRef.current
          .play()
          .catch((err) => console.warn("Sound play error:", err));
      }
    };

    socket.on("connect", () =>
      console.log("🔗 Admin socket connected:", socket.id)
    );

    socket.on("newOrder", (order) => {
      playAlertSound();
      setOrders((prev) => {
        const updated = [order, ...prev];
        localStorage.setItem("adminOrders", JSON.stringify(updated));
        return updated;
      });
    });

    socket.on("orderUpdatedAdmin", (updatedOrder) => {
      console.log("📦 Order updated via socket:", updatedOrder);
      if (updatedOrder._id) {
        updateOrderInState(updatedOrder);
      }
    });

    socket.on("orderDeleted", (deletedOrder) => {
      setOrders((prev) => {
        const filtered = prev.filter((o) => o._id !== deletedOrder._id);
        localStorage.setItem("adminOrders", JSON.stringify(filtered));
        return filtered;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("newOrder");
      socket.off("orderUpdatedAdmin");
      socket.off("orderDeleted");
    };
  }, [soundEnabled]);

  // Mark order as accepted
  const handleAccept = async (orderId) => {
    try {
      setProcessing((prev) => ({ ...prev, [orderId]: true }));
      const res = await fetch(`${API_BASE}/${orderId}/accept`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Accept failed");
      updateOrderInState(data.order);
    } catch (err) {
      setError(`Accept error: ${err.message}`);
    } finally {
      setProcessing((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Reject/Delete order
  const handleDontAccept = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reject failed");
      setOrders((prev) => {
        const updated = prev.filter((o) => o._id !== orderId);
        localStorage.setItem("adminOrders", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(`Reject error: ${err.message}`);
    }
  };

  // Mark order ready
  const handleReady = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/ready`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ready failed");
      updateOrderInState(data.order);
    } catch (err) {
      setError(`Ready error: ${err.message}`);
    }
  };

  // Mark as collected
  const handleCollected = async (orderId, collected) => {
    try {
      const res = await fetch(`${API_BASE}/${orderId}/collected`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Collected failed");
      updateOrderInState(data.order);
    } catch (err) {
      setError(`Collected error: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="admin-orders">
        <h2>Admin Orders</h2>

        {!soundEnabled && (
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={() => setSoundEnabled(true)}>
              🔔 Enable Notification Sound
            </button>
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
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.username || order.email.split("@")[0]}</td>
                    <td>{order.email}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      {order.items.map((it, i) => (
                        <div key={i}>
                          <strong>{it.name}</strong> × {it.quantity}
                        </div>
                      ))}
                    </td>
                    <td>{order.orderId}</td>
                    <td>{order.token}</td>
                    <td>
                      {order.adminStatus === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleAccept(order._id)}
                            disabled={processing[order._id]}
                          >
                            {processing[order._id] ? "Accepting..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleDontAccept(order._id)}
                            style={{
                              marginLeft: "0.5rem",
                              backgroundColor: "red",
                              color: "white",
                            }}
                          >
                            Don't Accept
                          </button>
                        </>
                      ) : (
                        <span>{order.adminStatus}</span>
                      )}
                    </td>
                    <td>
                      {order.adminStatus === "Accepted" && (
                        <button onClick={() => handleReady(order._id)}>Yes</button>
                      )}
                      {order.adminStatus === "Ready to Serve" && (
                        <button disabled>Yes</button>
                      )}
                    </td>
                    <td>
                      {(order.adminStatus === "Ready to Serve" ||
                        order.adminStatus === "Waiting for pickup") && (
                        <>
                          <button onClick={() => handleCollected(order._id, true)}>
                            Yes
                          </button>
                          <button onClick={() => handleCollected(order._id, false)}>
                            No
                          </button>
                        </>
                      )}
                      {order.adminStatus === "Collected" && <span>Collected</span>}
                    </td>
                    <td>
                      <button onClick={() => handleDontAccept(order._id)}>
                        Delete / Reject
                      </button>
                    </td>

                    {/* Feedback Display */}
                    <td>
                      {order.items.map((item) => (
                        <div key={item._id}>
                          <strong>{item.name}</strong>:{" "}
                          {item.rating != null ? (
                            <>
                              <span style={{ color: "orange" }}>
                                {"★".repeat(item.rating)}
                              </span>
                              {"☆".repeat(5 - item.rating)}
                              <br />
                              <em>{item.feedback || "No comment"}</em>
                            </>
                          ) : (
                            <span>Waiting for feedback</span>
                          )}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11">No orders found</td>
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
