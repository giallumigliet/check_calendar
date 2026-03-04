import { db, auth } from "./firebase.js";
import { doc, setDoc, deleteDoc, addDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -------- CALENDAR DRAW --------
export async function createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText) {
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
    calendarDays.querySelectorAll(".day").forEach(day =>
      day.classList.remove("completed")
    );
    await markOccurrences(currentTask.value, calendarDays, date);
    updateProgress(calendarDays, progressBar, progressText);
  }
}

// -------- OCCURRENCES --------
export async function saveOccurrence(taskId, dateStr, quantity = 1) {
  if (!auth.currentUser || !taskId) return;
  try {
    const uid = auth.currentUser.uid;
    if (quantity > 0) {
      await setDoc(
        doc(db, "users", uid, "tasks", taskId, "occurrences", dateStr),
        { quantity },
        { merge: true }
      );
    } else {
      // elimina occorrenza se quantity 0
      await deleteDoc(doc(db, "users", uid, "tasks", taskId, "occurrences", dateStr));
    }
  } catch(err) {
    console.error("Error saving occurrence:", err);
  }
}

export async function markOccurrences(taskId, calendarDays, date) {
  if (!auth.currentUser || !taskId) return;
  try {
    const uid = auth.currentUser.uid;
    const occRef = collection(db, "users", uid, "tasks", taskId, "occurrences");
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

    if (!name) {
      alert("Insert a name to create the task!");
      return;
    }

    try {
      const uid = auth.currentUser.uid;
      const docRef = await addDoc(
        collection(db, "users", uid, "tasks"),
        { name: name, color: hue }
      );
      const taskId = docRef.id;
      currentTask.value = taskId;
    } catch(err) { 
      console.error(err); 
      return; 
    }

    

    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
  });
}



export function listenEditTask(editTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, taskList) {
  editTaskBtn.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();
    const hue = taskHueInput.value;
    
    if (!name) {
      alert("Insert a name to save the task!");
      return;
    }

    try {
      const uid = auth.currentUser.uid;
      const editingTask = taskList.querySelector(".task-item.editing");
      if (!editingTask) return;
      await updateDoc(
        doc(db, "users", uid, "tasks", editingTask.dataset.id),
        { name: name, color: hue }
      );

    } catch (err) {
      console.error(err);
      return;
    }
    

    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
    exitEditMode(taskList);
  });
}






export function enterEditMode(taskList, newTask) {
  taskList.classList.add("editing-mode");
  newTask.classList.add("editing");
}

export function exitEditMode(taskList) {
  taskList.classList.remove("editing-mode");
  taskList.querySelectorAll(".task-item").forEach(task => {
    task.classList.remove("editing");
  });
}


export function createTaskList(taskList, tasks, currentTask, calendarDays, calendarTitle, date, progressBar, progressText, calendarWrapper, buttonFooter, panel, overlay, taskForm, taskManager, hueContainer, editTaskBtn, saveTaskBtn) {
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const { id: taskId, name, color: hue } = task;


    ////
    const newTask = document.createElement("div");
    newTask.dataset.id = taskId;
    newTask.classList.add("task-item");
    newTask.style.backgroundColor = `hsl(${hue}, 90%, 45%)`;
    
    const taskName = document.createElement("span");
    taskName.classList.add("task-name");
    taskName.textContent = name;
    
    const actions = document.createElement("div");
    actions.classList.add("task-actions");
    
    const moreBtn = document.createElement("div");
    moreBtn.classList.add("task-more");
    moreBtn.textContent = "⋮";
    
    const menu = document.createElement("div");
    menu.classList.add("task-menu");
    
    const editItem = document.createElement("div");
    editItem.classList.add("menu-item", "edit");
    editItem.textContent = "Edit";
    
    const deleteItem = document.createElement("div");
    deleteItem.classList.add("menu-item", "delete");
    deleteItem.textContent = "Delete";
    
    menu.appendChild(editItem);
    menu.appendChild(deleteItem);
    actions.appendChild(moreBtn);
    actions.appendChild(menu);
    
    newTask.appendChild(taskName);
    newTask.appendChild(actions);
    taskList.appendChild(newTask);
    ////

    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
    
      // chiudi altri menu aperti
      document.querySelectorAll(".task-menu").forEach(m => {
        if (m !== menu) m.classList.remove("show");
      });
    
      menu.classList.toggle("show");
    });
    

    document.addEventListener("click", () => {
      document.querySelectorAll(".task-menu").forEach(m => {
        m.classList.remove("show");
      });
    });


    // click su delete


    deleteItem.addEventListener("click", async (e) => {
      e.stopPropagation();
      menu.classList.remove("show");
    
      if (!confirm("Press OK to delete this task.")) return;
      try {
        const uid = auth.currentUser.uid;
        const occRef = collection(db, "users", uid, "tasks", taskId, "occurrences");
        const snapshot = await getDocs(occRef);
        for (const occDoc of snapshot.docs) {
          await deleteDoc(doc(db, "users", uid, "tasks", taskId, "occurrences", occDoc.id));
        }
        await deleteDoc(doc(db, "users", uid, "tasks", taskId));
      } catch(err) { console.error(err); }
      newTask.remove();

      const idx = tasks.findIndex(t => t.id === taskId);
      if (idx > -1) tasks.splice(idx, 1);
      if (currentTask.value === taskId) {
        currentTask.value = "";
        calendarTitle.textContent = "CHECK CALENDAR";
        document.documentElement.style.setProperty("--main-hue", 150);
        calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
      }
    
    });


    editItem.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.remove("show");
      taskForm.classList.remove("hidden-task-buttons");
      taskManager.classList.add("hidden-task-buttons");
      hueContainer.classList.remove("hidden-task-buttons");
      
      saveTaskBtn.classList.add("hidden-task-buttons");
      editTaskBtn.classList.remove("hidden-task-buttons");

      
      exitEditMode(taskList);
      enterEditMode(taskList, newTask);
    });
    

    newTask.addEventListener("click", async () => {
      currentTask.value = taskId;
      document.documentElement.style.setProperty("--main-hue", hue);
      calendarTitle.textContent = name;
      calendarDays.querySelectorAll(".day").forEach(day =>
        day.classList.remove("completed")
      );
      await markOccurrences(taskId, calendarDays, date);
      updateProgress(calendarDays, progressBar, progressText);
      calendarWrapper.classList.remove("hidden-day-buttons");
      buttonFooter.classList.remove("hidden-day-buttons");
      panel.classList.remove("active");
      overlay.classList.remove("active");
      
      requestAnimationFrame(() => {
        document.documentElement.style.backgroundColor = "#ffffff";
      })
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
export function listenTaskButtons(taskBtn, closePanel, panel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, taskList, taskNameInput, taskHueInput, huePreview) {
  taskBtn.addEventListener("click", () => {
        calendarWrapper.classList.add("hidden-day-buttons");
        buttonFooter.classList.add("hidden-day-buttons");
        panel.classList.add("active");
        overlay.classList.add("active");

        taskManager.classList.remove("hidden-task-buttons");
        taskForm.classList.add("hidden-task-buttons");
    });

    closePanel.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        overlay.classList.remove("active");
        
        requestAnimationFrame(() => {
          document.documentElement.style.backgroundColor = "#ffffff";
        })

        exitEditMode(taskList);
      taskNameInput.value = "";
      taskHueInput.value = 162;
      huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;

    });

    overlay.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        overlay.classList.remove("active");

        requestAnimationFrame(() => {
          document.documentElement.style.backgroundColor = "#ffffff";
        })

        exitEditMode(taskList);
        taskNameInput.value = "";
        taskHueInput.value = 162;
        huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;

    });
}

export function listenPanelButtons(addTaskBtn, goBackBtn, taskManager, taskForm, taskList, hueContainer, editTaskBtn, saveTaskBtn, taskNameInput, taskHueInput, huePreview) {
  addTaskBtn.addEventListener("click", () => {
    taskForm.classList.remove("hidden-task-buttons");
    taskManager.classList.add("hidden-task-buttons");
    hueContainer.classList.remove("hidden-task-buttons");
    editTaskBtn.classList.add("hidden-task-buttons");
    saveTaskBtn.classList.remove("hidden-task-buttons");
  });
  
  goBackBtn.addEventListener("click", () => {
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
    hueContainer.classList.add("hidden-task-buttons");
    exitEditMode(taskList);
    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;
  });
}


export function listenHue(huePreview, hueContainer, taskHueInput, taskList) {
    huePreview.addEventListener("click", () => {
      hueContainer.classList.toggle("hidden-task-buttons");
    });

    taskHueInput.addEventListener("input", () => {
      huePreview.style.backgroundColor = `hsl(${taskHueInput.value}, 90%, 55%)`;
      
      const editingTask = taskList.querySelector(".task-item.editing");
      if (editingTask) {
        editingTask.style.backgroundColor = `hsl(${taskHueInput.value}, 70%, 55%)`;
      }
    });
}




export function listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn, progressBar, progressText, currentTask) {
    // left arrow
    prevMonthBtn.addEventListener("click", async () => {
        date.setMonth(date.getMonth() - 1);
        await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText);
        updateProgress(calendarDays, progressBar, progressText);
    });

    // right arrow
    nextMonthBtn.addEventListener("click", async () => {
        date.setMonth(date.getMonth() + 1);
        await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText);
        updateProgress(calendarDays, progressBar, progressText);
    });
}















































