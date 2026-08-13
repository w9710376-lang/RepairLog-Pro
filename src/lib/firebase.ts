import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "macro-stage-rt8c4",
  appId: "1:246308179815:web:e0a743b7cbfcac6536a9c2",
  apiKey: "AIzaSyDnQ7QnkpwCgMusxztH1LopYeG0HdSVJNk",
  authDomain: "macro-stage-rt8c4.firebaseapp.com",
  storageBucket: "macro-stage-rt8c4.firebasestorage.app",
  messagingSenderId: "246308179815",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-09e15c90-6482-4020-95f6-be256a50954c");
export const googleProvider = new GoogleAuthProvider();
