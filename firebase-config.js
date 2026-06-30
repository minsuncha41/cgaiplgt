import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  limit,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQFV9eMowcbYSTeLwgFGZ7FcJDhh8w6Lc",
  authDomain: "cgplg-8d6ca.firebaseapp.com",
  projectId: "cgplg-8d6ca",
  storageBucket: "cgplg-8d6ca.firebasestorage.app",
  messagingSenderId: "442690451946",
  appId: "1:442690451946:web:cd232982478ad50c811a93",
};

const app =
  window.__smileDentalFirebaseApp ||
  (getApps().length ? getApp() : initializeApp(firebaseConfig));
window.__smileDentalFirebaseApp = app;
const db = getFirestore(app);

const normalizePhone = (phone) => (phone || "").replace(/\D/g, "");

const reservationsRef = collection(db, "reservations");
const noticesRef = collection(db, "notices");
const usersRef = collection(db, "users");

async function getRecentNotices(limitCount = 3) {
  const noticesQuery = query(
    noticesRef,
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  const snapshot = await getDocs(noticesQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getNotices() {
  const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(noticesQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getAllReservations() {
  const reservationsQuery = query(
    reservationsRef,
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(reservationsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getUserByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  const userQuery = query(
    usersRef,
    where("phoneNormalized", "==", normalizedPhone),
    limit(1),
  );
  const snapshot = await getDocs(userQuery);
  return snapshot.empty
    ? null
    : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function getUserById(id) {
  const normalizedId = (id || "").trim();
  if (!normalizedId) {
    return null;
  }

  const userQuery = query(usersRef, where("id", "==", normalizedId), limit(1));
  const snapshot = await getDocs(userQuery);
  return snapshot.empty
    ? null
    : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function getUserByCredentials(id, password) {
  const normalizedId = (id || "").trim();
  const normalizedPassword = (password || "").trim();
  if (!normalizedId || !normalizedPassword) {
    return null;
  }

  const userQuery = query(usersRef, where("id", "==", normalizedId), limit(1));
  const snapshot = await getDocs(userQuery);
  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  if (userData.password !== normalizedPassword) {
    return null;
  }

  return { id: userDoc.id, ...userData };
}

async function getAllUsers() {
  const usersQuery = query(usersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function createUser(data) {
  const phoneNormalized = normalizePhone(data.phone || "");
  const user = {
    id: (data.id || "").trim(),
    password: (data.password || "").trim(),
    phone: data.phone || "",
    phoneNormalized,
    name: data.name || "",
    role: data.role || "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const userRef = await addDoc(usersRef, user);
  return { id: userRef.id, ...user };
}

async function updateUser(id, updates) {
  const userDoc = doc(db, "users", id);
  await updateDoc(userDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function deleteUser(id) {
  const userDoc = doc(db, "users", id);
  await deleteDoc(userDoc);
}

async function getReservationsByUserId(userId) {
  const reservationQuery = query(
    reservationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(reservationQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getReservationsByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  const reservationQuery = query(
    reservationsRef,
    where("phoneNormalized", "==", normalizedPhone),
  );
  const snapshot = await getDocs(reservationQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getReservationById(id) {
  const reservationDoc = doc(db, "reservations", id);
  const snapshot = await getDoc(reservationDoc);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function seedNoticesIfEmpty() {
  const snapshot = await getDocs(noticesRef);
  if (!snapshot.empty) {
    return;
  }

  try {
    const response = await fetch("notices.json");
    if (!response.ok) {
      throw new Error(`Failed to load notices.json: ${response.status}`);
    }
    const noticeData = await response.json();
    for (const notice of noticeData) {
      await addDoc(noticesRef, {
        title: notice.title || "공지",
        content: notice.content || "",
        category: notice.category || "공지",
        image: notice.image || "",
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Seed notices error:", error);
  }
}

async function getReservationByPhoneAuth(phone, auth) {
  const normalizedPhone = normalizePhone(phone);
  const reservationQuery = query(
    reservationsRef,
    where("phoneNormalized", "==", normalizedPhone),
    where("authCode", "==", auth),
    limit(1),
  );
  const snapshot = await getDocs(reservationQuery);
  return snapshot.empty
    ? null
    : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function getReservationByPhoneAndName(phone, name) {
  const normalizedPhone = normalizePhone(phone);
  const reservationQuery = query(
    reservationsRef,
    where("phoneNormalized", "==", normalizedPhone),
    where("name", "==", name),
    limit(1),
  );
  const snapshot = await getDocs(reservationQuery);
  return snapshot.empty
    ? null
    : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function createReservation(data) {
  const phoneNormalized = normalizePhone(data.phone || "");
  const authCode = data.authCode || phoneNormalized.slice(-4);
  const reservation = {
    userId: data.userId || null,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    phoneNormalized,
    authCode,
    treatmentType: data.treatmentType || "unknown",
    date: data.date || "",
    notes: data.notes || "",
    status: data.status || "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const reservationRef = await addDoc(reservationsRef, reservation);
  return { id: reservationRef.id, ...reservation };
}

async function addNotice(data) {
  const notice = {
    title: data.title || "새 공지",
    content: data.content || "",
    category: data.category || "공지",
    image: data.image || "",
    createdAt: serverTimestamp(),
  };
  const noticeRef = await addDoc(noticesRef, notice);
  return { id: noticeRef.id, ...notice };
}

async function updateNotice(id, updates) {
  const noticeDoc = doc(db, "notices", id);
  await updateDoc(noticeDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function deleteNotice(id) {
  const noticeDoc = doc(db, "notices", id);
  await deleteDoc(noticeDoc);
}

async function updateReservationStatus(id, updates) {
  const reservationDoc = doc(db, "reservations", id);
  await updateDoc(reservationDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function deleteReservation(id) {
  const reservationDoc = doc(db, "reservations", id);
  await deleteDoc(reservationDoc);
}

export {
  db,
  getRecentNotices,
  getNotices,
  getAllReservations,
  getReservationById,
  getUserByPhone,
  getUserById,
  getUserByCredentials,
  getAllUsers,
  getReservationsByPhone,
  getReservationsByUserId,
  getReservationByPhoneAuth,
  getReservationByPhoneAndName,
  createUser,
  updateUser,
  deleteUser,
  createReservation,
  addNotice,
  updateNotice,
  deleteNotice,
  updateReservationStatus,
  deleteReservation,
  seedNoticesIfEmpty,
};
