import React, { useState, useEffect, useCallback } from "react";
import "./Items.css";
import { REACT_API_URL } from "../actionTypes/authActionTypes";
import { useNavigate } from "react-router-dom";

const API_BASE = `${REACT_API_URL}/api`;

const Items = ({ searchTerm }) => {
  const [userEmail, setUserEmail] = useState("");
  const isAdmin = userEmail === "admin@gmail.com";
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBottomCartBar, setShowBottomCartBar] = useState(false);

  /** -----------------------------------
      HELPERS
  ------------------------------------ */
  const apiRequest = async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: "include",
    });

    let data = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
    }
    return data;
  };

  /** -----------------------------------
      FETCH ITEMS
  ------------------------------------ */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(`${API_BASE}/items${query}`);
      const data = await res.json();
      const arr = Array.isArray(data.items) ? data.items : [];
      setItems(arr);
      setFilteredItems(arr);
    } catch (err) {
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  /** -----------------------------------
      FETCH CART
  ------------------------------------ */
  const fetchCart = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${email}`);
      const data = await res.json();
      const cartMap = {};

      (data.items || []).forEach((item) => {
        cartMap[item._id] = item.quantity;
      });

      setCartItems(cartMap);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  }, []);

  /** -----------------------------------
      INITIAL LOAD
  ------------------------------------ */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const email = parsed.email || "";
      setUserEmail(email);
      if (email) fetchCart(email);
    }

    fetchItems();
  }, []);

  /** -----------------------------------
      SEARCH (DEBOUNCED)
  ------------------------------------ */
  useEffect(() => {
    const delay = setTimeout(() => fetchItems(), 350);
    return () => clearTimeout(delay);
  }, [searchTerm, fetchItems]);

  /** -----------------------------------
      LOCAL FILTER (NO API HIT)
  ------------------------------------ */
  useEffect(() => {
    if (!searchTerm) return setFilteredItems(items);

    const term = searchTerm.toLowerCase();
    setFilteredItems(
      items.filter((i) => (i.name || "").toLowerCase().includes(term))
    );
  }, [searchTerm, items]);

  /** -----------------------------------
      IMAGE URL
  ------------------------------------ */
  const getImageUrl = (image) => {
    if (!image) return null;
    const base = API_BASE.replace("/api", "");
    return `${base}/uploads/${image}`;
  };

  /** -----------------------------------
      CART — INSTANT UPDATE + BACKGROUND SYNC
  ------------------------------------ */

  const backgroundSync = (fn) => setTimeout(fn, 0);

  const handleAddToCart = (itemId) => {
    if (!userEmail) return setError("Please login first");

    // INSTANT UI UPDATE
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    setShowBottomCartBar(true);

    // BACKEND UPDATE (NON-blocking)
    backgroundSync(async () => {
      try {
        await apiRequest("/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, itemId }),
        });
      } catch (err) {
        console.error("Cart sync failed:", err);
      }
    });
  };

  const handleIncrease = (itemId) => {
    const newQty = (cartItems[itemId] || 0) + 1;

    // INSTANT
    setCartItems((prev) => ({ ...prev, [itemId]: newQty }));

    // SYNC
    backgroundSync(() => updateCartItem(itemId, newQty));
  };

  const handleDecrease = (itemId) => {
    const current = cartItems[itemId] || 0;
    const newQty = current - 1;

    // INSTANT
    setCartItems((prev) => {
      if (newQty <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });

    // SYNC
    backgroundSync(() => updateCartItem(itemId, newQty));
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await apiRequest("/cart/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, itemId, quantity }),
      });
    } catch (err) {
      console.error("Failed to update cart:", err);
    }
  };

  /** -----------------------------------
      DELETE ITEM (ADMIN)
  ------------------------------------ */
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete item?")) return;

    try {
      await apiRequest(`/items/${itemId}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  /** -----------------------------------
      GROUP ITEMS
  ------------------------------------ */
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  /** -----------------------------------
      RENDER
  ------------------------------------ */
  return (
    <>
      <div className="items-page">
        <div className="items-inner">

          <div className="banner-content">
            <img src="./Assets/Logo1.png" alt="PickNPay Logo" className="banner-logo" />
            <div className="banner-text">
              <h1>Skip the Queue, Savor the Flavor!</h1>
              <hr />
              <p>
                PickNPay makes office dining seamless. Employees order meals ahead,
                the shop prepares it instantly, and you enjoy — fast and fresh.
              </p>
            </div>
          </div>

          {/* ITEMS */}
          <div className="items-container">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : (
              Object.entries(groupedItems).map(([category, itemsInCat]) => (
                <div key={category} className="category-group">
                  <h2 className="category-title">{category}</h2>

                  <div className="items-grid">
                    {itemsInCat.map((item) => {
                      const qty = cartItems[item._id] || 0;
                      const imgSrc = getImageUrl(item.image);

                      return (
                        <div key={item._id} className="item-card">
                          {imgSrc && <img src={imgSrc} alt={item.name} />}
                          <h3>{item.name}</h3>
                          <p><b>₹{item.price}</b></p>

                          {!isAdmin &&
                            (qty > 0 ? (
                              <div className="quantity-controls">
                                <button onClick={() => handleDecrease(item._id)}>-</button>
                                <span>{qty}</span>
                                <button onClick={() => handleIncrease(item._id)}>+</button>
                              </div>
                            ) : (
                              <button onClick={() => handleAddToCart(item._id)}>Add to Cart</button>
                            ))
                          }

                          {isAdmin && (
                            <button className="delete-btn" onClick={() => handleDeleteItem(item._id)}>
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Sticky Bar */}
          {showBottomCartBar && Object.keys(cartItems).length > 0 && (
            <div className="mobile-cart-bar">
              <span>{Object.keys(cartItems).length} items added</span>
              <button onClick={() => navigate("/cart")}>VIEW CART</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(Items);
