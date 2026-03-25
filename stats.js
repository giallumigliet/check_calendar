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



export function drawAllTasksLineChart(container, months, data, tasks) {
  container.innerHTML = "";
  if (!data.length) return;

  const svgNS = "http://www.w3.org/2000/svg";

  const monthWidth = 80;
  const height = 400;
  const padding = 40;
  const axisWidth = 50;

  const width = months.length * monthWidth;

  const yAxis = document.createElementNS(svgNS, "svg");
  yAxis.classList.add("y-axis-fixed");
  yAxis.setAttribute("width", axisWidth);
  yAxis.setAttribute("height", height);

  const scroll = document.createElement("div");
  scroll.classList.add("chart-scroll");

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  scroll.appendChild(svg);
  container.appendChild(yAxis);
  container.appendChild(scroll);

  requestAnimationFrame(() => {
    scroll.scrollLeft = scroll.scrollWidth;
  });

  const chartHeight = height - padding * 2;

  let maxY = 0;
  data.forEach(d => {
    Object.values(d.values).forEach(v => maxY = Math.max(maxY, v));
  });

  const yScale = y => chartHeight - (y / maxY * chartHeight) + padding;

  const stepY = Math.ceil(maxY / 5);
  for (let yVal = 0; yVal <= maxY; yVal += stepY) {
    const y = yScale(yVal);

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 0);
    line.setAttribute("x2", width);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "var(--border-color)");
    line.setAttribute("opacity", "0.3");

    svg.appendChild(line);
  }

  Object.entries(tasks).forEach(([taskId, t]) => {
    let pathStr = "";

    data.forEach((d, i) => {
      const x = i * monthWidth;
      const y = yScale(d.values[taskId] || 0);
      pathStr += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    });

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathStr);
    path.setAttribute("stroke", `hsl(${t.color}, 70%, 55%)`);
    path.setAttribute("stroke-width", 4);
    path.setAttribute("fill", "none");

    svg.appendChild(path);
  });

  months.forEach((m, i) => {
    const x = i * monthWidth;

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", height - padding + 20);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "12px");
    label.setAttribute("fill", "var(--text-color)");
    label.textContent = m;

    svg.appendChild(label);
  });

  for (let yVal = 0; yVal <= maxY; yVal += stepY) {
    const y = yScale(yVal);

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", axisWidth - 8);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "12px");
    label.setAttribute("fill", "var(--text-color)");
    label.textContent = yVal;

    yAxis.appendChild(label);
  }

  const axisLine = document.createElementNS(svgNS, "line");
  axisLine.setAttribute("x1", axisWidth - 1);
  axisLine.setAttribute("x2", axisWidth - 1);
  axisLine.setAttribute("y1", padding);
  axisLine.setAttribute("y2", height - padding);
  axisLine.setAttribute("stroke", "var(--border-color)");
  yAxis.appendChild(axisLine);
}


export async function updateTaskBarChart(container, taskId) {
  const data = await getTaskMonthlyOccurrences(taskId);
  drawCurrentTaskBarChart(container, data);
}


export async function updateAllTasksLineChart(container, tasks) {
  const { months, data, tasks: taskInfo } = await getAllTasksMonthlyOccurrences(tasks);
  drawAllTasksLineChart(container, months, data, taskInfo);
}
