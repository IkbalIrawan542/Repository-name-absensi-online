import{initializeApp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import{getFirestore,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,onSnapshot,query,where,orderBy,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase project: inhouse-35f83 / JADWAL INTERNAL
const app=initializeApp({
  apiKey:"AIzaSyCojGDu5NHJyTg8xqxSzGNt26m2OEXjwJI",
  authDomain:"inhouse-35f83.firebaseapp.com",
  projectId:"inhouse-35f83",
  storageBucket:"inhouse-35f83.firebasestorage.app",
  messagingSenderId:"255613084550",
  appId:"1:255613084550:web:ddb683d900d90f5d198207",
  measurementId:"G-TNY4YNREWE"
});
const auth=getAuth(app),db=getFirestore(app);
export{auth,db,signInWithEmailAndPassword,signOut,onAuthStateChanged,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,onSnapshot,query,where,orderBy,serverTimestamp};
