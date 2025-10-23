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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request FCM token and send to backend
export const requestForToken = async (email) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BGq2b5ugSKXnei0JunTzIqREZ-YS-YRUvfCiF2doHXIMyRKI1vG4IKJ9f61lik1EAxC-QiEomTG_u7tb9a7D8KQ",
      });
      if (token) {
        console.log("✅ FCM Token:", token);
        // Send token to backend
        await fetch(`${process.env.REACT_APP_API}/orders/fcm-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, fcmToken: token }),
        });
      }
      return token;
    } else {
      console.warn("❌ Notification permission denied.");
    }
  } catch (err) {
    console.error("❌ Error getting FCM token:", err);
  }
};

// Foreground messages
export const onMessageListener = (callback) => {
  onMessage(messaging, callback);
};

export { messaging };
export default app;
