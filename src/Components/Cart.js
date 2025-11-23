import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import { requestForToken } from "./firebase";
import "./Cart.css";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const API_BASE = `${REACT_API_URL}/api`;
const socket = io(REACT_API_URL, { transports: ["websocket"] });

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Order popup
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(null);
  const [orderRejected, setOrderRejected] = useState(false);

  const navigate = useNavigate();

  /* -------------------------------------------------
      Fetch Cart (Initial Load Only)
  --------------------------------------------------- */
  const fetchCart = useCallback(async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/${encodeURIComponent(email)}`);
      const data = await res.json();
      setCartItems(data.items || []);
    } catch {
      setError("Failed to load cart");
    }
    setLoading(false);
  }, []);

  /* -------------------------------------------------
      Clear Cart After Order Accepted
  --------------------------------------------------- */
  const clearCart = async (email) => {
    setCartItems([]); // Instant UI
    try {
      await fetch(`${API_BASE}/cart/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("clearCart error:", err);
    }
  };

  /* -------------------------------------------------
      On Mount: Load Cart + Join Socket Room
  --------------------------------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    const user = JSON.parse(raw);
    if (!user?.email) return;

    fetchCart(user.email);
    socket.emit("joinRoom", user.email);

    return () => {
      socket.off("orderAccepted");
      socket.off("orderUpdated");
      socket.off("orderRejected");
    };
  }, [fetchCart]);

  /* -------------------------------------------------
      SOCKET: Order Updates
  --------------------------------------------------- */
  useEffect(() => {
    if (!orderId) return;

    const getEmail = () => {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw).email : null;
    };

    const onAccepted = async (order) => {
      if (order._id !== orderId) return;
      const email = getEmail();
      if (email) await clearCart(email);

      setTokenNumber(order.token || null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      setTimeout(() => {
        setShowOrderPopup(false);
        navigate("/myorders");
      }, 3000);
    };

    const onUpdated = async (order) => {
      if (order._id !== orderId) return;
      if (order.adminStatus !== "Accepted") return;

      const email = getEmail();
      if (email) await clearCart(email);

      setTokenNumber(order.token || null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      setTimeout(() => {
        setShowOrderPopup(false);
        navigate("/myorders");
      }, 3000);
    };

    const onRejected = async () => {
      const email = getEmail();
      if (email) fetchCart(email);

      setOrderRejected(true);
      setTokenNumber(null);
      setShowOrderPopup(true);

      setTimeout(() => setShowOrderPopup(false), 3000);
    };

    socket.on("orderAccepted", onAccepted);
    socket.on("orderUpdated", onUpdated);
    socket.on("orderRejected", onRejected);

    return () => {
      socket.off("orderAccepted", onAccepted);
      socket.off("orderUpdated", onUpdated);
      socket.off("orderRejected", onRejected);
    };
  }, [orderId, navigate, fetchCart]);

  /* -------------------------------------------------
      PLACE ORDER (Optimized)
  --------------------------------------------------- */
  const handlePlaceOrder = async () => {
    setError("");

    const raw = localStorage.getItem("user");
    if (!raw) return setError("User not logged in");
    const user = JSON.parse(raw);

    if (!cartItems.length) return setError("Cart is empty");

    const items = cartItems.map((i) => ({
      _id: i._id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    try {
      const fcmToken = await requestForToken(user.email);

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.name,
          email: user.email,
          items,
          fcmToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");

      setOrderId(data._id || data.order?._id);
      setShowOrderPopup(true);
    } catch (err) {
      setError(err.message);
    }
  };

  /* -------------------------------------------------
      INSTANT Quantity Update (No UI Lag)
  --------------------------------------------------- */
  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) return removeItem(itemId);

    // Instant UI update
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, quantity: newQty } : item
      )
    );

    // Background sync
    setTimeout(async () => {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const email = JSON.parse(raw).email;

      await fetch(`${API_BASE}/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, itemId, quantity: newQty }),
      });
    }, 0);
  };

  /* -------------------------------------------------
      Remove Item (Instant)
  --------------------------------------------------- */
  const removeItem = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i._id !== itemId));

    const raw = localStorage.getItem("user");
    if (!raw) return;
    const email = JSON.parse(raw).email;

    setTimeout(async () => {
      await fetch(`${API_BASE}/cart/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
    }, 0);
  };

  /* -------------------------------------------------
      UI Rendering
  --------------------------------------------------- */

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const closePopup = () => {
    setShowOrderPopup(false);
    if (tokenNumber) navigate("/myorders");

    // reset
    setTokenNumber(null);
    setOrderRejected(false);
    setOrderId(null);
  };

  return (
    <>
      <Navbar />

      <div className="cart-container">
        <div className="cart-items">
          <h2>Your Cart</h2>

          {loading ? (
            <p>Loading your cart...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cartItems.map(({ _id, name, price, image, quantity }) => (
                <div key={_id} className="cart-item">
                  <img
                    src={image ? `${REACT_API_URL}/uploads/${image}` : "https://via.placeholder.com/80"}
                    alt={name}
                    className="cart-item-image"
                  />

                  <div>
                    <h3>{name}</h3>

                    <p className="price-qty">
                      ₹{price} × {quantity} = <strong>₹{price * quantity}</strong>
                    </p>

                    <div className="quantity-controls">
                      <button style={{backgroundColor:'#4BB543'}} onClick={() => updateQuantity(_id, quantity - 1)}>
                        -
                      </button>
                      <span>{quantity}</span>
                      <button style={{ backgroundColor: "#e74c3c" }} onClick={() => updateQuantity(_id, quantity + 1)}>
                        +
                      </button>
                    </div>

                    <button className="remove-btn" onClick={() => removeItem(_id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <h3>Total: ₹{totalAmount}</h3>

              <button className="placeorder-btn" onClick={handlePlaceOrder}>
                Place Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* ORDER POPUP */}
      {showOrderPopup && (
        <div className="order-popup-overlay">
          <div className="order-popup">
            {orderRejected ? (
              <>
                <h3 style={{ color: "#e74c3c" }}>Order Rejected</h3>
                <p>Please try again later.</p>
              </>
            ) : tokenNumber ? (
              <>
                <h3 style={{ color: "#4BB543" }}>Order Accepted!</h3>
                <p>Your token number is: <strong>{tokenNumber}</strong></p>
              </>
            ) : (
              <p>Waiting for shop to accept your order...</p>
            )}

            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
