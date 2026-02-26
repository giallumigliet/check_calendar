import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./script.js"; 

const db = getFirestore(app);


// TASKS ======================

export async function createTask(uid, name, hue) {
  return await addDoc(
    collection(db, "users", uid, "tasks"),
    {
      name,
      hue,
      createdAt: serverTimestamp(),
      completions: {}
    }
  );
}

export async function getTasks(uid) {
  const snapshot = await getDocs(
    collection(db, "users", uid, "tasks")
  );

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function deleteTask(uid, taskId) {
  await deleteDoc(doc(db, "users", uid, "tasks", taskId));
}


// COMPLETIONS ======================

export async function incrementCompletion(uid, taskId, dateString) {
  const ref = doc(db, "users", uid, "tasks", taskId);

  await updateDoc(ref, {
    [`completions.${dateString}`]: increment(1)
  });
}

export async function removeCompletion(uid, taskId, dateString) {
  const ref = doc(db, "users", uid, "tasks", taskId);

  await updateDoc(ref, {
    [`completions.${dateString}`]: 0
  });
}
