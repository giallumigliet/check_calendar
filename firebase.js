// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOkre2FhmRFlSBPYznZUVAJxLQh-QeExc",
  authDomain: "check-calendar-giallumigliet.firebaseapp.com",
  projectId: "check-calendar-giallumigliet",
  storageBucket: "check-calendar-giallumigliet.firebasestorage.app",
  messagingSenderId: "741223614800",
  appId: "1:741223614800:web:41af2763f7c3c6ebb5c455"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
