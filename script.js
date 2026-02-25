import { createCalendar } from "./calendar.js";
import { listenClickCalendar } from "./calendar.js";
import { listenMonthCalendar } from "./calendar.js";
import { listenTaskButtons } from "./calendar.js";
import { listenHue } from "./calendar.js";
import { listenPanelButtons } from "./calendar.js";
import { listenSaveTask } from "./calendar.js";


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

const date = new Date();
const year = date.getFullYear();
const month = date.getMonth();



createCalendar(date, monthYear, calendarDays);

listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText);

listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn);

listenTaskButtons(taskBtn, closePanel, panel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, modifyTaskBtn);

listenPanelButtons(addTaskBtn, goBackBtn, modifyTaskBtn, taskManager, taskForm, hueContainer);

listenHue(huePreview, hueContainer, taskHueInput);

listenSaveTask(saveTaskBtn, taskList, taskNameInput, taskHueInput, huePreview, taskManager, taskForm);








