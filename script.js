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
  listenHue, listenPanelButtons, listenSaveTask, listenEditTask, createTaskList, markOccurrences, markAllTasks,
  updateProgress, enterEditMode, exitEditMode
} from "./calendar.js";


// ---- ELEMENTS ----
const calendarWrapper = document.getElementById("calendar-wrapper");
const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const calendarTitle = document.getElementById("calendar-title");

const dayActions = document.getElementById("day-actions");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel-btn");
const taskBtn = document.getElementById("task-btn");
const statsBtn = document.getElementById("stats-btn");

const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const panel = document.getElementById("floating-panel");
const statsPanel = document.getElementById("stats-floating-panel");
const overlay = document.getElementById("overlay");
const closePanel = document.getElementById("close-panel");
const closeStatsPanel = document.getElementById("close-stats-panel");

const addTaskBtn = document.getElementById("addTask-btn");
const editTaskBtn = document.getElementById("edit-task");
const saveTaskBtn = document.getElementById("save-task");
const goBackBtn = document.getElementById("goback-task");
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

const chartContainer = document.getElementById("time-bar-chart");


// ---- STATE ----
let tasks = [];
const date = new Date();
let currentTask = { value: "" };




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
  currentTask.value = "";
  calendarTitle.textContent = "CHECK CALENDAR";
  document.body.classList.remove("color-mode");
  calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
});

logoutBtn.addEventListener("click", async () => { 
  await signOut(auth); 
  accountPanel.classList.add("hidden-task-buttons"); 
  currentTask.value = "";
  calendarTitle.textContent = "CHECK CALENDAR";
  document.body.classList.remove("color-mode");
  calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
});

profileBtn.addEventListener("click", e => { e.stopPropagation(); accountPanel.classList.toggle("hidden-task-buttons"); });
document.addEventListener("click", e => { if (!accountPanel.contains(e.target) && !profileBtn.contains(e.target)) accountPanel.classList.add("hidden-task-buttons"); });

// ---- AUTH STATE ----
onAuthStateChanged(auth, user => {
  if(user){
    calendarWrapper.classList.remove("hidden-task-buttons");
    loginBtn.classList.add("hidden-task-buttons");
    profileBtn.classList.remove("hidden-task-buttons");
    taskBtn.classList.remove("semi-transparent");
    statsBtn.classList.remove("semi-transparent");
    userPhoto.src = user.photoURL;

    const tasksRef = collection(db, "users", user.uid, "tasks");
    onSnapshot(tasksRef, async snapshot => {
      tasks.length = 0;
      snapshot.forEach(doc => { tasks.push({ id: doc.id, ...doc.data() });  });
      createTaskList(taskList, tasks, currentTask, calendarDays, calendarTitle, date, progressBar, progressText, calendarWrapper, buttonFooter, panel, overlay, taskForm, taskManager, hueContainer, huePreview, editTaskBtn, saveTaskBtn, taskHueInput, taskNameInput);
      await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText, tasks);
      updateProgress(calendarDays, progressBar, progressText);
    });

  } else {
    calendarWrapper.classList.add("hidden-task-buttons");
    loginBtn.classList.remove("hidden-task-buttons");
    profileBtn.classList.add("hidden-task-buttons");
    taskBtn.classList.add("semi-transparent");
    statsBtn.classList.add("semi-transparent");

    tasks = [];
    taskList.innerHTML = "";
    currentTask.value = "";
    calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
    updateProgress(calendarDays, progressBar, progressText);
  }
});

// ---- INIT UI ----
(async () => {
  await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText, tasks);
})();
listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText, currentTask, date);
listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn, progressBar, progressText, currentTask, tasks);
listenTaskButtons(taskBtn, statsBtn, closePanel, closeStatsPanel, panel, statsPanel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, taskList, taskNameInput, taskHueInput, huePreview, currentTask, chartContainer);
listenPanelButtons(addTaskBtn, goBackBtn, taskManager, taskForm, taskList, hueContainer, editTaskBtn, saveTaskBtn, taskNameInput, taskHueInput, huePreview);
listenHue(huePreview, hueContainer, taskHueInput, taskList);
listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList, currentTask, calendarDays, date);
listenEditTask(editTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, taskList, calendarTitle);







