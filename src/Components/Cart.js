import React, { useState, useEffect, useRef } from 'react';
import './Cart.css';
import Navbar from './Navbar';
import { useNavigate } from 'react-router';

const API_BASE = 'http://localhost:5000/api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [tokenNumber, setTokenNumber] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderRejected, setOrderRejected] = useState(false);

  const navigate = useNavigate();
  const pollingInterval = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (!parsed.email) throw new Error('Email missing in user data');
      fetchCart(parsed.email);
    } catch (err) {
      setError('Invalid user data');
      setLoading(false);
    }
    return () => clearInterval(pollingInterval.current);
  }, []);

  useEffect(() => {
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem('cartCount', totalCount);
  }, [cartItems]);

  const fetchCart = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${email}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch cart');
      }
      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid cart data format');
      }
      setCartItems(data.items);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const email = JSON.parse(storedUser).email;

      const res = await fetch(`${API_BASE}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, itemId, quantity: newQuantity }),
      });

      if (!res.ok) throw new Error('Failed to update quantity');

      setCartItems(prev =>
        prev.map(item =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const email = JSON.parse(storedUser).email;

      const res = await fetch(`${API_BASE}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, itemId, quantity: 0 }),
      });

      if (!res.ok) throw new Error('Failed to remove item');

      setCartItems(cartItems.filter(item => item._id !== itemId));
    } catch (err) {
      setError(err.message);
    }
  };

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    setError('');
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('User not logged in');
      return;
    }
    let email = '';
    try {
      email = JSON.parse(storedUser).email;
    } catch {
      setError('Invalid user data');
      return;
    }

    if (cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    const orderData = { email, items: cartItems, totalAmount };

    try {
      const res = await fetch(`${API_BASE}/orders/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await res.json();

      setOrderId(data.orderId);
      setShowOrderPopup(true);
      setTokenNumber(null);
      setOrderRejected(false);

      pollOrderStatus(data.orderId);
    } catch (err) {
      setError(err.message);
    }
  };

  const pollOrderStatus = (orderId) => {
    pollingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/status/${orderId}`);
        if (!res.ok) throw new Error(`Status fetch failed (${res.status})`);
        const data = await res.json();

        if (data.orderStatus === 'accepted') {
          setTokenNumber(data.token);
          setOrderRejected(false);
          setShowOrderPopup(true);

          clearInterval(pollingInterval.current);

          setTimeout(() => {
            setShowOrderPopup(false);
            navigate('/myorders');
          }, 3000);
        } else if (data.orderStatus === 'rejected') {
          setOrderRejected(true);
          setTokenNumber(null);
          clearInterval(pollingInterval.current);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  const closePopup = () => {
    setShowOrderPopup(false);
    setTokenNumber(null);
    setOrderId(null);
    setOrderRejected(false);
    if (pollingInterval.current) clearInterval(pollingInterval.current);
  };

  return (
    <>
      {/* ✅ Navbar */}
      <Navbar />

      <div className="cart-container">
        <div className="cart-items">
          <h2>Your Cart</h2>

          {loading ? (
            <p>Loading cart...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : !cartItems.length ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cartItems.map(({ _id, name, price, image, quantity }) => (
                <div key={_id} className="cart-item">
                  <img
                    src={
                      image
                        ? `${API_BASE.replace('/api', '')}/uploads/${image}`
                        : 'https://via.placeholder.com/80'
                    }
                    alt={name}
                    className="cart-item-image"
                  />
                  <div>
                    <h3>{name}</h3>
                    <p>
                      ₹{price.toFixed(2)} × {quantity} = ₹{(price * quantity).toFixed(2)}
                    </p>

                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(_id, quantity - 1)} disabled={quantity <= 1}>
                        –
                      </button>
                      <span>{quantity}</span>
                      <button onClick={() => updateQuantity(_id, quantity + 1)}>
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

              <button className="placeorder-btn" onClick={handlePlaceOrder}>Place Order</button>
              <button className="back-btn" onClick={() => navigate('/dashboard')}>Back</button>
            </>
          )}

          {showOrderPopup && (
            <div className="order-popup-overlay">
              <div className="order-popup">
                {tokenNumber && !orderRejected ? (
                  <>
                    <p style={{ fontSize: '1.4rem', color: 'green' }}>✅ Order Accepted!</p>
                    <p>Your token number is: <b>{tokenNumber}</b></p>
                    <p>Please collect your order from the counter in 10 minutes.</p>
                  </>
                ) : orderRejected ? (
                  <p style={{ color: 'red' }}>❌ Restaurant cannot accept your order now.</p>
                ) : (
                  <p>⌛ Waiting for the restaurant to accept your order...</p>
                )}
                <button onClick={closePopup}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;
