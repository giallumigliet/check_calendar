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
    const startDay = (firstDay === 0) ? 6 : firstDay - 1;


    // to display days of the months
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;

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



export function listenClickCalendar(dayActions, calendarDays) {
    // to select the day by clicking it
    calendarDays.addEventListener("click", function(e) {
        if (e.target.tagName === "DIV") {
            
            // remove previous selection
            document.querySelectorAll(".days div").forEach(day => {
            day.classList.remove("selected");
            });

            // select clicked day
            e.target.classList.add("selected");

            // show day actions
            dayActions.classList.remove("day-elements");
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

            // hide day actions
            dayActions.classList.add("day-elements");
        }
    });


}



export function listenMonthCalendar(date, monthYear, dayActions, calendarDays, prevMonthBtn, nextMonthBtn) {
    // left arrow
    prevMonthBtn.addEventListener("click", () => {
        date.setMonth(date.getMonth() - 1);
        createCalendar(date, monthYear, calendarDays);
    });

    // right arrow
    nextMonthBtn.addEventListener("click", () => {
        date.setMonth(date.getMonth() + 1);
        createCalendar(date, monthYear, calendarDays);
    });
}
