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

 
  const sortedMonths = Object.keys(monthCounts).sort((a,b) => new Date(a + "-01") - new Date(b + "-01"));

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return sortedMonths.map(key => {
    const [year, month] = key.split("-");
    return {
      label: `${monthNames[parseInt(month)-1]} ${year}`,
      count: monthCounts[key]
    };
  });
}



export function drawCurrentTaskBarChart(container, data) {
  container.innerHTML = "";

  if (!data.length) return; 

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const containerHeight = container.clientHeight;

  data.forEach(d => {
    const barWrapper = document.createElement("div");
    barWrapper.style.display = "flex";
    barWrapper.style.flexDirection = "column";
    barWrapper.style.alignItems = "center";
    barWrapper.style.flex = "1";
    barWrapper.style.margin = "0 5px";

    const bar = document.createElement("div");
    bar.style.height = `${(d.count / maxCount) * containerHeight}px`;
    bar.style.width = "30px";
    bar.style.backgroundColor = "var(--main-color)";
    bar.title = `${d.label}: ${d.count}`;

    const label = document.createElement("span");
    label.style.fontSize = "12px";
    label.style.marginTop = "4px";
    label.textContent = d.label;

    barWrapper.appendChild(bar);
    barWrapper.appendChild(label);
    container.appendChild(barWrapper);
  });
}

export async function updateTaskBarChart(container, taskId) {
  const data = await getTaskMonthlyOccurrences(taskId);
  drawCurrentTaskBarChart(container, data);
}
