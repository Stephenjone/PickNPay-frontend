import React, { useState, useEffect, useRef } from 'react';
import './Cart.css';
import Navbar from './Navbar';
import { useNavigate } from 'react-router';
import { REACT_API_URL } from '../actionTypes/authActionTypes';

const API_BASE = `${REACT_API_URL}/api`;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(null);
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

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const updateQuantity = async (itemId, newQuantity) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('User not logged in');
      return;
    }

    const { email } = JSON.parse(storedUser);

    try {
      const res = await fetch(`${API_BASE}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, itemId, quantity: newQuantity }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update quantity');
      }

      const updatedItems = cartItems.map(item => {
        if (item._id === itemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

      setCartItems(updatedItems);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.message);
    }
  };

  const handleRemoveItem = async (itemId) => {
    const updatedCart = cartItems.filter(item => item._id !== itemId);
    setCartItems(updatedCart);

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('User not logged in');
      return;
    }

    const parsed = JSON.parse(storedUser);
    const email = parsed.email;

    try {
      await fetch(`${API_BASE}/cart/${email}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
    } catch (err) {
      setError('Failed to remove item from the cart');
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('User not logged in');
      return;
    }

    let email = '', username = '';
    try {
      const user = JSON.parse(storedUser);
      email = user.email;
      username = user.username || user.name || '';
    } catch {
      setError('Invalid user data');
      return;
    }

    if (!username || !email) {
      setError('Incomplete user info');
      return;
    }

    if (cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    const orderData = {
      username,
      email,
      items: cartItems,
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const text = await res.text();
      if (!res.ok) {
        let errorMessage = 'Failed to place order';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (_) {}
        throw new Error(errorMessage);
      }

      const data = JSON.parse(text);
      setOrderId(data.order._id);
      setTokenNumber(null);
      setOrderRejected(false);
      setShowOrderPopup(true);

      const email = JSON.parse(storedUser).email;
      await fetch(`${API_BASE}/cart/${email}`, { method: 'DELETE' });

      setCartItems([]);
      localStorage.setItem('cartCount', 0);
      pollOrderStatus(data.order._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const pollOrderStatus = (orderId) => {
    pollingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`);
        if (!res.ok) throw new Error(`Status fetch failed (${res.status})`);
        const data = await res.json();

        if (data.status === 'Accepted') {
          setTokenNumber(data.token);
          setOrderRejected(false);
          setShowOrderPopup(true);

          clearInterval(pollingInterval.current);

          setTimeout(() => {
            setShowOrderPopup(false);
            navigate('/myorders');
          }, 3000);
        } else if (data.status === 'Rejected') {
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
                        ? `${REACT_API_URL}/uploads/${image}`
                        : 'https://via.placeholder.com/80'
                    }
                    alt={name}
                    className="cart-item-image"
                  />
                  <div>
                    <h3>{name}</h3>

                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(_id, quantity - 1)} disabled={quantity <= 1}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => updateQuantity(_id, quantity + 1)}>+</button>
                    </div>

                    <p>Subtotal: ₹{(price * quantity).toFixed(2)}</p>

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
                    <div className="success-checkmark"></div>
                    <p className="order-accepted-text">✅ Order Accepted!</p>
                    <p>Your token: <strong>{tokenNumber}</strong></p>
                    <p>Please collect it from the counter in 10 minutes.</p>
                  </>
                ) : orderRejected ? (
                  <p style={{ color: 'red' }}>❌ Restaurant cannot accept your order now.</p>
                ) : (
                  <>
                    <div className="loading-spinner"></div>
                    <p>Waiting for the restaurant to accept your order...</p>
                  </>
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
