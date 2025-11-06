// frontend/public/firebase-messaging-sw.js
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.appspot.com",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:dd0984f63216eb169eba60",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log("📨 Background message received:", payload);
  
  const notificationTitle = payload.notification?.title || "PickNPay";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: 'picknpay-notification',
    vibrate: [200, 100, 200],     // Vibration pattern for mobile
    sound: '/notification.mp3',    // Custom sound for notifications
    renotify: true,               // Always notify even if there's an existing notification
    data: payload.data,           // Store any additional data
    actions: [
      {
        action: 'view',
        title: '👀 View',
      },
      {
        action: 'close',
        title: '❌ Dismiss',
      }
    ],
    // Mobile-specific options
    android: {
      priority: 'high',
      sound: 'notification',
      clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      channelId: 'orders'
    },
    ios: {
      sound: 'notification.mp3',
      badge: '1',
      priority: 5,
      threadId: 'picknpay-orders'
    }
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('👆 Notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  // Handle action button clicks
  if (event.action === 'open') {
    // Open/focus the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          if (clientList.length > 0) {
            let client = clientList[0];
            client.focus();
            return client.navigate('/myorders');
          }
          return clients.openWindow('/myorders');
        })
    );
  }
});
