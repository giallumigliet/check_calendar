import { db, auth } from "./firebase.js";
import { doc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



export async function renderBarChart(userId, chartId, dataCollection) {
    if (!userId) return;

    try {
        const barChart = document.getElementById(chartId);
        if (!barChart) return;

        const dataRef = collection(db, "users", userId, dataCollection);
        const snapshot = await getDocs(dataRef);

        const dataArray = snapshot.docs.map(doc => doc.data().value || 0);

        barChart.innerHTML = "";

        if (dataArray.length === 0) return;

        const maxData = Math.max(...dataArray);

        dataArray.forEach(value => {
            const bar = document.createElement("div");
            bar.classList.add("bar");
            bar.style.height = (value / maxData * 100) + "%";
            bar.textContent = value;
            barChart.appendChild(bar);
        });
    } catch (err) {
        console.error("Errore nel rendering del bar chart:", err);
    }
}
