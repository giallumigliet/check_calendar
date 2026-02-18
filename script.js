import { createCalendar } from "./calendar.js";
import { listenClickCalendar } from "./calendar.js";
import { listenMonthCalendar } from "./calendar.js";

const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const dayActions = document.getElementById("day-actions");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");



const date = new Date();
const year = date.getFullYear();
const month = date.getMonth();


createCalendar(date, monthYear, calendarDays);

listenClickCalendar(dayActions, calendarDays);

listenMonthCalendar(date, monthYear, dayActions, calendarDays, prevMonthBtn, nextMonthBtn)


const percent = 10;
updateProgress(percent);

function updateProgress(percent) {
  progressBar.style.width = percent + "%";
  progressText.textContent = percent;
}