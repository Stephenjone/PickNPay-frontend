import React, { useState, useEffect } from "react";
import io from "socket.io-client";
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

  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(null);
  const [orderRejected, setOrderRejected] = useState(false);

  const navigate = useNavigate();

  // ✅ Load cart and socket setup
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
    } catch (err) {
      console.error("[Client] JSON parse user error:", err);
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

    return () => {
      socket.off("orderAccepted");
      socket.off("orderUpdated");
    };
  }, []);

  // ✅ Socket listeners
  useEffect(() => {
    const onOrderAccepted = (acceptedOrder) => {
      if (!orderId || acceptedOrder._id !== orderId) return;

      setTokenNumber(acceptedOrder.token || null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      setTimeout(() => {
        setShowOrderPopup(false);
        navigate("/myorders");
      }, 5000);
    };

    const onOrderUpdated = (updatedOrder) => {
      if (!orderId || updatedOrder._id !== orderId) return;

      if (updatedOrder.adminStatus === "Accepted") {
        setTokenNumber(updatedOrder.token || null);
        setOrderRejected(false);
        setShowOrderPopup(true);

        setTimeout(() => {
          setShowOrderPopup(false);
          navigate("/myorders");
        }, 5000);
      }
    };

    socket.on("orderAccepted", onOrderAccepted);
    socket.on("orderUpdated", onOrderUpdated);

    return () => {
      socket.off("orderAccepted", onOrderAccepted);
      socket.off("orderUpdated", onOrderUpdated);
    };
  }, [orderId, navigate]);

  // ✅ Fetch user’s cart
  const fetchCart = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${email}`);
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) throw new Error("Invalid cart data format");

      setCartItems(data.items);
      setError("");
    } catch (err) {
      console.error("[Client] fetchCart error:", err);
      setError(err.message);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Remove item
  const handleRemoveItem = async (itemId) => {
    setCartItems((prev) => prev.filter((it) => it._id !== itemId));

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
      const res = await fetch(`${API_BASE}/cart/${email}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
    } catch (err) {
      console.error("[Client] remove item error:", err);
      setError("Failed to remove item");
      fetchCart(email);
    }
  };

  // ✅ Place order with correct username
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
    } catch (err) {
      console.error("[Client] JSON parse user error in placeOrder:", err);
      setError("Invalid user data");
      return;
    }

    // ✅ Use correct field names
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
        body: JSON.stringify({
          username: name, // ✅ Corrected username
          email,
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to place order");

      setOrderId(data._id || data.order?._id);
      setTokenNumber(null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      // ✅ Clear cart after placing order
      await fetch(`${API_BASE}/cart/${email}`, { method: "DELETE" });
      setCartItems([]);
      localStorage.setItem("cartCount", 0);
    } catch (err) {
      console.error("[Client] placeOrder error:", err);
      setError(err.message);
    }
  };

  const totalAmount = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  // ✅ Close popup
  const closePopup = () => {
    setShowOrderPopup(false);
    if (tokenNumber) navigate("/myorders");
    setTokenNumber(null);
    setOrderId(null);
    setOrderRejected(false);
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
                    src={
                      image
                        ? `${REACT_API_URL}/uploads/${image}`
                        : "https://via.placeholder.com/80"
                    }
                    alt={name}
                    className="cart-item-image"
                  />
                  <div>
                    <h3>{name}</h3>
                    <p>
                      ₹{price.toFixed(2)} × {quantity} = ₹
                      {(price * quantity).toFixed(2)}
                    </p>
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
                {tokenNumber && !orderRejected ? (
                  <>
                    <h3 style={{ color: "#4BB543" }}>Order Accepted!</h3>
                    <p>
                      Your token number is: <strong>{tokenNumber}</strong>
                    </p>
                    <p>Please collect it from the counter in 10 minutes.</p>
                  </>
                ) : orderRejected ? (
                  <>
                    <h3 style={{ color: "#e74c3c" }}>Order Rejected</h3>
                    <p>Sorry! Restaurant cannot accept your order now.</p>
                  </>
                ) : (
                  <>
                    <p>Waiting for the restaurant to accept your order...</p>
                  </>
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
