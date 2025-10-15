import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Navbar from "./Navbar";
import "./MyOrders.css";

const API_BASE = "http://localhost:5000/api";
const SOCKET_SERVER_URL = "http://localhost:5000";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [feedbackInputs, setFeedbackInputs] = useState({});

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email || "";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/user/${email}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    if (!email) return;

    fetchOrders();

    const newSocket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    setSocket(newSocket);
    newSocket.emit("joinRoom", email);

    newSocket.on("orderUpdated", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    });

    newSocket.on("orderAccepted", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    });

    newSocket.on("newOrder", (newOrder) => {
      if (newOrder.email === email) {
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
      }
    });

    return () => newSocket.disconnect();
  }, [email]);

  const handleInputChange = (orderId, field, value) => {
    setFeedbackInputs((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value },
    }));
  };

  const submitFeedback = async (orderId, itemId) => {
    const feedback = feedbackInputs[orderId]?.feedback;
    const rating = feedbackInputs[orderId]?.rating;

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

      if (!res.ok) throw new Error("Failed to submit feedback");

      const data = await res.json();
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.order._id ? data.order : order
        )
      );
      alert("Feedback submitted!");
      setFeedbackInputs((prev) => ({ ...prev, [orderId]: { rating: "", feedback: "" } }));
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Error submitting feedback.");
    }
  };

  return (
    <>
      <Navbar />
      <h2 className="my-orders-title">My Orders</h2>
      <div className="my-orders-container">
        {orders.length === 0 && <p className="no-orders">No orders found.</p>}
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <p className="order-id"><strong>Order ID:</strong> {order.orderId || "Pending"}</p>
            {order.token && <p className="order-token"><strong>Token:</strong> {order.token}</p>}

            <p className="items-inline">
              <strong>Items:</strong>
              {order.items.map((item, i) => (
                <div key={i} className="order-item-block">
                  {item.name} × {item.quantity} — ₹{item.price?.toFixed(2)}

                  {order.adminStatus === "Collected" ? (
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
                                star <= (feedbackInputs[order._id]?.rating || 0)
                                  ? "star filled"
                                  : "star"
                              }
                              onClick={() => handleInputChange(order._id, "rating", star)}
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
                          value={feedbackInputs[order._id]?.feedback || ""}
                          onChange={(e) => handleInputChange(order._id, "feedback", e.target.value)}
                        />
                        <button onClick={() => submitFeedback(order._id, item._id)}>Submit</button>
                      </div>
                    )
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.3rem" }}>
                      Feedback available after order is collected
                    </p>
                  )}
                </div>
              ))}
            </p>

            <p className="order-total"><strong>Total:</strong> ₹{order.totalAmount?.toFixed(2) ?? "0.00"}</p>
            <div className="order-status-line">
              <strong>Status: </strong>
              <span className={`order-status ${order.adminStatus?.toLowerCase()}`}>
                {order.notification || order.adminStatus || "Food is getting prepared"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
