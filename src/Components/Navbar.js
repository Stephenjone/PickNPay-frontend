import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPlus,
  FaBox,
  FaClipboardList,
  FaShoppingCart,
} from "react-icons/fa";
import { FaTimes } from "react-icons/fa"; // ✅ Import close icon
import "./Navbar.css";

const Navbar = ({ onItemAdded, hideCart }) => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserEmail(user.email?.trim().toLowerCase() || "");
      setUserName(user.name?.trim() || "");
    }
  }, []);

  const handleLogout = () => {
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
      if (onItemAdded) onItemAdded(data);

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

  const isAdmin = userEmail === "admin@gmail.com";

  return (
    <>
      <nav className="navbar">
        <div className="nav-header">
          <div className="logo" onClick={() => navigate("/dashboard")}>
            PickNPay
          </div>

          {/* Desktop Admin Buttons */}
          {isAdmin && (
            <div className="nav-buttons desktop-only">
              <button className="nav-btn" onClick={() => setShowAddItem(true)}>
                <FaPlus /> Add Item
              </button>
              <button
                className="nav-btn"
                onClick={() => navigate("/adminorders")}
              >
                <FaBox /> View Orders
              </button>
            </div>
          )}

          {/* Desktop User Info */}
          <div className="user-info desktop-only">
            {!isAdmin && !hideCart && (
              <>
                <button
                  className="nav-btn"
                  onClick={() => navigate("/myorders")}
                >
                  <FaClipboardList /> My Orders
                </button>
                <button
                  className="nav-btn"
                  onClick={() => navigate("/cart")}
                  title="Cart"
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

          {/* Mobile User Icon / Close Icon */}
          <div
            className="mobile-user-icon"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <FaTimes size={24} /> // ✅ Show Close icon when menu open
            ) : (
              <FaUser size={24} />
            )}
            <span className="mobile-username">
              {isAdmin ? "Admin" : userName || userEmail || "Guest"}
            </span>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className={`mobile-menu ${mobileOpen ? "show" : ""}`}>
          {isAdmin ? (
            <>
              <button className="nav-btn" onClick={() => setShowAddItem(true)}>
                <FaPlus /> Add Item
              </button>
              <button
                className="nav-btn"
                onClick={() => navigate("/adminorders")}
              >
                <FaBox /> View Orders
              </button>
            </>
          ) : (
            <>
              {!hideCart && (
                <button
                  className="nav-btn"
                  onClick={() => navigate("/myorders")}
                >
                  <FaClipboardList /> My Orders
                </button>
              )}
              {!hideCart && (
                <button
                  className="nav-btn"
                  onClick={() => navigate("/cart")}
                  title="Cart"
                >
                  <FaShoppingCart /> Cart
                </button>
              )}
            </>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Modal Add Item */}
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
