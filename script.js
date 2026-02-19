import { createCalendar } from "./calendar.js";
import { listenClickCalendar } from "./calendar.js";
import { listenMonthCalendar } from "./calendar.js";
import { updateProgress } from "./calendar.js";


const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");

const dayActions = document.getElementById("day-actions");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel-btn");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");



const date = new Date();
const year = date.getFullYear();
const month = date.getMonth();


createCalendar(date, monthYear, calendarDays);

listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText);

listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn)

