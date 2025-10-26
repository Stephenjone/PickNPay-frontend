import React, { useState, useEffect, useCallback } from "react";
import "./Items.css";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const API_BASE = `${REACT_API_URL}/api`;

const Items = ({ searchTerm }) => {
  const [userEmail, setUserEmail] = useState("");
  const isAdmin = userEmail === "admin@gmail.com";

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    } catch {
      data = null;
    }
    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/items");
      const arr = extractArray(data, ["items"]);
      setItems(arr);
      setFilteredItems(arr); // Initially show all
    } catch (err) {
      setError(err.message || "Could not load items");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCart = useCallback(
    async (email) => {
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
    },
    []
  );

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
  }, [fetchItems, fetchCart]);

  // Filter items based on searchTerm
  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(items);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(lowerSearch)
    );
    setFilteredItems(filtered);
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
    setError("");
    setSuccess("");
    if (!userEmail) return setError("Please log in first.");

    try {
      const data = await apiRequest("/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, itemId }),
      });
      setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      setSuccess(data.message || "Item added to cart!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIncrease = (itemId) => {
    setCartItems((prev) => {
      const newQty = (prev[itemId] || 0) + 1;
      updateCartItem(itemId, newQty);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleDecrease = (itemId) => {
    setCartItems((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = currentQty - 1;
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
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await apiRequest(`/items/${itemId}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  // Group filtered items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const getImageUrl = (image) => {
    if (!image) return null;
    const uploadsBase = API_BASE.replace("/api", "");
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads") || image.startsWith("uploads")) {
      return `${uploadsBase}/${image.replace(/^\/?/, "")}`;
    }
    return `${uploadsBase}/uploads/${image}`;
  };

  return (
    <div className="items-page">
  

  <div className="banner-content">
    <img
      src="./Assets/Logo.png"
      alt="PickNPay Logo"
      className="banner-logo"
    />
    <div className="banner-text">
      <h1>Skip the Queue, Savor the Flavor!</h1>
      <p>
        PickNPay makes office dining seamless. Employees order their meals
        ahead,<br />the shop prepares it instantly, and you collect and
        enjoy—simple, fast, and tasty.
      </p>
    </div>
  </div>

  



      {/* ================== Items Container ================== */}
      <div className="items-container">
        {loading ? (
          <p>Loading items...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : filteredItems.length === 0 ? (
          <p>No items found.</p>
        ) : (
          Object.entries(groupedItems).map(([category, itemsInCat]) => (
            <div key={category} className="category-group">
              <h2 className="category-title">{category}</h2>
              <div className="items-grid">
                {itemsInCat.map((item) => {
                  const qty = cartItems[item._id] || cartItems[item.id] || 0;
                  const imgSrc = getImageUrl(item.image);

                  return (
                    <div key={item._id || item.id} className="item-card">
                      {imgSrc && <img src={imgSrc} alt={item.name} />}
                      <h3>{item.name}</h3>
                      <p>
                        <b>₹{item.price}</b>
                      </p>

                      {!isAdmin &&
                        (qty > 0 ? (
                          <div className="quantity-controls">
                            <button
                              onClick={() => handleDecrease(item._id || item.id)}
                            >
                              -
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() => handleIncrease(item._id || item.id)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item._id || item.id)}
                          >
                            Add to Cart
                          </button>
                        ))}

                      {isAdmin && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteItem(item._id || item.id)}
                        >
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
    </div>
  );
};

export default Items;
