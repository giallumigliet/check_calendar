import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
    if (day === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear())
      dayDiv.classList.add("today");
    calendarDays.appendChild(dayDiv);
  }
}

// ---------------- Task UI ----------------
export function listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList) {
  saveTaskBtn.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();
    const hue = taskHueInput.value;

    if (!name || tasks.some(task => task.id === name)) return;

    const uid = auth.currentUser.uid;
    await setDoc(doc(db, "users", uid, "tasks", name), { color: hue });

    tasks.push({ id: name, color: hue });
    createTaskList(taskList, tasks);

    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
  });
}

export function createTaskList(taskList, tasks) {
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
    });

    newTask.addEventListener("click", () => {
      document.documentElement.style.setProperty("--main-hue", hue);
    });
  });
}

// ---------------- Other UI Functions ----------------
// listenClickCalendar, listenMonthCalendar, listenTaskButtons, listenPanelButtons, listenHue, updateProgress
// ... (resto del codice calendar.js rimane identico come nel tuo originale)
