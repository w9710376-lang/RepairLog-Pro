import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
const firebaseConfig = {
  projectId: "macro-stage-rt8c4",
  appId: "1:246308179815:web:e0a743b7cbfcac6536a9c2",
  apiKey: "AIzaSyDnQ7QnkpwCgMusxztH1LopYeG0HdSVJNk",
  authDomain: "macro-stage-rt8c4.firebaseapp.com",
  storageBucket: "macro-stage-rt8c4.firebasestorage.app",
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const testRef = ref(storage, 'test.txt');
uploadString(testRef, 'Hello, world!').then(() => {
  console.log('Upload successful');
}).catch((e) => {
  console.error('Upload failed', e);
});
