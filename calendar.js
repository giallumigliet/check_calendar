import { db, auth } from "./firebase.js";
import { doc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -------- CALENDAR DRAW --------
export async function createCalendar(date, monthYear, calendarDays, currentTask) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthYear.textContent = `${months[month]} ${year}`;
  calendarDays.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay === 0) ? 7 : firstDay; // Monday start

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = d;
    dayDiv.classList.add("day");

    // evidenzia oggi
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayDiv.classList.add("today");
    }

    if (d === 1) dayDiv.style.gridColumnStart = startDay;
    calendarDays.appendChild(dayDiv);
  }

  if (currentTask.value) {
    await markOccurrences(currentTask.value, calendarDays, date);
  }
}

// -------- OCCURRENCES --------
export async function saveOccurrence(taskName, dateStr, quantity = 1) {
  if (!auth.currentUser || !taskName) return;
  try {
    const uid = auth.currentUser.uid;
    if (quantity > 0) {
      await setDoc(
        doc(db, "users", uid, "tasks", taskName, "occurrences", dateStr),
        { quantity },
        { merge: true }
      );
    } else {
      // elimina occorrenza se quantity 0
      await deleteDoc(doc(db, "users", uid, "tasks", taskName, "occurrences", dateStr));
    }
  } catch(err) {
    console.error("Error saving occurrence:", err);
  }
}

export async function markOccurrences(taskName, calendarDays, date) {
  if (!auth.currentUser || !taskName) return;
  try {
    const uid = auth.currentUser.uid;
    const occRef = collection(db, "users", uid, "tasks", taskName, "occurrences");
    const snapshot = await getDocs(occRef);
    const completedDates = snapshot.docs.map(doc => doc.id);

    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    calendarDays.querySelectorAll(".day").forEach(dayDiv => {
      const day = dayDiv.textContent.padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      dayDiv.classList.toggle("completed", completedDates.includes(dateKey));
    });
  } catch(err) {
    console.error("Error marking occurrences:", err);
  }
}

// -------- TASK UI --------
export function listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList, currentTask, calendarDays, date) {
  saveTaskBtn.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();
    const hue = taskHueInput.value;
    if (!name || tasks.some(t => t.id === name)) return;

    try {
      const uid = auth.currentUser.uid;
      await setDoc(doc(db, "users", uid, "tasks", name), { color: hue });
    } catch(err) { console.error(err); return; }

    tasks.push({ id: name, color: hue });
    createTaskList(taskList, tasks, currentTask, calendarDays, date);

    currentTask.value = name;
    await markOccurrences(name, calendarDays, date);

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
    newTask.style.backgroundColor = `hsl(${hue}, 90%, 45%)`;
    newTask.textContent = name;

    const deleteBadge = document.createElement("div");
    deleteBadge.classList.add("delete-badge", "hidden");
    deleteBadge.textContent = "━";
    newTask.appendChild(deleteBadge);
    taskList.appendChild(newTask);

    // click su delete
    deleteBadge.addEventListener("click", async e => {
      e.stopPropagation();
      if (!confirm("Press OK to delete the task.")) return;
      try {
        const uid = auth.currentUser.uid;
        await deleteDoc(doc(db, "users", uid, "tasks", name));
      } catch(err) { console.error(err); }
      newTask.remove();
      const idx = tasks.findIndex(t => t.id === name);
      if (idx > -1) tasks.splice(idx, 1);
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


// -------- CALENDAR CLICK --------
export function listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText, currentTask, date) {
  let selectedDay = null;

  calendarDays.addEventListener("click", e => {
    if (!e.target.classList.contains("day")) return;
    selectedDay = e.target;
    calendarDays.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
    selectedDay.classList.add("selected");
    dayActions.classList.remove("hidden-day-buttons");
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".days") && !e.target.closest("#day-actions")) {
      calendarDays.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
      selectedDay = null;
      dayActions.classList.add("hidden-day-buttons");
    }
  });

  addBtn.addEventListener("click", async () => {
    if (selectedDay && currentTask.value) {
      const d = selectedDay.textContent.padStart(2, "0");
      const m = (date.getMonth()+1).toString().padStart(2,"0");
      const y = date.getFullYear();
      const key = `${y}-${m}-${d}`;

      selectedDay.classList.remove("selected");
      selectedDay.classList.add("completed");
      selectedDay = null;

      await saveOccurrence(currentTask.value, key, 1);
      dayActions.classList.add("hidden-day-buttons");
      updateProgress(calendarDays, progressBar, progressText);
    }
  });

  cancelBtn.addEventListener("click", async () => {
    if (selectedDay && currentTask.value) {
      const d = selectedDay.textContent.padStart(2, "0");
      const m = (date.getMonth()+1).toString().padStart(2,"0");
      const y = date.getFullYear();
      const key = `${y}-${m}-${d}`;

      selectedDay.classList.remove("selected");
      selectedDay.classList.remove("completed");
      selectedDay = null;

      await saveOccurrence(currentTask.value, key, 0);
      dayActions.classList.add("hidden-day-buttons");
      updateProgress(calendarDays, progressBar, progressText);
      await markOccurrences(name, calendarDays, date);
    }
  });
}

// -------- PROGRESS --------
export function updateProgress(calendarDays, progressBar, progressText) {
  const total = calendarDays.querySelectorAll(".day").length;
  const done = calendarDays.querySelectorAll(".day.completed").length;
  if (!total) return;
  const pct = (done / total) * 100;
  progressBar.style.width = pct + "%";
  progressText.textContent = done;
}

// -------- PANEL LISTENERS --------
export function listenTaskButtons(taskBtn, closePanel, panel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, modifyTaskBtn) {
  taskBtn.addEventListener("click", () => {
        calendarWrapper.classList.add("hidden-day-buttons");
        buttonFooter.classList.add("hidden-day-buttons");
        panel.classList.add("active");
        overlay.classList.add("active");

        taskManager.classList.remove("hidden-task-buttons");
        taskForm.classList.add("hidden-task-buttons");

        const badges = document.querySelectorAll(".delete-badge");
        badges.forEach(badge => {
            badge.classList.add("hidden");
        });

        modifyTaskBtn.classList.remove("modify-active");
    });

    closePanel.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        overlay.classList.remove("active");
        
        requestAnimationFrame(() => {
          document.documentElement.style.backgroundColor = "#ffffff";
        })

    });

    overlay.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        overlay.classList.remove("active");

        requestAnimationFrame(() => {
          document.documentElement.style.backgroundColor = "#ffffff";
        })

    });
}

export function listenPanelButtons(addTaskBtn, goBackBtn, modifyTaskBtn, taskManager, taskForm, hueContainer) {
  addTaskBtn.addEventListener("click", () => {
    taskForm.classList.remove("hidden-task-buttons");
    taskManager.classList.add("hidden-task-buttons");
    hueContainer.classList.remove("hidden-task-buttons");

    const badges = document.querySelectorAll(".delete-badge");
    badges.forEach(badge => {
      badge.classList.add("hidden");
    });
    modifyTaskBtn.classList.remove("modify-active");
  });
  
  goBackBtn.addEventListener("click", () => {
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
    hueContainer.classList.add("hidden-task-buttons");
  });

  
  modifyTaskBtn.addEventListener("click", () => {
      const badges = document.querySelectorAll(".delete-badge");

      badges.forEach(badge => {
          badge.classList.toggle("hidden");
      });

      modifyTaskBtn.classList.toggle("modify-active");
      
      taskManager.classList.remove("hidden-task-buttons");
      taskForm.classList.add("hidden-task-buttons");
  });
}


export function listenHue(huePreview, hueContainer, taskHueInput) {
    huePreview.addEventListener("click", () => {
      hueContainer.classList.toggle("hidden-task-buttons");
    });

    taskHueInput.addEventListener("input", () => {
      huePreview.style.backgroundColor = `hsl(${taskHueInput.value}, 90%, 55%)`;
    });
}




export function listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn, progressBar, progressText) {
    // left arrow
    prevMonthBtn.addEventListener("click", async () => {
        date.setMonth(date.getMonth() - 1);
        await createCalendar(date, monthYear, calendarDays, currentTask);
        updateProgress(calendarDays, progressBar, progressText);
    });

    // right arrow
    nextMonthBtn.addEventListener("click", async () => {
        date.setMonth(date.getMonth() + 1);
        await createCalendar(date, monthYear, calendarDays, currentTask);
        updateProgress(calendarDays, progressBar, progressText);
    });
}












