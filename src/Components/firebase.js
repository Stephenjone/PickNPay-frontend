// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.appspot.com",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:dd0984f63216eb169eba60",
  measurementId: "G-JD0ZJXEBKB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Request FCM token (works on mobile + desktop)
export const requestForToken = async (email) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied by user.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BGq2b5ugSKXnei0JunTzIqREZ-YS-YRUvfCiF2doHXIMyRKI1vG4IKJ9f61lik1EAxC-QiEomTG_u7tb9a7D8KQ",
    });

    if (!token) {
      console.warn("⚠️ Failed to retrieve FCM token.");
      return;
    }

    console.log("✅ FCM Token generated:", token);

    // Send to backend
    const backendUrl =
      process.env.REACT_APP_API || "https://picknpay-backend-5.onrender.com/api";

    await fetch(`${backendUrl}/orders/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fcmToken: token }),
    });

    console.log("📩 Token successfully sent to backend");
  } catch (err) {
    console.error("❌ Error getting FCM token:", err);
  }
};

// ✅ Foreground message listener (active app)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("📨 Foreground message received:", payload);

      if (payload?.notification) {
        const { title, body, icon } = payload.notification;
        new Notification(title, {
          body,
          icon: icon || "/logo192.png",
        });
      }

      resolve(payload);
    });
  });

export { messaging };
export default app;
