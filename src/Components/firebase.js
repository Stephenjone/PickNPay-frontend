import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.firebasestorage.app",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:dd0984f63216eb169eba60",
  measurementId: "G-JD0ZJXEBKB",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Request FCM token and send to backend
export const requestForToken = async (email) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied by user.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BGq2b5ugSKXnei0JunTzIqREZ-YS-YRUvfCiF2doHXIMyRKI1vG4IKJ9f61lik1EAxC-QiEomTG_u7tb9a7D8KQ",
    });

    if (!token) {
      console.warn("⚠️ Failed to get FCM token.");
      return null;
    }

    console.log("✅ FCM Token generated:", token);

    // Send token to backend
    const backendUrl = process.env.REACT_APP_API || "https://picknpay-backend-5.onrender.com";
    const response = await fetch(`${backendUrl}/api/orders/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fcmToken: token }),
    });

    if (!response.ok) throw new Error("Failed to send FCM token to backend");
    console.log("📩 Token successfully sent to backend");
    return token;
  } catch (err) {
    console.error("❌ Error getting FCM token:", err);
    return null;
  }
};

// ✅ Foreground push notification listener
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("📨 Foreground message received:", payload);
      resolve(payload);
    });
  });

export { messaging };
export default app;
