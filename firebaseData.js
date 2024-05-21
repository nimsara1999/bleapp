// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAhDR7sPKP-MMd3wALg_kBu3dJEA1eJjwU",
    authDomain: "wolves-firebaseauth.firebaseapp.com",
    projectId: "wolves-firebaseauth",
    storageBucket: "wolves-firebaseauth.appspot.com",
    messagingSenderId: "514107705095",
    appId: "1:514107705095:web:5591e0acbcfbda1b54a7a2"
  };

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
export { auth, db };