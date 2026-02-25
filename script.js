// Import Firebase for database
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Import functions 
import { createCalendar, listenClickCalendar, listenMonthCalendar, listenTaskButtons, listenHue, listenPanelButtons, listenSaveTask} from "./calendar.js";



// Getting html elements
const calendarWrapper = document.getElementById("calendar-wrapper");
const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");

const dayActions = document.getElementById("day-actions");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel-btn");
const taskBtn = document.getElementById("task-btn");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const panel = document.getElementById("floating-panel");
const overlay = document.getElementById("overlay");
const closePanel = document.getElementById("close-panel");
const buttonFooter = document.getElementById("button-footer");

const addTaskBtn = document.getElementById("addTask-btn");
const saveTaskBtn = document.getElementById("save-task");
const goBackBtn = document.getElementById("goback-task");

const taskList = document.getElementById("task-list");
const taskManager = document.getElementById("task-manager");
const taskForm = document.getElementById("task-form");

const taskNameInput = document.getElementById("task-name");
const taskHueInput = document.getElementById("task-hue");
const huePreview = document.getElementById("hue-preview");
const hueContainer = document.getElementById("hue-container");

const modifyTaskBtn = document.getElementById("modifyTask-btn");

// Today
const date = new Date();
const year = date.getFullYear();
const month = date.getMonth();


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOkre2FhmRFlSBPYznZUVAJxLQh-QeExc",
  authDomain: "check-calendar-giallumigliet.firebaseapp.com",
  projectId: "check-calendar-giallumigliet",
  storageBucket: "check-calendar-giallumigliet.firebasestorage.app",
  messagingSenderId: "741223614800",
  appId: "1:741223614800:web:41af2763f7c3c6ebb5c455"
};
// Firebase initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence);
const db = getFirestore(app);

// Login Google
const provider = new GoogleAuthProvider();


document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Utente:", result.user);
  } catch (error) {
    console.error(error);
  }
});



createCalendar(date, monthYear, calendarDays);

listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText);

listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn);

listenTaskButtons(taskBtn, closePanel, panel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, modifyTaskBtn);

listenPanelButtons(addTaskBtn, goBackBtn, modifyTaskBtn, taskManager, taskForm, hueContainer);

listenHue(huePreview, hueContainer, taskHueInput);

listenSaveTask(saveTaskBtn, taskList, taskNameInput, taskHueInput, huePreview, taskManager, taskForm);











