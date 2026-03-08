import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// Calcola le occorrenze mensili
export async function getMonthlyOccurrences(taskId) {
  if (!auth.currentUser || !taskId) return [];

  const uid = auth.currentUser.uid;
  const occRef = collection(db, "users", uid, "tasks", taskId, "occurrences");
  const snapshot = await getDocs(occRef);

  // Mapping anno-mese => count
  const monthCounts = {};

  snapshot.docs.forEach(doc => {
    const dateStr = doc.id; // formato YYYY-MM-DD
    const [year, month] = dateStr.split("-"); // es. "2026-03"
    const key = `${year}-${month}`;
    monthCounts[key] = (monthCounts[key] || 0) + doc.data().quantity;
  });

  // Ordina le chiavi cronologicamente
  const sortedKeys = Object.keys(monthCounts).sort((a, b) => new Date(a + "-01") - new Date(b + "-01"));

  // Trasforma in array { label, count }
  const result = sortedKeys.map(key => {
    const [year, month] = key.split("-");
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return { label: `${monthNames[parseInt(month)-1]} ${year}`, count: monthCounts[key] };
  });

  return result;
}

// Disegna la bar chart in un container
export function drawBarChart(container, data) {
  container.innerHTML = ""; // reset
  const maxCount = Math.max(...data.map(d => d.count), 1);

  data.forEach(d => {
    const barWrapper = document.createElement("div");
    barWrapper.style.display = "flex";
    barWrapper.style.flexDirection = "column";
    barWrapper.style.alignItems = "center";
    barWrapper.style.flex = "1";

    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${(d.count / maxCount) * 100}%`;
    bar.title = `${d.count} occurrences`;
    bar.textContent = d.count;

    const label = document.createElement("span");
    label.style.fontSize = "12px";
    label.style.marginTop = "4px";
    label.textContent = d.label;

    barWrapper.appendChild(bar);
    barWrapper.appendChild(label);
    container.appendChild(barWrapper);
  });
}

// Funzione principale per aggiornare la chart di un task
export async function updateTaskBarChart(taskId, chartContainer) {
  const data = await getMonthlyOccurrences(taskId);
  drawBarChart(chartContainer, data);
}
