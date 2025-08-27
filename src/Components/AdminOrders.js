import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminOrders.css";
import Navbar from "./Navbar";

const API_BASE = "http://localhost:5000/api/orders";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);

  // 📌 Fetch all orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 📌 Accept order
  const handleAccept = async (orderId) => {
    try {
      const res = await axios.put(`${API_BASE}/${orderId}/accept`);
      const updatedOrder = res.data;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    } catch (err) {
      console.error("Error accepting order:", err);
    }
  };

  // 📌 Mark as received (Yes / No)
  const handleMarkReceived = async (id, value) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReceived: value }),
      });
      const updatedOrder = await res.json();

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );

      // 📢 Notify user
      if (updatedOrder.notification) {
        alert(updatedOrder.notification);
      }
    } catch (err) {
      console.error("Error marking received:", err);
    }
  };

  // 📌 Delete order
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="admin-orders">
        <h2>Admin Orders</h2>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Date</th>
              <th>Items</th>
              <th>Order ID</th>
              <th>Token</th>
              <th>Status</th>
              <th>Order Received</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No orders found.
                </td>
              </tr>
            )}

            {orders.map((order) => (
              <tr key={order._id}>
                <td data-label="Username">{order.username || "N/A"}</td>
                <td data-label="Email">{order.email || "N/A"}</td>
                <td data-label="Date">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td data-label="Items">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={idx}>
                        {item.name} × {item.quantity}
                      </div>
                    ))
                  ) : (
                    <em>No items</em>
                  )}
                </td>
                <td data-label="Order ID">{order.orderId || "N/A"}</td>
                <td data-label="Token">{order.token || "N/A"}</td>

                {/* Accept Order Button */}
                <td data-label="Status">
                  <button
                    disabled={order.status === "Accepted"}
                    onClick={() => handleAccept(order._id)}
                    className={
                      order.status === "Accepted"
                        ? "button button-accepted"
                        : "button button-accept"
                    }
                  >
                    {order.status === "Accepted"
                      ? "Order Accepted"
                      : "Accept Order"}
                  </button>
                </td>

                {/* Order Received Buttons */}
                <td data-label="Order Received">
                  <button
                    onClick={() => handleMarkReceived(order._id, true)}
                    className="button button-yes"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleMarkReceived(order._id, false)}
                    className="button button-no"
                  >
                    No
                  </button>
                </td>

                {/* Delete Button */}
                <td data-label="Action">
                  <button
                    onClick={() => handleDelete(order._id)}
                    className="button button-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
