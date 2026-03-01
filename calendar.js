import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "./script.js";


export function createCalendar(date, monthYear, calendarDays) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    monthYear.textContent = months[month] + " " + year;
    calendarDays.innerHTML = "";


    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // First day being Monday in Italy
    const startDay = (firstDay === 0) ? 7 : firstDay;


    // to display days of the months
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        dayDiv.classList.add("day");

        // to shift the first day
        if (day === 1) {
            dayDiv.style.gridColumnStart = startDay;
        }

        if (
            day === date.getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()
        ) {
            dayDiv.classList.add("today");
        }

        calendarDays.appendChild(dayDiv);
    }
}



export function listenClickCalendar(addBtn, cancelBtn, dayActions, calendarDays, progressBar, progressText) {
    let selectedDay=null;
    
    // to select the day by clicking it
    calendarDays.addEventListener("click", function(e) {
        selectedDay = e.target;
        if (selectedDay.tagName === "DIV") {
            
            // remove previous selection
            document.querySelectorAll(".days div").forEach(day => {
            day.classList.remove("selected");
            });
            
            // select clicked day
            selectedDay.classList.add("selected");

            // show day actions
            dayActions.classList.remove("hidden-day-buttons");
            
        }
    });

    

    // to unselect the day by clicking outside
    document.addEventListener("click", function(e) {
        const clickedDay = e.target.closest(".days div");
        const clickedDayActions = e.target.closest("#day-actions");

        // if no day or add/cancel button button is clicked
        if (!clickedDay && !clickedDayActions) {
            
            // remove selection
            document.querySelectorAll(".days div").forEach(day => {
            day.classList.remove("selected");
            });

            selectedDay = null;

            // hide day actions
            dayActions.classList.add("hidden-day-buttons");
        }


        
    });


    // day completed
    addBtn.addEventListener("click", function() {

        if (selectedDay) {
            selectedDay.classList.remove("selected");
            selectedDay.classList.add("completed");
            selectedDay = null;

            dayActions.classList.add("hidden-day-buttons");
            updateProgress(calendarDays, progressBar, progressText);
        }
    });

    // day annulled
    cancelBtn.addEventListener("click", function() {

        if (selectedDay) {
            selectedDay.classList.remove("selected");
            selectedDay.classList.remove("completed");
            selectedDay = null;

            dayActions.classList.add("hidden-day-buttons");
            updateProgress(calendarDays, progressBar, progressText);
        }
    });


}



export function listenMonthCalendar(date, monthYear, calendarDays, prevMonthBtn, nextMonthBtn) {
    // left arrow
    prevMonthBtn.addEventListener("click", () => {
        date.setMonth(date.getMonth() - 1);
        createCalendar(date, monthYear, calendarDays);
        updateProgress(calendarDays, progressBar, progressText);
    });

    // right arrow
    nextMonthBtn.addEventListener("click", () => {
        date.setMonth(date.getMonth() + 1);
        createCalendar(date, monthYear, calendarDays);
        updateProgress(calendarDays, progressBar, progressText);
    });
}



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




export function updateProgress(calendarDays, progressBar, progressText) {
    const completedNumber = calendarDays.querySelectorAll(".day.completed").length;
    const total = calendarDays.querySelectorAll(".day").length;
    
    
    if (total === 0) return; 
    const percent = (completedNumber / total) * 100;

    progressBar.style.width = percent + "%";
    progressText.textContent = completedNumber; 
}



export function listenPanelButtons(addTaskBtn, goBackBtn, modifyTaskBtn, taskManager, taskForm, hueContainer) {
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


    modifyTaskBtn.addEventListener("click", () => {
        const badges = document.querySelectorAll(".delete-badge");

        badges.forEach(badge => {
            badge.classList.toggle("hidden");
        });

        modifyTaskBtn.classList.toggle("modify-active");
        
        taskManager.classList.remove("hidden-task-buttons");
        taskForm.classList.add("hidden-task-buttons");
    });
    
    
    goBackBtn.addEventListener("click", () => {
      taskManager.classList.remove("hidden-task-buttons");
      taskForm.classList.add("hidden-task-buttons");
    });
}



export function listenHue(huePreview, hueContainer, taskHueInput) {
    huePreview.addEventListener("click", () => {
      hueContainer.classList.toggle("hidden-task-buttons");
    });

    taskHueInput.addEventListener("input", () => {
      const hue = taskHueInput.value;
      huePreview.style.backgroundColor = `hsl(${hue}, 90%, 55%)`;
    });
}




export function listenSaveTask(saveTaskBtn, taskList, taskNameInput, taskHueInput, huePreview, taskManager, taskForm, tasks) {
    saveTaskBtn.addEventListener("click", () => {
        const name = taskNameInput.value.trim();
        const hue = taskHueInput.value;

        if (!name || tasks.some(task => task.id === name)) return;

        // creating in DB
        setDoc(
            doc(db, "users", auth.currentUser.uid;, "tasks", name),
            { color: hue }
        );

        // reset form
        taskNameInput.value = "";
        taskHueInput.value = 162;
        huePreview.style.backgroundColor = `hsl(162, 90%, 55%)`;

        
        taskForm.classList.add("hidden-task-buttons");
        taskManager.classList.remove("hidden-task-buttons");
        
    });
}



export function createTaskList(taskList, tasks, currentTask) {
  taskList.innerHTML = ""; // opzionale: pulisce la lista prima di ricrearla

  tasks.forEach(task => {
    const { id: name, color: hue } = task; // id = taskName, color = hue

    const newTask = document.createElement("div");
    newTask.classList.add("task-item");
    newTask.dataset.hue = hue;
    newTask.style.backgroundColor = `hsl(${hue}, 90%, 45%)`;
    newTask.textContent = name;

    // crea badge delete
    const deleteBadge = document.createElement("div");
    deleteBadge.classList.add("delete-badge", "hidden");
    deleteBadge.textContent = "━";

    newTask.appendChild(deleteBadge);
    taskList.appendChild(newTask);

    deleteBadge.addEventListener("click", (e) => {
      if (confirm("Press OK to delete the task.")) {
        e.stopPropagation();
        newTask.remove();
        // deleting task from DB
        deleteDoc(
            doc(db, "users", auth.currentUser.uid;, "tasks", name)
        );
      }
    });

    newTask.addEventListener("click", () => {
      document.documentElement.style.setProperty("--main-hue", newTask.dataset.hue);
      currentTask = newTask.textContent;
    });
  });
}



