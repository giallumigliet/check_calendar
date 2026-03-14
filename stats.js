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

  const maxCount = 31;
  const gridStep = 5;
  const containerHeight = container.clientHeight || 300;
  const chartHeight = containerHeight - 50;

  // container principale
  container.style.position = "relative";
  container.style.height = "100%";
  container.style.width = "100%";
  container.style.overflow = "hidden";

  // ---------- GRID ----------
  const grid = document.createElement("div");
  grid.style.position = "absolute";
  grid.style.left = "0";
  grid.style.right = "0";
  grid.style.top = "0";
  grid.style.bottom = "30px";
  grid.style.pointerEvents = "none";

  for (let i = 0; i <= maxCount; i += gridStep) {
    const line = document.createElement("div");

    const y = (i / maxCount) * chartHeight;

    line.style.position = "absolute";
    line.style.bottom = `${y}px`;
    line.style.left = "0";
    line.style.right = "0";
    line.style.height = "1px";
    line.style.background = "rgba(0,0,0,0.15)";

    grid.appendChild(line);
  }

  container.appendChild(grid);

  // ---------- BARS CONTAINER ----------
  const barsContainer = document.createElement("div");
  barsContainer.style.position = "relative";
  barsContainer.style.display = "flex";
  barsContainer.style.flexDirection = "row";
  barsContainer.style.alignItems = "flex-end";
  barsContainer.style.overflowX = "auto";
  barsContainer.style.gap = "10px";
  barsContainer.style.padding = "10px";
  barsContainer.style.height = "100%";

  container.appendChild(barsContainer);

  // ---------- BARS ----------
  data.forEach(d => {

    const barWrapper = document.createElement("div");
    barWrapper.style.display = "flex";
    barWrapper.style.flexDirection = "column";
    barWrapper.style.alignItems = "center";
    barWrapper.style.flex = "0 0 auto";
    barWrapper.style.width = "40px";

    const bar = document.createElement("div");
    const height = (d.count / maxCount) * chartHeight;

    bar.style.height = `${height}px`;
    bar.style.width = "100%";
    bar.style.backgroundColor = "var(--main-color)";
    bar.style.display = "flex";
    bar.style.alignItems = "flex-end";
    bar.style.justifyContent = "center";
    bar.style.color = "white";
    bar.style.fontWeight = "bold";
    bar.style.fontSize = "10px";
    bar.style.borderRadius = "4px 4px 0 0";

    bar.title = `${d.label}: ${d.count}`;
    bar.textContent = d.count;

    const label = document.createElement("span");
    label.style.fontSize = "12px";
    label.style.marginTop = "4px";
    label.style.textAlign = "center";
    label.textContent = d.label;

    barWrapper.appendChild(bar);
    barWrapper.appendChild(label);

    barsContainer.appendChild(barWrapper);

  });
}
export async function updateTaskBarChart(container, taskId) {
  const data = await getTaskMonthlyOccurrences(taskId);
  drawCurrentTaskBarChart(container, data);
}
