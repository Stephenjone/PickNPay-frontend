import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Navbar from "./Navbar";
import "./MyOrders.css";

const API_BASE = "https://picknpay-backend-5.onrender.com/api";
const SOCKET_SERVER_URL = "https://picknpay-backend-5.onrender.com";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [feedbackInputs, setFeedbackInputs] = useState({});

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email || "";

  const fetchOrders = async () => {
    if (!email) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/user/${encodeURIComponent(email)}`);

      let data = res.ok ? await res.json() : [];
      if (!Array.isArray(data)) data = [];

      const cleaned = data.filter(
        (o) => o && typeof o === "object" && Object.keys(o).length > 0
      );

      setOrders(cleaned);
    } catch (err) {
      console.error("Fetch error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* WebSocket + Polling */
  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    fetchOrders();

    const newSocket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.emit("joinRoom", email);

    const updateOrder = (updatedOrder) => {
      if (!updatedOrder || !updatedOrder._id) return;

      setOrders((prev) =>
        prev.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    };

    newSocket.on("orderUpdated", updateOrder);
    newSocket.on("orderAccepted", updateOrder);

    newSocket.on("newOrder", (newOrder) => {
      if (newOrder?.email === email) {
        setOrders((prev) => [newOrder, ...prev]);
      }
    });

    newSocket.on("orderRejected", (data) => {
      alert(data?.message || "Order rejected. Try again later.");
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 1000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, [email]);

  /* Feedback Handlers */
  const handleInputChange = (orderId, itemId, field, value) => {
    setFeedbackInputs((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: {
          ...prev[orderId]?.[itemId],
          [field]: value,
        },
      },
    }));
  };

  const submitFeedback = async (orderId, itemId) => {
    const rating = feedbackInputs[orderId]?.[itemId]?.rating;
    const feedback = feedbackInputs[orderId]?.[itemId]?.feedback || "";

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/item/feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, rating, feedback }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit feedback");

      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.order._id ? data.order : order
        )
      );

      alert("Feedback submitted!");

      setFeedbackInputs((prev) => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          [itemId]: { rating: "", feedback: "" },
        },
      }));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <>
      <Navbar />

      <div className="my-orders-page">   {/* FULL WIDTH WRAPPER */}

        <div className="my-orders-container">

          <h2 className="my-orders-title">My Orders</h2>

          {loading && <p className="no-orders">Loading your orders...</p>}

          {!loading && orders.length === 0 && (
            <p className="no-orders">You haven’t made an order yet.</p>
          )}

          {!loading &&
            orders.length > 0 &&
            orders.map((order) => (
              <div key={order._id} className="order-card">
                <p className="order-id">
                  <strong>Order ID:</strong> {order.orderId || "Pending"}
                </p>

                {order.token && (
                  <p className="order-token">
                    <strong>Token:</strong> {order.token}
                  </p>
                )}

                <div className="order-items">
                  <strong>Items:</strong>
                  {order.items.map((item) => (
                    <div key={item._id} className="order-item-block">
                      <span className="order-item-name">{item.name}</span>
                      <div className="order-item-qty-price">
                        <span>× {item.quantity}</span>
                        <span>₹{Number(item.price).toFixed(2)}</span>
                      </div>

                      {order.adminStatus?.toLowerCase() === "collected" ? (
                        item.rating ? (
                          <div className="feedback-display">
                            <span className="read-only-stars">
                              {"★".repeat(item.rating)}
                              {"☆".repeat(5 - item.rating)}
                            </span>
                            <em>{item.feedback}</em>
                          </div>
                        ) : (
                          <div className="feedback-form">
                            <label>Rate:</label>
                            <div className="star-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={
                                    star <=
                                    (feedbackInputs[order._id]?.[item._id]?.rating || 0)
                                      ? "star filled"
                                      : "star"
                                  }
                                  onClick={() =>
                                    handleInputChange(order._id, item._id, "rating", star)
                                  }
                                >
                                  ★
                                </span>
                              ))}
                            </div>

                            <label>Comment:</label>
                            <input
                              type="text"
                              maxLength={100}
                              placeholder="One line comment"
                              value={
                                feedbackInputs[order._id]?.[item._id]?.feedback || ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  order._id,
                                  item._id,
                                  "feedback",
                                  e.target.value
                                )
                              }
                            />

                            <button onClick={() => submitFeedback(order._id, item._id)}>
                              Submit
                            </button>
                          </div>
                        )
                      ) : null}
                    </div>
                  ))}
                </div>

                <p className="order-total">
                  <strong>Total:</strong> ₹{Number(order.totalAmount).toFixed(2)}
                </p>

                <div className="order-status-line">
                  <strong>Status: </strong>
                  <span className={`order-status ${order.adminStatus?.toLowerCase()}`}>
                    {order.notification || order.adminStatus}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
