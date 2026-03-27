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


export async function getAllTasksMonthlyOccurrences(tasks) {
  if (!auth.currentUser) return [];

  const uid = auth.currentUser.uid;
  const monthCountsPerTask = {};

  // Crea oggetto vuoto per ogni task
  tasks.forEach(t => monthCountsPerTask[t.id] = { name: t.name, color: t.color, counts: {} });

  for (const task of tasks) {
    const occRef = collection(db, "users", uid, "tasks", task.id, "occurrences");
    const snapshot = await getDocs(occRef);

    snapshot.docs.forEach(docSnap => {
      const [year, month] = docSnap.id.split("-");
      const key = `${year}-${month}`;
      monthCountsPerTask[task.id].counts[key] = (monthCountsPerTask[task.id].counts[key] || 0) + docSnap.data().quantity;
    });
  }

  // Trova il range globale di mesi tra tutte le task
  const allKeys = [];
  Object.values(monthCountsPerTask).forEach(task => allKeys.push(...Object.keys(task.counts)));
  const allDates = allKeys.map(k => new Date(k + "-01"));
  if (!allDates.length) return [];

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  // Genera tutti i mesi nel range
  const sortedMonths = [];
  let iterDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (iterDate <= maxDate) {
    const key = `${iterDate.getFullYear()}-${String(iterDate.getMonth()+1).padStart(2,"0")}`;
    sortedMonths.push(key);
    iterDate.setMonth(iterDate.getMonth()+1);
  }

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Costruisci array finale
  const result = sortedMonths.map(key => {
    const [year, month] = key.split("-");
    const monthLabel = `${monthNames[parseInt(month)-1]} ${year}`;
    const values = {};
    Object.entries(monthCountsPerTask).forEach(([taskId, t]) => {
      values[taskId] = t.counts[key] || 0;
    });
    return { label: monthLabel, values };
  });

  return { months: sortedMonths.map(k => {
    const [year, month] = k.split("-");
    return `${monthNames[parseInt(month)-1]} ${year}`;
  }), data: result, tasks: monthCountsPerTask };
}


export function drawCurrentTaskBarChart(container, data) { 
  container.innerHTML = ""; 
  if (!data.length) return; 

  const maxCount = 31; 
  const containerHeight = 400;
  
  container.style.display = "flex"; 
  container.style.flexDirection = "row"; 
  container.style.alignItems = "flex-end"; 
  container.style.overflowX = "auto"; 
  container.style.gap = "10px"; 
  container.style.padding = "10px"; 
  
  data.forEach(d => { 
    const barWrapper = document.createElement("div"); 
    barWrapper.style.display = "flex"; 
    barWrapper.style.flexDirection = "column"; 
    barWrapper.style.alignItems = "center"; 
    barWrapper.style.flex = "0 0 auto"; 
    // larghezza fissa, non scalare 
    barWrapper.style.width = "40px"; 
    // larghezza barra + spazio 
    barWrapper.style.margin = "0"; 
    const barContainer = document.createElement("div");
    barContainer.style.position = "relative";
    barContainer.style.width = "100%";
    barContainer.style.height = `${containerHeight}px`;


    const [monthLabel, yearLabel] = d.label.split(" ");
    const monthIndex = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(monthLabel);
    const year = parseInt(yearLabel);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    
    // 🔹 Barra "totale mese" (sfondo)
    const barBg = document.createElement("div");
    barBg.style.position = "absolute";
    barBg.style.bottom = "0";
    barBg.style.width = "100%";
    barBg.style.height = `${(daysInMonth / maxCount) * (containerHeight - 50)}px`;
    barBg.style.backgroundColor = "var(--main-color)";
    barBg.style.opacity = "0.2";
    
    // 🔹 Barra "completamenti"
    const bar = document.createElement("div");
    bar.style.position = "absolute";
    bar.style.bottom = "0";
    bar.style.width = "100%";
    bar.style.height = `${(d.count / maxCount) * (containerHeight - 50)}px`;
    bar.style.backgroundColor = "var(--main-color)";
    bar.style.opacity = "1";
    
    bar.style.display = "flex";
    bar.style.alignItems = "flex-end";
    bar.style.justifyContent = "center";
    bar.style.color = "white";
    bar.style.fontWeight = "bold";
    bar.style.fontSize = "10px";
    bar.textContent = d.count;

    barContainer.appendChild(barBg);
    barContainer.appendChild(bar);
    
    const label = document.createElement("span"); 
    label.style.fontSize = "12px"; 
    label.style.marginTop = "4px"; 
    label.style.textAlign = "center"; 
    label.textContent = d.label; 
    barWrapper.appendChild(barContainer); 
    barWrapper.appendChild(label); 
    container.appendChild(barWrapper); 
  }); 

  requestAnimationFrame(() => {
    container.scrollLeft = container.scrollWidth;
  });
}


export function drawAllTasksMultiBarChart(container, months, data, tasks) {
  container.innerHTML = "";
  if (!data.length) return;

  const maxCount = 31;
  const containerHeight = 400;

  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.alignItems = "flex-end";
  container.style.overflowX = "auto";
  container.style.gap = "20px";
  container.style.padding = "10px";

  data.forEach(d => {

    // 🔹 Wrapper del mese
    const monthWrapper = document.createElement("div");
    monthWrapper.style.display = "flex";
    monthWrapper.style.flexDirection = "column";
    monthWrapper.style.alignItems = "center";
    monthWrapper.style.flex = "0 0 auto";

    // 🔹 Contenitore barre del mese (AFFIANCATE)
    const barsRow = document.createElement("div");
    barsRow.style.display = "flex";
    barsRow.style.flexDirection = "row";
    barsRow.style.alignItems = "flex-end";
    barsRow.style.height = `${containerHeight}px`;
    barsRow.style.gap = "4px";

    Object.entries(tasks).forEach(([taskId, t]) => {
      const value = d.values[taskId] || 0;

      const barWrapper = document.createElement("div");
      barWrapper.style.display = "flex";
      barWrapper.style.flexDirection = "column";
      barWrapper.style.alignItems = "center";
      barWrapper.style.width = "20px";

      const barContainer = document.createElement("div");
      barContainer.style.position = "relative";
      barContainer.style.width = "100%";
      barContainer.style.height = "100%";

      // 🔹 Barra
      const bar = document.createElement("div");
      bar.style.position = "absolute";
      bar.style.bottom = "0";
      bar.style.width = "100%";
      bar.style.height = `${(value / maxCount) * (containerHeight - 50)}px`;
      bar.style.backgroundColor = `hsl(${t.color}, 70%, 55%)`;

      bar.style.display = "flex";
      bar.style.alignItems = "flex-end";
      bar.style.justifyContent = "center";
      bar.style.color = "white";
      bar.style.fontSize = "9px";
      bar.textContent = value > 0 ? value : "";

      barContainer.appendChild(bar);
      barWrapper.appendChild(barContainer);
      barsRow.appendChild(barWrapper);
    });

    // 🔹 Label mese
    const label = document.createElement("span");
    label.style.fontSize = "12px";
    label.style.marginTop = "6px";
    label.style.textAlign = "center";
    label.textContent = d.label;

    monthWrapper.appendChild(barsRow);
    monthWrapper.appendChild(label);

    container.appendChild(monthWrapper);
  });

  requestAnimationFrame(() => {
    container.scrollLeft = container.scrollWidth;
  });
}



export function drawAllTasksLineChart(container, months, data, tasks) {
  container.innerHTML = "";
  if (!data.length) return;

  const height = 400;
  const padding = 40;
  const monthWidth = 80;

  const width = months.length * monthWidth;

  container.style.position = "relative";
  container.style.overflowX = "auto";
  container.style.overflowY = "hidden";

  const inner = document.createElement("div");
  inner.style.position = "relative";
  inner.style.width = width + "px";
  inner.style.height = height + "px";

  container.appendChild(inner);

  const chartHeight = height - padding * 2;

  let maxY = 0;
  data.forEach(d => {
    Object.values(d.values).forEach(v => maxY = Math.max(maxY, v));
  });

  const yScale = y => chartHeight - (y / maxY * chartHeight) + padding;

  const stepY = Math.ceil(maxY / 5);

  for (let yVal = 0; yVal <= maxY; yVal += stepY) {
    const y = yScale(yVal);

    const line = document.createElement("div");
    line.style.position = "absolute";
    line.style.left = "0";
    line.style.width = "100%";
    line.style.height = "1px";
    line.style.top = y + "px";
    line.style.background = "var(--border-color)";
    line.style.opacity = "0.3";

    inner.appendChild(line);

    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.left = "0";
    label.style.top = (y - 8) + "px";
    label.style.fontSize = "12px";
    label.style.color = "var(--text-color)";
    label.textContent = yVal;

    container.appendChild(label);
  }

  Object.entries(tasks).forEach(([taskId, t]) => {

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = i * monthWidth;
      const y1 = yScale(data[i].values[taskId] || 0);

      const x2 = (i + 1) * monthWidth;
      const y2 = yScale(data[i + 1].values[taskId] || 0);

      const dx = x2 - x1;
      const dy = y2 - y1;

      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      const line = document.createElement("div");
      line.style.position = "absolute";
      line.style.left = x1 + "px";
      line.style.top = y1 + "px";
      line.style.width = length + "px";
      line.style.height = "3px";
      line.style.background = `hsl(${t.color}, 70%, 55%)`;
      line.style.transformOrigin = "0 0";
      line.style.transform = `rotate(${angle}deg)`;

      inner.appendChild(line);
    }

    data.forEach((d, i) => {
      const x = i * monthWidth;
      const y = yScale(d.values[taskId] || 0);

      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.left = (x - 4) + "px";
      dot.style.top = (y - 4) + "px";
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";
      dot.style.background = `hsl(${t.color}, 70%, 55%)`;

      inner.appendChild(dot);
    });
  });

  months.forEach((m, i) => {
    const x = i * monthWidth;

    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.left = (x - 20) + "px";
    label.style.top = (height - padding + 10) + "px";
    label.style.fontSize = "12px";
    label.style.color = "var(--text-color)";
    label.style.width = "60px";
    label.style.textAlign = "center";
    label.textContent = m;

    inner.appendChild(label);
  });

  requestAnimationFrame(() => {
    container.scrollLeft = container.scrollWidth;
  });
}

export async function updateTaskBarChart(container, taskId) {
  const data = await getTaskMonthlyOccurrences(taskId);
  drawCurrentTaskBarChart(container, data);
}


export async function updateAllTasksMultiBarChart(container, tasks) {
  const { months, data, tasks: taskInfo } = await getAllTasksMonthlyOccurrences(tasks);
  drawAllTasksMultiBarChart(container, months, data, taskInfo);
}


export async function updateAllTasksLineChart(container, tasks) {
  const { months, data, tasks: taskInfo } = await getAllTasksMonthlyOccurrences(tasks);
  drawAllTasksLineChart(container, months, data, taskInfo);
}
