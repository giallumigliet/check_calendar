import { doc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "./script.js";

// ---------------- Calendar ----------------
export function createCalendar(date, monthYear, calendarDays) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthYear.textContent = months[month] + " " + year;
  calendarDays.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay === 0) ? 7 : firstDay;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = day;
    dayDiv.classList.add("day");
    if (day === 1) dayDiv.style.gridColumnStart = startDay;
    if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear())
      dayDiv.classList.add("today");
    calendarDays.appendChild(dayDiv);
  }
}

// ---------------- Occurrences ----------------
export async function saveOccurrence(taskName, dateStr, quantity = 1) {
  if (!auth.currentUser || !taskName) return;
  const uid = auth.currentUser.uid;
  await setDoc(
    doc(db, "users", uid, "tasks", taskName, "occurrences", dateStr),
    { quantity },
    { merge: true }
  );
}

export async function markOccurrences(taskName, calendarDays, date) {
  if (!auth.currentUser || !taskName) return;
  const uid = auth.currentUser.uid;
  const occRef = collection(db, "users", uid, "tasks", taskName, "occurrences");
  const snapshot = await getDocs(occRef);
  const completedDates = snapshot.docs.map(doc => doc.id); // YYYY-MM-DD

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  calendarDays.querySelectorAll(".day").forEach(dayDiv => {
    const day = dayDiv.textContent.padStart(2, "0");
    const month = (currentMonth + 1).toString().padStart(2, "0");
    const year = currentYear;
    const dateStr = `${year}-${month}-${day}`;
    if (completedDates.includes(dateStr)) dayDiv.classList.add("completed");
    else dayDiv.classList.remove("completed");
  });
}

// ---------------- Task UI ----------------
export function listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList, currentTask, calendarDays, date) {
  saveTaskBtn.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();
    const hue = taskHueInput.value;

    if (!name || tasks.some(task => task.id === name)) return;

    const uid = auth.currentUser.uid;
    await setDoc(doc(db, "users", uid, "tasks", name), { color: hue });

    tasks.push({ id: name, color: hue });
    createTaskList(taskList, tasks, currentTask, calendarDays, date);

    // Seleziona subito la nuova task
    currentTask.value = name;
    await markOccurrences(name, calendarDays, date);

    // reset form
    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
  });
}

export function createTaskList(taskList, tasks, currentTask, calendarDays, date) {
  taskList.innerHTML = "";

  tasks.forEach(task => {
    const { id: name, color: hue } = task;
    const newTask = document.createElement("div");
    newTask.classList.add("task-item");
    newTask.dataset.hue = hue;
    newTask.style.backgroundColor = `hsl(${hue}, 90%, 45%)`;
    newTask.textContent = name;

    const deleteBadge = document.createElement("div");
    deleteBadge.classList.add("delete-badge", "hidden");
    deleteBadge.textContent = "━";
    newTask.appendChild(deleteBadge);
    taskList.appendChild(newTask);

    deleteBadge.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Press OK to delete the task.")) return;
      const uid = auth.currentUser.uid;
      await deleteDoc(doc(db, "users", uid, "tasks", name));
      newTask.remove();
      const index = tasks.findIndex(t => t.id === name);
      if (index > -1) tasks.splice(index, 1);

      if (currentTask.value === name) {
        currentTask.value = "";
        calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
      }
    });

    newTask.addEventListener("click", async () => {
      currentTask.value = name;
      document.documentElement.style.setProperty("--main-hue", hue);
      await markOccurrences(name, calendarDays, date);
    });
  });
}

// ---------------- Calendar click ----------------
export function listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText, currentTask, date) {
  let selectedDay = null;

  calendarDays.addEventListener("click", function(e) {
    selectedDay = e.target;
    if (selectedDay.tagName === "DIV") {
      document.querySelectorAll(".days div").forEach(day => day.classList.remove("selected"));
      selectedDay.classList.add("selected");
      dayActions.classList.remove("hidden-day-buttons");
    }
  });

  document.addEventListener("click", function(e) {
    const clickedDay = e.target.closest(".days div");
    const clickedDayActions = e.target.closest("#day-actions");
    if (!clickedDay && !clickedDayActions) {
      document.querySelectorAll(".days div").forEach(day => day.classList.remove("selected"));
      selectedDay = null;
      dayActions.classList.add("hidden-day-buttons");
    }
  });

  addBtn.addEventListener("click", async function() {
    if (selectedDay && currentTask.value) {
      const day = selectedDay.textContent.padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const dateStr = `${year}-${month}-${day}`;

      selectedDay.classList.remove("selected");
      selectedDay.classList.add("completed");
      selectedDay = null;

      await saveOccurrence(currentTask.value, dateStr, 1);

      dayActions.classList.add("hidden-day-buttons");
      updateProgress(calendarDays, progressBar, progressText);
    }
  });

  cancelBtn.addEventListener("click", async function() {
    if (selectedDay && currentTask.value) {
      const day = selectedDay.textContent.padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const dateStr = `${year}-${month}-${day}`;

      selectedDay.classList.remove("selected");
      selectedDay.classList.remove("completed");
      selectedDay = null;

      await saveOccurrence(currentTask.value, dateStr, 0);

      dayActions.classList.add("hidden-day-buttons");
      updateProgress(calendarDays, progressBar, progressText);
    }
  });
}

// ---------------- Progress ----------------
export function updateProgress(calendarDays, progressBar, progressText) {
  const completedNumber = calendarDays.querySelectorAll(".day.completed").length;
  const total = calendarDays.querySelectorAll(".day").length;
  if (total === 0) return;
  const percent = (completedNumber / total) * 100;
  progressBar.style.width = percent + "%";
  progressText.textContent = completedNumber;
}
