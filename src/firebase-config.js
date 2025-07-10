// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbWv7ixdJwFlTMTDjDpjIJ-tHzz0ZnLTA",
  authDomain: "product-manager-devpost.firebaseapp.com",
  projectId: "product-manager-devpost",
  storageBucket: "product-manager-devpost.firebasestorage.app",
  messagingSenderId: "499344713443",
  appId: "1:499344713443:web:0b6506994eb3eda13807d6",
  measurementId: "G-HQ8HYXG0GZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export default db