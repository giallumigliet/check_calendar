import { createCalendar } from "./calendar.js";
import { listenClickCalendar } from "./calendar.js";
import { listenMonthCalendar } from "./calendar.js";
import { listenTaskButtons } from "./calendar.js";


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



const date = new Date();
const year = date.getFullYear();
const month = date.getMonth();



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

createCalendar(date, monthYear, calendarDays);

listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText);

listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn);

listenTaskButtons(taskBtn, closePanel, panel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, modifyTaskBtn);






addTaskBtn.addEventListener("click", () => {
  taskManager.classList.add("hidden-task-buttons");
  taskForm.classList.remove("hidden-task-buttons");
  hueContainer.classList.add("hidden-task-buttons");

  const badges = document.querySelectorAll(".delete-badge");
  badges.forEach(badge => {
    badge.classList.add("hidden");
  });
  modifyTaskBtn.classList.remove("modify-active");
});


goBackBtn.addEventListener("click", () => {
  taskManager.classList.remove("hidden-task-buttons");
  taskForm.classList.add("hidden-task-buttons");
});


huePreview.addEventListener("click", () => {
  hueContainer.classList.toggle("hidden-task-buttons");
});

taskHueInput.addEventListener("input", () => {
  const hue = taskHueInput.value;
  huePreview.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
});



saveTaskBtn.addEventListener("click", () => {
  const name = taskNameInput.value.trim();
  const hue = taskHueInput.value;

  if (!name) return;

  const newTask = document.createElement("div");
  newTask.classList.add("task-item");
  newTask.dataset.hue = hue;
  newTask.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
  newTask.textContent = name;

  // crea badge delete
  const deleteBadge = document.createElement("div");
  deleteBadge.classList.add("delete-badge", "hidden");
  deleteBadge.textContent = "━";

  newTask.appendChild(deleteBadge);
  taskList.appendChild(newTask);

  deleteBadge.addEventListener("click", (e) => {
    if (confirm("Press OK to delete the task.")) {
        e.stopPropagation(); // evita click sulla task
        newTask.remove();
    }
  });

  // reset form
  taskNameInput.value = "";
  taskHueInput.value = 162;
  huePreview.style.backgroundColor = `hsl(162, 80%, 60%)`;

  
  taskForm.classList.add("hidden-task-buttons");
  taskManager.classList.remove("hidden-task-buttons");

  newTask.addEventListener("click", () => {
    document.documentElement.style.setProperty("--main-hue", newTask.dataset.hue);
  });
});



modifyTaskBtn.addEventListener("click", () => {
  const badges = document.querySelectorAll(".delete-badge");

  badges.forEach(badge => {
    badge.classList.toggle("hidden");
  });

  modifyTaskBtn.classList.toggle("modify-active");
});







