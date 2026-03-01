// script.js
import { auth, db } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  GoogleAuthProvider, signInWithPopup, setPersistence,
  browserLocalPersistence, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  createCalendar, listenClickCalendar, listenMonthCalendar, listenTaskButtons,
  listenHue, listenPanelButtons, listenSaveTask, createTaskList, markOccurrences,
  updateProgress
} from "./calendar.js";

// ---- ELEMENTS ----
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

const addTaskBtn = document.getElementById("addTask-btn");
const saveTaskBtn = document.getElementById("save-task");
const goBackBtn = document.getElementById("goback-task");
const modifyTaskBtn = document.getElementById("modifyTask-btn");
const buttonFooter = document.getElementById("button-footer");

const taskList = document.getElementById("task-list");
const taskManager = document.getElementById("task-manager");
const taskForm = document.getElementById("task-form");

const taskNameInput = document.getElementById("task-name");
const taskHueInput = document.getElementById("task-hue");
const huePreview = document.getElementById("hue-preview");
const hueContainer = document.getElementById("hue-container");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const profileBtn = document.getElementById("profile-btn");
const userPhoto = document.getElementById("user-photo");
const accountPanel = document.getElementById("account-floating-panel");
const changeAccountBtn = document.getElementById("changeAccount-btn");

// ---- STATE ----
let tasks = [];
let currentTask = { value: "" };
const date = new Date();

// ---- FIREBASE AUTH ----
const provider = new GoogleAuthProvider();
(async () => {
  await setPersistence(auth, browserLocalPersistence);
})();

// ---- AUTH UI ----
loginBtn.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); } catch(err) { console.error(err); }
});
changeAccountBtn.addEventListener("click", async () => {
  try { await signOut(auth); await signInWithPopup(auth, provider); } catch(err){ console.error(err); }
  accountPanel.classList.add("hidden-task-buttons");
});
logoutBtn.addEventListener("click", async () => { await signOut(auth); accountPanel.classList.add("hidden-task-buttons"); });
profileBtn.addEventListener("click", e => { e.stopPropagation(); accountPanel.classList.toggle("hidden-task-buttons"); });
document.addEventListener("click", e => { if (!accountPanel.contains(e.target) && !profileBtn.contains(e.target)) accountPanel.classList.add("hidden-task-buttons"); });

// ---- AUTH STATE ----
onAuthStateChanged(auth, user => {
  if(user){
    loginBtn.classList.add("hidden-task-buttons");
    profileBtn.classList.remove("hidden-task-buttons");
    userPhoto.src = user.photoURL;

    const tasksRef = collection(db, "users", user.uid, "tasks");
    onSnapshot(tasksRef, snapshot => {
      tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      createTaskList(taskList, tasks, currentTask, calendarDays, date);
      if(currentTask.value) markOccurrences(currentTask.value, calendarDays, date);
    });

  } else {
    loginBtn.classList.remove("hidden-task-buttons");
    profileBtn.classList.add("hidden-task-buttons");
    tasks = [];
    taskList.innerHTML = "";
    currentTask.value = "";
    calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
    updateProgress(calendarDays, progressBar, progressText);
  }
});

// ---- INIT UI ----
await createCalendar(date, monthYear, calendarDays, currentTask);
listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText, currentTask, date);
listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn, progressBar, progressText, currentTask);
listenTaskButtons(taskBtn, closePanel, panel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, modifyTaskBtn);
listenPanelButtons(addTaskBtn, goBackBtn, modifyTaskBtn, taskManager, taskForm, hueContainer);
listenHue(huePreview, hueContainer, taskHueInput);
listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList, currentTask, calendarDays, date);







