// src/Components/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.appspot.com",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:dd0984f63216eb169eba60",
  measurementId: "G-JD0ZJXEBKB",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Ask for permission and get FCM token
export const requestForToken = async (email) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BGq2b5ugSKXnei0JunTzIqREZ-YS-YRUvfCiF2doHXIMyRKI1vG4IKJ9f61lik1EAxC-QiEomTG_u7tb9a7D8KQ",
    });

    if (!token) {
      console.warn("⚠️ No FCM token retrieved.");
      return null;
    }

    console.log("✅ FCM Token generated:", token);

    // Send token to backend
    const backendUrl =
      process.env.REACT_APP_API ||
      "https://picknpay-backend-5.onrender.com/api";

    const res = await fetch(`${backendUrl}/orders/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fcmToken: token }),
    });

    if (!res.ok) {
      console.error("❌ Failed to save token:", res.status);
    } else {
      console.log("📩 Token successfully saved to backend");
    }

    return token;
  } catch (err) {
    console.error("❌ Error getting FCM token:", err);
    return null;
  }
};

// ✅ Foreground message listener
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("📨 Foreground message:", payload);
      if (payload?.notification) {
        const { title, body } = payload.notification;
        new Notification(title, {
          body,
          icon: "/logo192.png",
        });
      }
      resolve(payload);
    });
  });

export { messaging };
export default app;
