import { db, auth } from "./firebase.js";
import { doc, setDoc, deleteDoc, addDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, runTransaction} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { updateTaskBarChart, updateAllTasksMultiBarChart, updateAllTasksLineChart } from "./stats.js";

// -------- CALENDAR DRAW --------
export async function createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText, tasks) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthYear.textContent = `${months[month]} ${year}`;
  if (month === today.getMonth() && year === today.getFullYear()) {
    monthYear.style.fontWeight = "bold";
  } else {
    monthYear.style.fontWeight = "normal";
  }
  
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

  calendarDays.querySelectorAll(".day").forEach(day => {
    day.classList.remove("completed");
    day.style.background = "";
    day.style.color = "";
  });
  
  if (currentTask.value) {
    console.log("drawing task:", currentTask.value);
    await markOccurrences(currentTask.value, calendarDays, date);
    updateProgress(calendarDays, progressBar, progressText);
  } else {
    console.log("drawing tasks:", tasks);
    console.log("month:", month, "year:", year);
    await markAllTasks(calendarDays, date, tasks);
  }
}




















// -------- OCCURRENCES --------
export async function saveOccurrence(taskId, dateStr, quantity) {
  if (!auth.currentUser || !taskId || !dateStr) return;

  const uid = auth.currentUser.uid;

  const occurrenceRef = doc(
    db,
    "users",
    uid,
    "tasks",
    taskId,
    "occurrences",
    dateStr
  );

  const taskRef = doc(
    db,
    "users",
    uid,
    "tasks",
    taskId
  );

  const monthKey = getMonthKey(dateStr);

  const monthlyStatsRef = doc(
    db,
    "users",
    uid,
    "tasks",
    taskId,
    "monthlyStats",
    monthKey
  );

  try {
    await runTransaction(db, async transaction => {

      const occurrenceSnap =
        await transaction.get(occurrenceRef);

      const taskSnap =
        await transaction.get(taskRef);

      const statsSnap =
        await transaction.get(monthlyStatsRef);

      const exists = occurrenceSnap.exists();

      // =====================================================
      // AGGIUNTA OCCORRENZA
      // =====================================================

      if (quantity > 0) {

        // Se esiste già, non facciamo nulla.
        // Evita doppio conteggio.
        if (exists) {
          return;
        }

        transaction.set(occurrenceRef, {
          quantity: quantity
        });

        const currentCount =
          statsSnap.exists()
            ? (statsSnap.data().count || 0)
            : 0;

        transaction.set(
          monthlyStatsRef,
          {
            count: currentCount + quantity
          },
          { merge: true }
        );

        const taskData = taskSnap.exists()
          ? taskSnap.data()
          : {};

        const firstOccurrence =
          taskData.firstOccurrence || null;

        const lastOccurrence =
          taskData.lastOccurrence || null;

        const updates = {};

        if (
          !firstOccurrence ||
          dateStr < firstOccurrence
        ) {
          updates.firstOccurrence = dateStr;
        }

        if (
          !lastOccurrence ||
          dateStr > lastOccurrence
        ) {
          updates.lastOccurrence = dateStr;
        }

        if (Object.keys(updates).length > 0) {
          transaction.update(taskRef, updates);
        }

        return;
      }

      // =====================================================
      // ELIMINAZIONE OCCORRENZA
      // =====================================================

      if (quantity <= 0) {

        // Se non esiste, non c'è niente da cancellare.
        if (!exists) {
          return;
        }

        const oldQuantity =
          occurrenceSnap.data().quantity || 1;

        transaction.delete(occurrenceRef);

        const currentCount =
          statsSnap.exists()
            ? (statsSnap.data().count || 0)
            : 0;

        const newCount =
          Math.max(0, currentCount - oldQuantity);

        // Il count del mese diventa 0.
        // NON lo cancelliamo ancora:
        // potrebbe essere un mese intermedio.
        transaction.set(
          monthlyStatsRef,
          {
            count: newCount
          },
          { merge: true }
        );

        // Se non era first/last, abbiamo finito.
        const taskData = taskSnap.data();

        const wasFirst =
          taskData.firstOccurrence === dateStr;

        const wasLast =
          taskData.lastOccurrence === dateStr;

        if (!wasFirst && !wasLast) {
          return;
        }

        // ===================================================
        // DOBBIAMO TROVARE LA NUOVA PRIMA/L'ULTIMA
        // ===================================================

        const occurrencesRef = collection(
          db,
          "users",
          uid,
          "tasks",
          taskId,
          "occurrences"
        );

        const firstQuery = query(
          occurrencesRef,
          orderBy("__name__", "asc"),
          limit(1)
        );

        const lastQuery = query(
          occurrencesRef,
          orderBy("__name__", "desc"),
          limit(1)
        );

        const [firstSnap, lastSnap] =
          await Promise.all([
            transaction.get(firstQuery),
            transaction.get(lastQuery)
          ]);

        const newFirst =
          firstSnap.empty
            ? null
            : firstSnap.docs[0].id;

        const newLast =
          lastSnap.empty
            ? null
            : lastSnap.docs[0].id;

        // Nessuna occorrenza rimasta.
        if (!newFirst && !newLast) {

          transaction.update(taskRef, {
            firstOccurrence: null,
            lastOccurrence: null
          });

          transaction.delete(monthlyStatsRef);

          return;
        }

        transaction.update(taskRef, {
          firstOccurrence: newFirst,
          lastOccurrence: newLast
        });

        // ===================================================
        // ELIMINA I MONTHLY STATS DIVENTATI ESTERNI
        // ===================================================

        const newFirstMonth =
          getMonthKey(newFirst);

        const newLastMonth =
          getMonthKey(newLast);

        // Se il mese eliminato è diventato esterno,
        // eliminiamo il relativo monthlyStats.
        if (monthKey < newFirstMonth ||
            monthKey > newLastMonth) {

          transaction.delete(monthlyStatsRef);
        }
      }
    });

  } catch (error) {
    console.error(
      "Errore durante il salvataggio dell'occorrenza:",
      error
    );
  }
}




export async function markOccurrences(taskId, calendarDays, date) {
  if (!auth.currentUser || !taskId) return;

  try {
    const uid = auth.currentUser.uid;

    const year = date.getFullYear();
    const month = date.getMonth();

    const startDate =
      `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const endDate =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(
        new Date(year, month + 1, 0).getDate()
      ).padStart(2, "0")}`;

    const occRef = collection(
      db,
      "users",
      uid,
      "tasks",
      taskId,
      "occurrences"
    );

    const q = query(
      occRef,
      where("__name__", ">=", startDate),
      where("__name__", "<=", endDate)
    );

    const snapshot = await getDocs(q);

    const completedDates = new Set(
      snapshot.docs.map(docSnap => docSnap.id)
    );


    calendarDays.querySelectorAll(".day").forEach(day => {
      day.classList.remove("completed");
      day.style.background = "";
      day.style.color = "";
    });
    

    calendarDays.querySelectorAll(".day").forEach(dayDiv => {
      const day = dayDiv.textContent.padStart(2, "0");
      const dateKey =
        `${year}-${String(month + 1).padStart(2, "0")}-${day}`;

      dayDiv.classList.toggle(
        "completed",
        completedDates.has(dateKey)
      );
    });

  } catch (err) {
    console.error("Error marking occurrences:", err);
  }
}



export async function markAllTasks(calendarDays, date, tasks) {
  if (!auth.currentUser) return;

  const uid = auth.currentUser.uid;

  const year = date.getFullYear();
  const month = date.getMonth();

  const startDate =
    `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const endDate =
    `${year}-${String(month + 1).padStart(2, "0")}-${String(
      new Date(year, month + 1, 0).getDate()
    ).padStart(2, "0")}`;

  const dayColors = {};

  const snapshots = await Promise.all(
    tasks.map(async task => {

      const occRef = collection(
        db,
        "users",
        uid,
        "tasks",
        task.id,
        "occurrences"
      );

      const q = query(
        occRef,
        where("__name__", ">=", startDate),
        where("__name__", "<=", endDate)
      );

      const snapshot = await getDocs(q);

      return {
        task,
        snapshot
      };
    })
  );

  snapshots.forEach(({ task, snapshot }) => {

    snapshot.docs.forEach(docSnap => {

      const key = docSnap.id;

      if (!dayColors[key]) {
        dayColors[key] = [];
      }

      dayColors[key].push(
        `hsl(${task.color},70%,55%)`
      );
    });

  });

  calendarDays.querySelectorAll(".day").forEach(dayDiv => {

    const d = dayDiv.textContent.padStart(2, "0");
    const key =
      `${year}-${String(month + 1).padStart(2, "0")}-${d}`;

    const colors = dayColors[key] || [];

    if (colors.length === 0) {
      dayDiv.style.background = "";
      dayDiv.classList.remove("completed");
      dayDiv.style.color = "";
      return;
    }

    if (colors.length === 1) {
      dayDiv.style.background = colors[0];
      dayDiv.classList.add("completed");
      dayDiv.style.color = "";
      return;
    }

    dayDiv.style.background =
      `linear-gradient(180deg, ${colors.join(",")})`;

    dayDiv.classList.add("completed");
  });
}



// -------- TASK UI --------
export function listenNotifications(notificationsPanel, overlay, calendarWrapper, buttonFooter, confirmNotificationBtn, dayFlags, reminderTimeInput, currentNotificationTask) {
    confirmNotificationBtn.addEventListener("click", async () => {
      calendarWrapper.classList.remove("hidden-day-buttons");
      buttonFooter.classList.remove("hidden-day-buttons");
      notificationsPanel.classList.remove("active");
      overlay.classList.remove("active");
  
      if (!currentNotificationTask.value) return;
  
      const timeValue = reminderTimeInput.value; //  "14:30"
      if (!timeValue) return;
  

      const selectedDays = dayFlags
        .filter(d => d.el.classList.contains("clicked"))
        .map(d => d.name);
  
      try {
        const uid = auth.currentUser.uid;

        await setDoc(
          doc(db, "users", uid, "tasks", currentNotificationTask.value),
          {
            reminderTime: timeValue,
            reminderDays: selectedDays
          },
          { merge: true }
        );
        console.log("Reminder salvato:", timeValue, selectedDays);
      } catch(err) {
        console.error("Errore salvataggio reminder:", err);
      }
    });
  

    dayFlags.forEach(d => {
      d.el.addEventListener("click", () => d.el.classList.toggle("clicked"));
    });
  
}



export function listenSaveTask(saveTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks, taskList, currentTask, calendarTitle, calendarDays, date, monthYear, progressBar, progressText, panel, notificationsPanel, overlay, dayFlags, reminderTimeInput, currentNotificationTask) {
  saveTaskBtn.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();
    const hue = taskHueInput.value;

    if (!name) {
      alert("Insert a name to create the task!");
      taskNameInput.focus();
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
      currentNotificationTask.value = taskId;
      
      tasks.push({
        id: taskId,
        name: name,
        color: hue
      });
      console.log("current saved task:", taskId);
      document.body.classList.add("color-mode");
      document.documentElement.style.setProperty("--main-hue", hue);
      document.documentElement.style.setProperty("--notification-color", `hsl(${hue}, 70%, 55%)`);

      
      
      calendarTitle.textContent = name; 
      calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed") ); 
      await markOccurrences(taskId, calendarDays, date); 
      updateProgress(calendarDays, progressBar, progressText);

      const timeHM = new Date();
      const hours = timeHM.getHours().toString().padStart(2, "0");
      const minutes = timeHM.getMinutes().toString().padStart(2, "0");
      
      reminderTimeInput.value = `${hours}:${minutes}`;
      dayFlags.forEach(d => d.el.classList.remove("clicked"));
      notificationsPanel.classList.add("active");
      overlay.classList.add("active");

      
    } catch(err) { 
      console.error(err); 
      return; 
    }

    
    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 80%, 55%)`;
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");

    
    panel.classList.remove("active");
    
    
  });
}


export function listenEditTask(editTaskBtn, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, taskList, calendarTitle, calendarDays, date, tasks) {
  editTaskBtn.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();
    const hue = taskHueInput.value;

    if (!name) {
      alert("Insert a name to save the task!");
      taskNameInput.focus();
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

    exitEditMode(taskList);
    taskForm.classList.add("hidden-task-buttons");
    taskManager.classList.remove("hidden-task-buttons");
    taskNameInput.value = "";
    taskHueInput.value = 162;
    huePreview.style.backgroundColor = `hsl(162, 80%, 55%)`;

    if (calendarTitle.textContent !== "CHECK CALENDAR") {
      calendarTitle.textContent = name;
      document.documentElement.style.setProperty("--main-hue", hue);
    } else {
      await markAllTasks(calendarDays, date, tasks);
    }
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


export function createTaskList(taskList, tasks, currentTask, calendarDays, calendarTitle, date, progressWrapper, progressBar, progressText, calendarWrapper, buttonFooter, panel, overlay, taskForm, taskManager, hueContainer, huePreview, editTaskBtn, saveTaskBtn, taskHueInput, taskNameInput, notificationsPanel, dayFlags, reminderTimeInput, currentNotificationTask) {
  taskList.innerHTML = "";

  if (tasks.length > 0) {
    const allTasksBtn = document.createElement("neutral-button");
    allTasksBtn.style.textAlign = "center";
    allTasksBtn.style.margin = "0";
    allTasksBtn.textContent = "SEE ALL TASKS";
    taskList.appendChild(allTasksBtn);
  
    allTasksBtn.addEventListener("click", async (e) => {
      currentTask.value = "";
      calendarTitle.textContent = "CHECK CALENDAR";
      document.body.classList.remove("color-mode");
      calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
      await markAllTasks(calendarDays, date, tasks);
      calendarWrapper.classList.remove("hidden-day-buttons");
      progressWrapper.classList.add("hidden-day-buttons");
      buttonFooter.classList.remove("hidden-day-buttons");
      panel.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
  
  tasks.forEach(task => {
    const { id: taskId, name, color: hue } = task;


    ////
    const newTask = document.createElement("div");
    newTask.dataset.id = taskId;
    newTask.classList.add("task-item");
    newTask.style.backgroundColor = `hsl(${hue}, 80%, 55%)`;

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
    menu.dataset.task = taskId;

    const notificationItem = document.createElement("div");
    notificationItem.classList.add("menu-item", "notifications");
    notificationItem.textContent = "Notifications";

    const editItem = document.createElement("div");
    editItem.classList.add("menu-item", "edit");
    editItem.textContent = "Edit";

    const deleteItem = document.createElement("div");
    deleteItem.classList.add("menu-item", "delete");
    deleteItem.textContent = "Delete";

    menu.appendChild(notificationItem);
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

      document.querySelectorAll(".task-menu").forEach(m => {
        if (m !== menu) m.classList.remove("show");
      });



      requestAnimationFrame(() => {
        const moreRect = moreBtn.getBoundingClientRect();
        const footerRect = document.querySelector(".panel-footer").getBoundingClientRect();
        const spaceBelow = footerRect.top - (moreRect.bottom + 30);

        menu.classList.remove("above");
        if (spaceBelow < menu.scrollHeight + 5) {
          menu.classList.add("above");
        }
        menu.classList.toggle("show");
      });

    });


    // to add a reminder for the task
    notificationItem.addEventListener("click", async (e) => {
      e.stopPropagation();
      document.documentElement.style.setProperty("--notification-color", `hsl(${hue}, 70%, 55%)`);
      currentNotificationTask.value = taskId;
      
      if (!auth.currentUser || !currentNotificationTask.value) return;
      try {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid, "tasks", currentNotificationTask.value);
        const docSnap = await getDoc(docRef);
      
        let time = null;
        let days = [];
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          time = data.reminderTime;
          days = data.reminderDays || [];
        }
        
        if (time) reminderTimeInput.value = time;
        else {
          const timeHM = new Date();
          const hours = timeHM.getHours().toString().padStart(2, "0");
          const minutes = timeHM.getMinutes().toString().padStart(2, "0");
          reminderTimeInput.value = `${hours}:${minutes}`;
        }
        
        dayFlags.forEach(d => d.el.classList.remove("clicked"));
        dayFlags.forEach(d => {
          if (days && days.includes(d.name)) {
            d.el.classList.add("clicked");
          }
        });
    
      } catch (err) {
        console.error("Error loading reminder:", err);
      }


      menu.classList.remove("show");
      panel.classList.remove("active");
      notificationsPanel.classList.add("active");
      overlay.classList.add("active");
    });


    
    // to delete the task
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
        document.body.classList.remove("color-mode");
        calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed"));
        progressWrapper.classList.add("hidden-day-buttons");
        await markAllTasks(calendarDays, date, tasks);
      }

    });

    // to edit the task
    editItem.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.remove("show");
      taskForm.classList.remove("hidden-task-buttons");
      taskManager.classList.add("hidden-task-buttons");
      hueContainer.classList.remove("hidden-task-buttons");

      saveTaskBtn.classList.add("hidden-task-buttons");
      editTaskBtn.classList.remove("hidden-task-buttons");

      taskHueInput.value = hue;
      document.documentElement.style.setProperty("--preview-hue", hue);
      huePreview.style.backgroundColor = `hsl(${taskHueInput.value}, 80%, 55%)`;


      requestAnimationFrame(() => {
        taskNameInput.value = newTask.querySelector(".task-name").textContent;
        taskNameInput.focus();
      });

      exitEditMode(taskList);
      enterEditMode(taskList, newTask);
    });

    // to select the task
    newTask.addEventListener("click", async () => {
      currentTask.value = taskId;
      document.body.classList.add("color-mode");
      document.documentElement.style.setProperty("--main-hue", hue); 
      calendarTitle.textContent = name; 
      calendarDays.querySelectorAll(".day").forEach(day => day.classList.remove("completed") ); 
      await markOccurrences(taskId, calendarDays, date); 
      updateProgress(calendarDays, progressBar, progressText);
      calendarWrapper.classList.remove("hidden-day-buttons");
      progressWrapper.classList.remove("hidden-day-buttons");
      buttonFooter.classList.remove("hidden-day-buttons");
      panel.classList.remove("active");
      overlay.classList.remove("active");

      requestAnimationFrame(() => {
        document.body.style.backgroundColor = "var(--bg-main)";
      })
    });
  });


  document.addEventListener("click", (e) => {
    document.querySelectorAll(".task-menu").forEach(m => {
      if (!m.contains(e.target)) {
        m.classList.remove("show");
      }
    });
  });
}


// -------- CALENDAR CLICK --------
export function listenClickCalendar(addBtn, cancelBtn, taskBtn, dayActions, calendarDays, progressBar, progressText, currentTask, date, message, tasks) {
  let selectedDay = null;

  calendarDays.addEventListener("click", async e => {
    if (!e.target.classList.contains("day")) return;
    selectedDay = e.target;
    calendarDays.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
    selectedDay.classList.add("selected");
    if (currentTask.value) {
      dayActions.classList.remove("hidden-day-buttons");
      if (!e.target.classList.contains("completed")) cancelBtn.classList.add("hidden-day-buttons");
      else cancelBtn.classList.remove("hidden-day-buttons");
 
    } else {
      if (!e.target.classList.contains("completed")) { 
        message.textContent = "";
        taskBtn.classList.add("warning");
        setTimeout(() => {
          taskBtn.classList.remove("warning");
          setTimeout(() => {
            taskBtn.classList.add("warning");
            setTimeout(() => {
              taskBtn.classList.remove("warning");
            }, 150);
          }, 150);
        }, 150);
      } else { 
        const day = e.target.textContent.padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const key = `${year}-${month}-${day}`;

        if (!auth.currentUser) return;
        const uid = auth.currentUser.uid;
      
        let completedTasks = [];
      
        for (const task of tasks) {
          const occRef = doc(db, "users", uid, "tasks", task.id, "occurrences", key);
          const occSnap = await getDoc(occRef); 
      
          if (occSnap.exists()) {
            completedTasks.push({
              name: task.name,
              color: task.color
            });
          }
        }
        message.innerHTML = completedTasks
          .map(t => `
            <div style="color: hsl(${t.color},70%,45%)">
              ✓ ${t.name}
            </div>
          `)
          .join("");
      }
    }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".days") && !e.target.closest("#day-actions")) {
      calendarDays.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
      selectedDay = null;
      dayActions.classList.add("hidden-day-buttons");
      message.textContent = "";
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
  progressText.textContent = done + " /" + total;
}

// -------- PANEL LISTENERS --------
export function listenTaskButtons(taskBtn, statsBtn, closePanel, closeStatsPanel, panel, statsPanel, notificationsPanel, overlay, calendarWrapper, buttonFooter, taskManager, taskForm, taskList, taskNameInput, taskHueInput, huePreview, currentTask, tasks, chartContainer) {
  taskBtn.addEventListener("click", () => {
        calendarWrapper.classList.add("hidden-day-buttons");
        buttonFooter.classList.add("hidden-day-buttons");
        panel.classList.add("active");
        overlay.classList.add("active");

        taskManager.classList.remove("hidden-task-buttons");
        taskForm.classList.add("hidden-task-buttons");
    });

    statsBtn.addEventListener("click", () => {
        calendarWrapper.classList.add("hidden-day-buttons");
        buttonFooter.classList.add("hidden-day-buttons");
        statsPanel.classList.add("active");
        overlay.classList.add("active");
      
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (currentTask.value == "") {
              updateAllTasksMultiBarChart(chartContainer, tasks);
            } else {
              updateTaskBarChart(chartContainer, currentTask.value);
            }
          }, 50); 
        });
    });


    closePanel.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        overlay.classList.remove("active");

        requestAnimationFrame(() => {
          document.body.style.backgroundColor = "var(--bg-main)";
        });

        exitEditMode(taskList);
        taskNameInput.value = "";
        taskHueInput.value = 162;
        huePreview.style.backgroundColor = `hsl(162, 80%, 55%)`;

    });


    closeStatsPanel.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        statsPanel.classList.remove("active");
        overlay.classList.remove("active");

        requestAnimationFrame(() => {
          document.body.style.backgroundColor = "var(--bg-main)";
        });
    });





    overlay.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        statsPanel.classList.remove("active");
        notificationsPanel.classList.remove("active");
        overlay.classList.remove("active");

        requestAnimationFrame(() => {
          document.body.style.backgroundColor = "var(--bg-main)";
        });

        exitEditMode(taskList);
        taskNameInput.value = "";
        taskHueInput.value = 162;
        huePreview.style.backgroundColor = `hsl(162, 80%, 55%)`;

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
    huePreview.style.backgroundColor = `hsl(162, 80%, 55%)`;
  });
}


export function listenHue(huePreview, hueContainer, taskHueInput, taskList) {
    huePreview.addEventListener("click", () => {
      hueContainer.classList.toggle("hidden-task-buttons");
    });

    taskHueInput.addEventListener("input", () => {
      huePreview.style.backgroundColor = `hsl(${taskHueInput.value}, 80%, 55%)`;
      document.documentElement.style.setProperty("--preview-hue", taskHueInput.value);
    });
}




export function listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn, progressBar, progressText, currentTask, tasks) {
    // left arrow
    prevMonthBtn.addEventListener("click", async () => {
        date.setMonth(date.getMonth() - 1);
        await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText, tasks);
        updateProgress(calendarDays, progressBar, progressText);
    });

    // right arrow
    nextMonthBtn.addEventListener("click", async () => {
        date.setMonth(date.getMonth() + 1);
        await createCalendar(date, monthYear, calendarDays, currentTask, progressBar, progressText, tasks);
        updateProgress(calendarDays, progressBar, progressText);
    });
}




