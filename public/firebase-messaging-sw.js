importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDem5jiT6AzQh3RNwfUqLVQCy2HWc23LLM",
  authDomain: "picknpay-f4361.firebaseapp.com",
  projectId: "picknpay-f4361",
  storageBucket: "picknpay-f4361.firebasestorage.app",
  messagingSenderId: "605257463073",
  appId: "1:605257463073:web:dd0984f63216eb169eba60",
  measurementId: "G-JD0ZJXEBKB"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png',
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
