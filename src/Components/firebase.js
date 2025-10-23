// src/Components/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.firebasestorage.app",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:dd0984f63216eb169eba60",
  measurementId: "G-JD0ZJXEBKB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission and get FCM token
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BGq2b5ugSKXnei0JunTzIqREZ-YS-YRUvfCiF2doHXIMyRKI1vG4IKJ9f61lik1EAxC-QiEomTG_u7tb9a7D8KQ",
      });
      console.log("✅ FCM Token:", token);
      return token;
    } else {
      console.warn("❌ Notification permission denied.");
    }
  } catch (err) {
    console.error("❌ Error getting FCM token:", err);
  }
};

// Wrap onMessage so it returns a cleanup function
export const onMessageListener = (callback) => {
  const handler = (payload) => callback(payload);
  onMessage(messaging, handler);

  // Return cleanup function for useEffect
  return () => {
    // Firebase Messaging doesn't provide a real unsubscribe, so we can ignore it
    console.log("ℹ️ onMessage listener removed (no-op cleanup).");
  };
};

export { messaging };
export default app;
