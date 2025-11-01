// src/Components/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.firebasestorage.app",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:ae423c6cfe82808d9eba60",
  measurementId: "G-YKMG0D23GZ"
};



const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = async (email) => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey:
        "BN4MszqRkj4I8REZSq1CVTOQELsPUyoRJw6SkJO55yYL94o6VFLKzqwHgX1PDRnEus2rv2mHsiZvdi7Bhe-pF5M",
    });

    if (currentToken) {
      console.log("✅ FCM Token:", currentToken);

      // Save token to backend
      await fetch("https://picknpay-backend-5.onrender.com/api/auth/save-fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fcmToken: currentToken }),
      });
    } else {
      console.warn("⚠️ No FCM token retrieved — permission may be blocked.");
    }
  } catch (err) {
    console.error("❌ FCM Token fetch failed:", err.message);
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    onMessage(messaging, (payload) => resolve(payload), reject);
  });
