import React, { useState, useEffect, useCallback } from "react";
import "./Items.css";
import { REACT_API_URL } from "../actionTypes/authActionTypes";
import { useNavigate } from "react-router-dom";
import Footer from '../Components/Footer';

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
  const [success, setSuccess] = useState("");
  const [showBottomCartBar, setShowBottomCartBar] = useState(false);

  const extractArray = (data, keys = ["items", "orders", "data"]) => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    for (const k of keys) {
      if (Array.isArray(data[k])) return data[k];
    }
    return [];
  };

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
      const msg =
        (data && (data.error || data.message)) ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

  // Fetch items (search-aware)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const data = await apiRequest(`/items${query}`);
      const arr = extractArray(data, ["items"]);

      setItems(arr);
      setFilteredItems(arr);
    } catch (err) {
      setError(err.message || "Could not load items");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Fetch user cart
  const fetchCart = useCallback(async (email) => {
    try {
      const data = await apiRequest(`/cart/${email}`);
      const arr = extractArray(data, ["items", "cartItems"]);

      const cartMap = {};
      arr.forEach((item) => {
        const id = item._id || item.id;
        if (!id) return;
        cartMap[id] = item.quantity ?? 1;
      });

      setCartItems(cartMap);
    } catch (err) {
      console.error("Could not load cart", err);
    }
  }, []);

  /* -----------------------------------
      INITIAL LOAD
  ------------------------------------*/
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const email = parsed.email || parsed.userEmail || "";
        setUserEmail(email);
        if (email) fetchCart(email);
      } catch {
        console.error("Failed to parse stored user");
      }
    }

    fetchItems();
  }, []); 

  /* -----------------------------------
      SHOW BOTTOM CART BAR IF CART NOT EMPTY
  ------------------------------------*/
  useEffect(() => {
    if (Object.keys(cartItems).length > 0) {
      setShowBottomCartBar(true);
    }
  }, [cartItems]);

  /* ---------------------------------------
      DEBOUNCED SEARCH
  ----------------------------------------*/
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchItems();
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm, fetchItems]);

  // Local filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(items);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredItems(
      items.filter((i) => (i.name || "").toLowerCase().includes(lower))
    );
  }, [searchTerm, items]);

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

  const handleAddToCart = async (itemId) => {
    setShowBottomCartBar(true);
    if (!userEmail) return setError("Please log in first.");

    try {
      const data = await apiRequest("/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, itemId }),
      });

      setCartItems((prev) => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1,
      }));

      setSuccess(data.message || "Item added!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIncrease = (itemId) => {
    setShowBottomCartBar(true);
    setCartItems((prev) => {
      const q = (prev[itemId] || 0) + 1;
      updateCartItem(itemId, q);
      return { ...prev, [itemId]: q };
    });
  };

  const handleDecrease = (itemId) => {
    setCartItems((prev) => {
      const curr = prev[itemId] || 0;
      const newQty = curr - 1;

      if (newQty <= 0) {
        updateCartItem(itemId, 0);
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      updateCartItem(itemId, newQty);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiRequest(`/items/${itemId}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const getImageUrl = (image) => {
    if (!image) return null;
    const base = API_BASE.replace("/api", "");
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads") || image.startsWith("uploads"))
      return `${base}/${image.replace(/^\/?/, "")}`;
    return `${base}/uploads/${image}`;
  };

  /* ----------------------------------
      RETURN
  -----------------------------------*/
  return (
    <>
      <div className="items-page">
        <div className="items-inner">
          
          {/* Banner */}
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

          {/* Items */}
          <div className="items-container">
            {loading ? (
              <p>Loading items...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : filteredItems.length === 0 ? (
              <p>No items match "{searchTerm}"</p>
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
                                <button className="decrement" onClick={() => handleDecrease(item._id)}>-</button>
                                <span>{qty}</span>
                                <button className="increment" onClick={() => handleIncrease(item._id)}>+</button>
                              </div>
                            ) : (
                              <button onClick={() => handleAddToCart(item._id)}>Add to Cart</button>
                            ))}

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

          {/* Bottom Mobile Cart Bar */}
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

export default Items;
