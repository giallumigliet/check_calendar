// script.js
import { auth, db } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  GoogleAuthProvider, signInWithPopup, setPersistence,
  browserLocalPersistence, onAuthStateChanged, signOut, deleteUser 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDocs, deleteDoc, doc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  createCalendar, listenClickCalendar, listenMonthCalendar, listenTaskButtons,
  listenHue, listenPanelButtons, listenSaveTask, listenEditTask, listenNotifications, createTaskList, markOccurrences, markAllTasks,
  updateProgress, enterEditMode, exitEditMode
} from "./calendar.js";


// ---- ELEMENTS ----
const calendarWrapper = document.getElementById("calendar-wrapper");
const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const calendarTitle = document.getElementById("calendar-title");

const message = document.getElementById("message");

const dayActions = document.getElementById("day-actions");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel-btn");
const taskBtn = document.getElementById("task-btn");
const statsBtn = document.getElementById("stats-btn");

const progressWrapper = document.getElementById("progressWrapper");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const panel = document.getElementById("floating-panel");
const statsPanel = document.getElementById("stats-floating-panel");
const notificationsPanel = document.getElementById("notifications-floating-panel");
const confirmNotificationBtn = document.getElementById("confirm-notification");
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
const resetDataBtn = document.getElementById("resetData-btn");

const profileBtn = document.getElementById("profile-btn");
const userPhoto = document.getElementById("user-photo");
const accountPanel = document.getElementById("account-floating-panel");
const changeAccountBtn = document.getElementById("changeAccount-btn");

const chartContainer = document.getElementById("time-bar-chart");

const mondayFlag = document.getElementById("monday-flag");
const tuesdayFlag = document.getElementById("tuesday-flag");
const wednesdayFlag = document.getElementById("wednesday-flag");
const thursdayFlag = document.getElementById("thursday-flag");
const fridayFlag = document.getElementById("friday-flag");
const saturdayFlag = document.getElementById("saturday-flag");
const sundayFlag = document.getElementById("sunday-flag");

const dayFlags = [
  { el: mondayFlag, name: "monday" },
  { el: tuesdayFlag, name: "tuesday" },
  { el: wednesdayFlag, name: "wednesday" },
  { el: thursdayFlag, name: "thursday" },
  { el: fridayFlag, name: "friday" },
  { el: saturdayFlag, name: "saturday" },
  { el: sundayFlag, name: "sunday" },
];



const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.body.classList.add(prefersDark ? 'dark' : 'light');
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', e => {
  document.body.classList.toggle('dark', e.matches);
  document.body.classList.toggle('light', !e.matches);
});

const lightDarkButton = document.getElementById('lightDark-btn');

lightDarkButton.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  
  const metaTheme = document.querySelector("#theme-color-meta");
  const bgColor = getComputedStyle(document.body)
    .getPropertyValue("--bg-color")
    .trim();
  metaTheme.setAttribute("content", bgColor);
});




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


resetDataBtn.addEventListener("click", async () => {
  if (!auth.currentUser) return;

  const confirmDelete = confirm("Your account and all associated data will be deleted permanently. Continue?");
  if (!confirmDelete) return;

  try {
    const uid = auth.currentUser.uid;
    const tasksRef = collection(db, "users", uid, "tasks");
    const tasksSnap = await getDocs(tasksRef);

    for (const taskDoc of tasksSnap.docs) {
      const taskId = taskDoc.id;

      // delete occurrences
      const occRef = collection(db, "users", uid, "tasks", taskId, "occurrences");
      const occSnap = await getDocs(occRef);

      for (const occDoc of occSnap.docs) {
        await deleteDoc(doc(db, "users", uid, "tasks", taskId, "occurrences", occDoc.id));
      }

      // delete tasks
      await deleteDoc(doc(db, "users", uid, "tasks", taskId));
    }
    await deleteUser(auth.currentUser);

    // reset UI
    accountPanel.classList.add("hidden-task-buttons");
    currentTask.value = "";
    calendarTitle.textContent = "CHECK CALENDAR";
    document.body.classList.remove("color-mode");

  } catch (err) {
    console.error("Error deleting account:", err);

    // important case
    if (err.code === "auth/requires-recent-login") {
      alert("Please log in again before deleting your account.");
    }
  }
});


profileBtn.addEventListener("click", e => { e.stopPropagation(); accountPanel.classList.toggle("hidden-task-buttons"); });
document.addEventListener("click", e => { if (!accountPanel.contains(e.target) && !profileBtn.contains(e.target)) accountPanel.classList.add("hidden-task-buttons"); });

// ---- AUTH STATE ----
onAuthStateChanged(auth, async user => {
  if(user){
    console.log("user logged: ", user.uid);
    calendarWrapper.classList.remove("hidden-task-buttons");
    loginBtn.classList.add("hidden-task-buttons");
    profileBtn.classList.remove("hidden-task-buttons");
    taskBtn.classList.remove("semi-transparent");
    statsBtn.classList.remove("semi-transparent");
    userPhoto.src = user.photoURL;
    let first = true;
    
    const tasksRef = collection(db, "users", user.uid, "tasks");
    onSnapshot(tasksRef, async snapshot => {
      tasks.length = 0;
      snapshot.forEach(doc => { tasks.push({ id: doc.id, ...doc.data() });  });
      createTaskList(taskList, tasks, currentTask, calendarDays, calendarTitle, date, progressWrapper, progressBar, progressText, calendarWrapper, buttonFooter, panel, overlay, taskForm, taskManager, hueContainer, huePreview, editTaskBtn, saveTaskBtn, taskHueInput, taskNameInput, notificationsPanel, currentNotificationTask);
      
      if (first) {
        await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText, tasks);
        first = false;
      }
    });

  } else {
    console.log("user NOT logged!!");
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


// ------------------------------------------------
listenNotifications(notificationsPanel, overlay, calendarWrapper, buttonFooter, confirmNotificationBtn, dayFlags, reminderTimeInput, currentNotificationTask)
listenClickCalendar(addBtn, cancelBtn, taskBtn, dayActions, calendarDays, progressBar, progressText, currentTask, date, message, tasks);
listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn, progressBar, progressText, currentTask, tasks);
listenTaskButtons(taskBtn, statsBtn, closePanel, closeStatsPanel, panel, statsPanel, notificationsPanel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, taskList, taskNameInput, taskHueInput, huePreview, currentTask, tasks, chartContainer);
listenPanelButtons(addTaskBtn, goBackBtn, taskManager, taskForm, taskList, hueContainer, editTaskBtn, saveTaskBtn, taskNameInput, taskHueInput, huePreview);
listenHue(huePreview, hueContainer, taskHueInput, taskList);
listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList, currentTask, calendarTitle, calendarDays, date, monthYear, progressBar, progressText, panel, notificationsPanel, overlay, currentNotificationTask);
listenEditTask(editTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, taskList, calendarTitle, calendarDays, date, tasks);







