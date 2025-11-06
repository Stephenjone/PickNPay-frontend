// src/Components/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { REACT_API_URL } from "../actionTypes/authActionTypes";

const firebaseConfig = {
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.appspot.com",
  messagingSenderId: "605257463073",  // Updated to match Firebase Console
  appId: "1:605257463073:web:dd0984f63216eb169eba60",  // Updated to match Firebase Console
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Helper function to save FCM token
const saveFCMToken = async (email, token) => {
  try {
    const res = await fetch(`${REACT_API_URL}/api/auth/save-fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();
    console.log("✅ Token save response:", data);
    return data;
  } catch (err) {
    console.error("❌ Error saving FCM token:", err);
    throw err;
  }
};

// ✅ Save FCM token to backend
export const requestForToken = async (email) => {
  if (!email) {
    console.warn("⚠️ No email provided to requestForToken()");
    return;
  }

  try {
    console.log("🔄 Requesting FCM token for:", email);

    // Check if it's a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // For mobile devices (iOS/Android)
    if (isMobile) {
      console.log("📱 Mobile device detected, requesting FCM token...");
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: "BN4MszqRkj4I8REZSq1CVTOQELsPUyoRJw6SkJO55yYL94o6VFLKzqwHgX1PDRnEus2rv2mHsiZvdi7Bhe-pF5M",
        });
        
        if (currentToken) {
          console.log("✅ Mobile FCM token obtained");
          await saveFCMToken(email, currentToken);
          return currentToken;
        } else {
          console.warn("⚠️ No FCM token received for mobile device");
          return null;
        }
      } catch (err) {
        console.error("❌ Error getting mobile FCM token:", err);
        return null;
      }
    }
    
    // For desktop browsers
    if (!('Notification' in window)) {
      console.warn("⚠️ Browser doesn't support notifications");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("⚠️ Notification permission denied");
      return null;
    }
    
    console.log("✅ Notification permission granted, getting token...");
    const currentToken = await getToken(messaging, {
      vapidKey: "BN4MszqRkj4I8REZSq1CVTOQELsPUyoRJw6SkJO55yYL94o6VFLKzqwHgX1PDRnEus2rv2mHsiZvdi7Bhe-pF5M",
    });

    if (currentToken) {
      console.log("✅ Current FCM token:", currentToken);

      const res = await fetch(`${REACT_API_URL}/api/auth/save-fcm-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: currentToken }),
      });

      const data = await res.json();
      console.log("✅ Token save response:", data);
      // return token to caller so it can be included in requests if needed
      return currentToken;
    } else {
      console.warn("⚠️ No FCM registration token available.");
    }
  } catch (err) {
    console.error("❌ Error fetching FCM token:", err);
  }
};

// ✅ Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);
      resolve(payload);
    });
  });
