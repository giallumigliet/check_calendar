import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

export async function getTaskMonthlyOccurrences(taskId) {
  if (!auth.currentUser || !taskId) return [];

  const uid = auth.currentUser.uid;
  const occRef = collection(db, "users", uid, "tasks", taskId, "occurrences");
  const occSnapshot = await getDocs(occRef);

  const monthCounts = {};

  occSnapshot.docs.forEach(doc => {
    const [year, month] = doc.id.split("-");
    const key = `${year}-${month}`;
    monthCounts[key] = (monthCounts[key] || 0) + doc.data().quantity;
  });

  // Se non ci sono dati, ritorna array vuoto
  if (!Object.keys(monthCounts).length) return [];

  // Trova il mese minimo e massimo
  const allDates = Object.keys(monthCounts).map(k => new Date(k + "-01"));
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  // Genera tutti i mesi nel range
  const sortedMonths = [];
  let iterDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (iterDate <= maxDate) {
    const key = `${iterDate.getFullYear()}-${String(iterDate.getMonth() + 1).padStart(2, "0")}`;
    sortedMonths.push(key);
    iterDate.setMonth(iterDate.getMonth() + 1);
  }

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return sortedMonths.map(key => {
    const [year, month] = key.split("-");
    return {
      label: `${monthNames[parseInt(month)-1]} ${year}`,
      count: monthCounts[key] || 0 // zero se non c'è
    };
  });
}


export function drawCurrentTaskBarChart(container, data) { 
  container.innerHTML = ""; 
  if (!data.length) return; 
  const containerHeight = container.clientHeight; 
  const maxDays = 31;
  const chartHeight = containerHeight - 50;

  data.forEach(d => { 
    const barWrapper = document.createElement("div"); 
    barWrapper.style.display = "flex"; 
    barWrapper.style.flexDirection = "column"; 
    barWrapper.style.alignItems = "center"; 
    barWrapper.style.flex = "0 0 auto"; 
    barWrapper.style.width = "40px"; 

    const barContainer = document.createElement("div");
    barContainer.style.position = "relative";
    barContainer.style.width = "100%";
    barContainer.style.height = `${chartHeight}px`;

    const daysInMonth = new Date(d.year, d.month, 0).getDate();

    const bgHeight = (daysInMonth / maxDays) * chartHeight;
    const barHeight = (d.count / daysInMonth) * bgHeight;

    const barBg = document.createElement("div");
    barBg.style.position = "absolute";
    barBg.style.bottom = "0";
    barBg.style.width = "100%";
    barBg.style.height = `${bgHeight}px`;
    barBg.style.backgroundColor = "var(--main-color)";
    barBg.style.opacity = "0.2";

    const bar = document.createElement("div");
    bar.style.position = "absolute";
    bar.style.bottom = "0";
    bar.style.width = "100%";
    bar.style.height = `${barHeight}px`;
    bar.style.backgroundColor = "var(--main-color)";
    bar.title = `${d.label}: ${d.count}`;

    bar.style.display = "flex";
    bar.style.alignItems = "flex-end";
    bar.style.justifyContent = "center";
    bar.style.color = "white";
    bar.style.fontWeight = "bold";
    bar.style.fontSize = "10px";
    bar.textContent = d.count;

    const label = document.createElement("span"); 
    label.style.fontSize = "12px"; 
    label.style.marginTop = "4px"; 
    label.style.textAlign = "center"; 
    label.textContent = d.label; 

    barContainer.appendChild(barBg);
    barContainer.appendChild(bar);
    barWrapper.appendChild(barContainer);
    barWrapper.appendChild(label);
    container.appendChild(barWrapper);
  }); 
}


export async function updateTaskBarChart(container, taskId) {
  const data = await getTaskMonthlyOccurrences(taskId);
  drawCurrentTaskBarChart(container, data);
}
