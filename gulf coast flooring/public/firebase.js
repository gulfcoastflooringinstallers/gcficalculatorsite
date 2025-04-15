import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyAfQNSFkLoBwjU73L6btnwiM6VmAo1Caeo",
    authDomain: "gulf-coast-flooring-installers.firebaseapp.com",
    projectId: "gulf-coast-flooring-installers",
    storageBucket: "gulf-coast-flooring-installers.firebasestorage.app",
    messagingSenderId: "180287573941",
    appId: "1:180287573941:web:459ea2561f906d87ce13fc",
    measurementId: "G-7SRKZYLYJ0"
};

const app = initializeApp(firebaseConfig);
window.firebaseDb = getFirestore(app);
window.firebaseStorage = getStorage(app);
window.firebaseFunctions = { collection, addDoc, query, orderBy, onSnapshot, ref, uploadBytes, getDownloadURL };