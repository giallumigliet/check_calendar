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

        // Se NON clicchi né su un giorno né sui bottoni extra
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
        
        document.body.style.transform = "scale(1)";
        setTimeout(() => {
            document.body.style.transform = "";
        }, 0);

        requestAnimationFrame(() => {
          document.documentElement.style.backgroundColor = "#ffffff";
        });
    });

    overlay.addEventListener("click", () => {
        calendarWrapper.classList.remove("hidden-day-buttons");
        buttonFooter.classList.remove("hidden-day-buttons");
        panel.classList.remove("active");
        overlay.classList.remove("active");

        document.body.style.transform = "scale(1)";
        setTimeout(() => {
            document.body.style.transform = "";
        }, 0);

        requestAnimationFrame(() => {
          document.documentElement.style.backgroundColor = "#ffffff";
        });
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

