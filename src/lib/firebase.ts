import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBL84W31xOP92ILeNSbTNB3NR5fG4EW1Vc",
  authDomain: "sniplive-12fea.firebaseapp.com",
  projectId: "sniplive-12fea",
  storageBucket: "sniplive-12fea.firebasestorage.app",
  messagingSenderId: "70517656791",
  appId: "1:70517656791:web:762d35b4005785e922f492"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
