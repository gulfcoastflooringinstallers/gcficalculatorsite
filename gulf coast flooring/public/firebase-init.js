import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyBF3KjFJcYR5l7QFmgmi66ob29N66OexAE",
    authDomain: "gcfi-testimonials.firebaseapp.com",
    projectId: "gcfi-testimonials",
    storageBucket: "gcfi-testimonials.firebasestorage.app",
    messagingSenderId: "1066846180021",
    appId: "1:1066846180021:web:5c02ff7f5d3ac3ef4da4fc",
    measurementId: "G-WJME4LN8BD"
};

try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Expose Firebase instances and functions to the window object
    window.firebaseApp = app;
    window.firebaseDb = db;
    window.firebaseStorage = storage;
    window.firebaseFunctions = { collection, addDoc, query, orderBy, onSnapshot, ref, uploadBytes, getDownloadURL };

    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}
