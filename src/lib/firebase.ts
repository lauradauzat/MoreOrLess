import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    // Only connect to emulators in browser environment
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  }
}

export const createCounter = async (title: string, userId?: string) => {
  const countersRef = collection(db, 'counters');
  const docRef = await addDoc(countersRef, {
    name: title,
    value: 0,
    userId: userId || null,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    recentActions: []
  });
  return docRef.id;
};

export const getUserCounters = async (userId: string) => {
  console.log('Fetching counters for user:', userId);
  const countersRef = collection(db, 'counters');
  const q = query(countersRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const counters = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      value: data.value || 0,
      createdAt: data.createdAt?.toDate() || new Date()
    };
  });
  
  console.log('Found counters:', counters);
  return counters;
};

export const updateCounterName = async (counterId: string, newName: string) => {
  const counterRef = doc(db, 'counters', counterId);
  await updateDoc(counterRef, {
    name: newName,
    lastUpdated: serverTimestamp()
  });
};

export { app, auth, db, analytics }; 