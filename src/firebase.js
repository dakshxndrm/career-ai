import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWmd1mnl5tFmPAMAVrOqqql4dK_U7vEhk",
  authDomain: "career-ai-13817.firebaseapp.com",
  projectId: "career-ai-13817",
  storageBucket: "career-ai-13817.firebasestorage.app",
  messagingSenderId: "330152133904",
  appId: "1:330152133904:web:676ddf0fbaeb32d2a89195"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
