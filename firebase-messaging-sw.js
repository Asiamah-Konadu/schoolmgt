importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC4J8UqXPI9ysm05I51zjy8Iy_QneqPxs8',
  authDomain: 'schoolmgt-6fcfb.firebaseapp.com',
  projectId: 'schoolmgt-6fcfb',
  storageBucket: 'schoolmgt-6fcfb.firebasestorage.app',
  messagingSenderId: '229368337869',
  appId: '1:229368337869:web:ae87ed6a57e57e17d36084',
  measurementId: 'G-SG9444T184'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Kings Academy';
  const body = payload?.notification?.body || 'You have a new update.';

  self.registration.showNotification(title, {
    body,
    icon: './icons/app-icon.svg'
  });
});
