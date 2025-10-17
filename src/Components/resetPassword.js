import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REACT_API_URL } from '../actionTypes/authActionTypes';
import './resetPassword.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !newPassword || !confirmPassword) {
      setError('Please fill all the fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${REACT_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="reset-password-body">
       <div className="reset-password-container">
      <img
          src="/Assets/Logo1.png"
          alt="PickNPay Logo"
          className="logo1-img"
        />
      <form className="reset-password-form" onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Reset Password</button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>
    </div>
    </div>
  );
};

export default ResetPassword;
