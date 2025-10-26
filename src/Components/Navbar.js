import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPlus,
  FaBox,
  FaClipboardList,
  FaShoppingCart,
  FaTimes,
  FaHome,
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = ({ searchTerm, onSearchChange, hideCart }) => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // refs for outside-click detection
  const userMenuRef = useRef(null);
  const userIconRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserEmail(user.email?.trim().toLowerCase() || "");
        setUserName(user.name?.trim() || "");
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  const isAdmin = userEmail === "admin@gmail.com";

  const handleLogout = () => {
    setShowUserMenu(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category", category);
    if (image) formData.append("image", image);

    try {
      const res = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");

      alert("✅ Item added successfully");
      setShowAddItem(false);
      setName("");
      setPrice("");
      setCategory("");
      setImage(null);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Close mobile user menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutside = (e) => {
      // if menu not open, nothing to do
      if (!showUserMenu) return;

      // If click/touch is inside menu or on the icon, do nothing
      if (
        userMenuRef.current?.contains(e.target) ||
        userIconRef.current?.contains(e.target)
      ) {
        return;
      }

      // Otherwise close the menu
      setShowUserMenu(false);
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showUserMenu]);

  // Helper: navigate and close menus
  const navAndClose = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="container nav-header">
          {/* Home icon (visible on desktop + mobile) */}
          <div
            className="home-icon"
            onClick={() => {
              setShowUserMenu(false);
              navigate("/dashboard");
            }}
            role="button"
            aria-label="Home"
          >
            <FaHome size={28} />
          </div>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search items..."
            className="nav-search-input"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />

          {/* Admin buttons (desktop) */}
          {isAdmin && (
            <div className="nav-buttons desktop-only" aria-hidden={!isAdmin}>
              <button
                className="nav-btn"
                onClick={() => {
                  setShowAddItem(true);
                }}
              >
                <FaPlus /> Add Item
              </button>
              <button
                className="nav-btn"
                onClick={() => {
                  navigate("/adminorders");
                }}
              >
                <FaBox /> View Orders
              </button>
            </div>
          )}

          {/* Desktop user info */}
          <div className="user-info desktop-only">
            {!isAdmin && !hideCart && (
              <>
                <button
                  className="nav-btn-myorders"
                  onClick={() => navigate("/myorders")}
                >
                  <FaClipboardList /> My Orders
                </button>
                <button
                  className="nav-btn-cart"
                  onClick={() => navigate("/cart")}
                >
                  <FaShoppingCart /> Cart
                </button>
              </>
            )}
            <FaUser />
            <span>
              Welcome, {isAdmin ? "Admin" : userName || userEmail || "Guest"}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* Mobile user icon */}
          <div
            className="mobile-user-icon"
            ref={userIconRef}
            onClick={() => setShowUserMenu((prev) => !prev)}
            role="button"
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            {showUserMenu ? <FaTimes size={22} /> : <FaUser size={22} />}
            <span className="mobile-username">
              {isAdmin ? "Admin" : userName || userEmail || "Guest"}
            </span>
          </div>
        </div>

        {/* Mobile user menu (dropdown) */}
        {showUserMenu && (
          <div className="mobile-user-menu" ref={userMenuRef}>
            {isAdmin ? (
              <>
                <button
                  className="nav-btn"
                  onClick={() => {
                    setShowAddItem(true);
                    setShowUserMenu(false);
                  }}
                >
                  <FaPlus /> Add Item
                </button>
                <button
                  className="nav-btn"
                  onClick={() => {
                    navAndClose("/adminorders");
                  }}
                >
                  <FaBox /> View Orders
                </button>
              </>
            ) : (
              <>
                {!hideCart && (
                  <button
                    className="nav-btn"
                    onClick={() => {
                      navAndClose("/myorders");
                    }}
                  >
                    <FaClipboardList /> My Orders
                  </button>
                )}
                {!hideCart && (
                  <button
                    className="nav-btn"
                    onClick={() => {
                      navAndClose("/cart");
                    }}
                  >
                    <FaShoppingCart /> Cart
                  </button>
                )}
              </>
            )}

            <button
              className="nav-btn"
              onClick={() => {
                navAndClose("/");
              }}
            >
             
            </button>

            <button
              className="logout-btn"
              onClick={() => {
                handleLogout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add Item</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="add-item-form">
              <input
                type="text"
                placeholder="Item Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">-- Select Category --</option>
                <option value="Sandwich">Sandwich</option>
                <option value="Fruits">Fruits</option>
                <option value="Egg">Egg</option>
                <option value="Noodles">Noodles</option>
                <option value="Maggie">Maggie</option>
                <option value="Juice">Juice</option>
                <option value="Milk shake">Milk shake</option>
                <option value="Fruit Bowl">Fruit Bowl</option>
              </select>

              <div className="file-upload">
                <label className="custom-file-upload">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    required
                  />
                </label>
                <span className="file-name">
                  {image ? image.name : "No file chosen"}
                </span>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddItem(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
