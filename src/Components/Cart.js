import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import "./Cart.css";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const API_BASE = `${REACT_API_URL}/api`;

// Initialize socket once (avoid reconnects on every render)
const socket = io(REACT_API_URL, { transports: ["websocket"] });

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(null);
  const [orderRejected, setOrderRejected] = useState(false);

  const navigate = useNavigate();

  const fetchCart = useCallback(async (email) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/cart/${encodeURIComponent(email)}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || `Failed to fetch cart (status ${res.status})`);
      }

      const data = await res.json();
      setCartItems(data.items || []);
    } catch (err) {
      console.error("Error in fetchCart:", err);
      setError(err.message);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.warn("clearCart: delete responded with error", errBody, res.status);
      }
      setCartItems([]);
      localStorage.setItem("cartCount", "0");
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  // Load cart and join socket room on mount
  useEffect(() => {
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(storedUserRaw);
    } catch {
      setError("Invalid user data");
      setLoading(false);
      return;
    }

    const email = parsedUser.email;
    if (!email) {
      setError("User email missing");
      setLoading(false);
      return;
    }

    fetchCart(email);
    socket.emit("joinRoom", email);

    // Cleanup listeners on unmount
    return () => {
      socket.off("orderAccepted");
      socket.off("orderUpdated");
      socket.off("orderRejected");
    };
  }, [fetchCart]);

  // Socket listeners for order updates
  useEffect(() => {
    if (!orderId) return;

    const handleOrderAccepted = async (acceptedOrder) => {
      if (acceptedOrder._id !== orderId) return;

      const storedUserRaw = localStorage.getItem("user");
      const email = storedUserRaw ? JSON.parse(storedUserRaw).email : null;

      if (email) {
        await clearCart(email);
      }

      setTokenNumber(acceptedOrder.token || null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      setTimeout(() => {
        setShowOrderPopup(false);
        navigate("/myorders");
      }, 5000);
    };

    const handleOrderUpdated = async (updatedOrder) => {
      if (updatedOrder._id !== orderId) return;

      if (updatedOrder.adminStatus === "Accepted") {
        const storedUserRaw = localStorage.getItem("user");
        const email = storedUserRaw ? JSON.parse(storedUserRaw).email : null;

        if (email) {
          await clearCart(email);
        }

        setTokenNumber(updatedOrder.token || null);
        setOrderRejected(false);
        setShowOrderPopup(true);

        setTimeout(() => {
          setShowOrderPopup(false);
          navigate("/myorders");
        }, 5000);
      }
    };

    const handleOrderRejected = async (rejectedOrder) => {
      if (!rejectedOrder) return;
      // Note: depending on your backend, you might send { orderId, message } instead of full object
      // so you may need to check rejectedOrder.orderId === orderId etc.
      console.log("Received orderRejected socket event:", rejectedOrder);

      const storedUserRaw = localStorage.getItem("user");
      const email = storedUserRaw ? JSON.parse(storedUserRaw).email : null;

      if (email) {
        fetchCart(email);
      }

      setOrderRejected(true);
      setTokenNumber(null);
      setShowOrderPopup(true);

      setTimeout(() => {
        setShowOrderPopup(false);
      }, 5000);
    };

    socket.on("orderAccepted", handleOrderAccepted);
    socket.on("orderUpdated", handleOrderUpdated);
    socket.on("orderRejected", handleOrderRejected);

    return () => {
      socket.off("orderAccepted", handleOrderAccepted);
      socket.off("orderUpdated", handleOrderUpdated);
      socket.off("orderRejected", handleOrderRejected);
    };
  }, [orderId, navigate, fetchCart]);

  const handleRemoveItem = async (itemId) => {
    setCartItems((prev) => prev.filter((item) => item._id !== itemId));

    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) return;
    const parsedUser = JSON.parse(storedUserRaw);
    const email = parsedUser.email;
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE}/cart/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || `Failed to remove item (status ${res.status})`);
      }
    } catch (err) {
      console.error("Error in handleRemoveItem:", err);
      // refetch cart if removal failed to sync
      fetchCart(email);
    }
  };

  const handlePlaceOrder = async () => {
    setError("");
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) {
      setError("User not logged in");
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(storedUserRaw);
    } catch {
      setError("Invalid user data");
      return;
    }
    const { email, name } = parsedUser;
    if (!email) {
      setError("User email missing");
      return;
    }

    if (cartItems.length === 0) {
      setError("Cart is empty");
      return;
    }

    const orderItems = cartItems.map(({ _id, name, price, quantity }) => ({
      _id,
      name,
      price,
      quantity,
    }));

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, items: orderItems }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("Failed to parse response JSON in handlePlaceOrder:", parseErr);
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        console.error("Server responded with error in handlePlaceOrder:", { status: res.status, body: data });
        throw new Error(data.message || data.error || `Failed to place order (status ${res.status})`);
      }

      const newOrderId = data._id || (data.order && data.order._id);
      if (!newOrderId) {
        console.warn("handlePlaceOrder: order id missing in response", data);
      }
      setOrderId(newOrderId);
      setTokenNumber(null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      // On success we do **not** clear cart immediately: we wait for order acceptance via socket

    } catch (err) {
      console.error("Error in handlePlaceOrder:", err);
      setError(err.message);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const closePopup = () => {
    setShowOrderPopup(false);
    if (tokenNumber) navigate("/myorders");
    setTokenNumber(null);
    setOrderId(null);
    setOrderRejected(false);
  };

  const updateItemQuantity = async (itemId, newQuantity) => {
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) return;

    let parsedUser;
    try {
      parsedUser = JSON.parse(storedUserRaw);
    } catch {
      return;
    }
    const email = parsedUser.email;
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE}/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, itemId, quantity: newQuantity }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || `Failed to update item quantity (status ${res.status})`);
      }

      // Refresh cart
      fetchCart(email);
    } catch (err) {
      console.error("Error in updateItemQuantity:", err);
      setError("Failed to update quantity");
    }
  };

  return (
    <>
      <Navbar />
      <div className="cart-container">
        <div className="cart-items">
          <h2>Your Cart</h2>
          {loading ? (
            <p>Loading cart...</p>
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
                      ₹{price.toFixed(2)} × {quantity} = ₹{(price * quantity).toFixed(2)}
                    </p>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => {
                          if (quantity > 1) updateItemQuantity(_id, quantity - 1);
                        }}
                        className="quantity-decrement-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(_id, quantity + 1)}
                        className="quantity-increment-btn"
                      >
                        +
                      </button>
                    </div>

                    <button onClick={() => handleRemoveItem(_id)} className="remove-btn">
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <h3>Total: ₹{totalAmount.toFixed(2)}</h3>
              <button className="placeorder-btn" onClick={handlePlaceOrder}>
                Place Order
              </button>
            </>
          )}

          {showOrderPopup && (
            <div className="order-popup-overlay">
              <div className="order-popup">
                {orderRejected ? (
                  <>
                    <h3 style={{ color: "#e74c3c" }}>Oops!</h3>
                    <p>Your order cannot be accepted now, please try again later.</p>
                  </>
                ) : tokenNumber ? (
                  <>
                    <h3 style={{ color: "#4BB543" }}>Order Accepted!</h3>
                    <p>
                      Your token number is: <strong>{tokenNumber}</strong>
                    </p>
                    <p>Please collect it from the counter in 10 minutes.</p>
                  </>
                ) : (
                  <p>Waiting for the restaurant to accept your order...</p>
                )}
                <button onClick={closePopup} style={{ marginTop: "1rem" }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;
