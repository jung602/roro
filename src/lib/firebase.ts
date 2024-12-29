import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getPerformance } from "firebase/performance";
import getConfig from 'next/config';

// Runtime config 가져오기
const { publicRuntimeConfig } = getConfig() || {};

// Firebase 설정을 함수로 만들어 런타임에 가져오도록 수정
const getFirebaseConfig = () => {
  return {
    apiKey: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApps()[0];
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Initialize Performance Monitoring
if (typeof window !== 'undefined') {
  getPerformance(app);
}

// Set custom settings for Storage
storage.maxUploadRetryTime = 15000;
storage.maxOperationRetryTime = 15000;

export default app; 