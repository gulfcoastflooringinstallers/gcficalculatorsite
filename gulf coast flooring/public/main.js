// Firebase initialization check
if (!window.firebaseDb || !window.firebaseStorage || !window.firebaseFunctions) {
    console.error('Firebase not initialized properly');
} else {
    const db = window.firebaseDb;
    const storage = window.firebaseStorage;
    const { collection, addDoc, query, orderBy, onSnapshot, ref, uploadBytes, getDownloadURL } = window.firebaseFunctions;

    // Google Maps initialization
    window.initMap = function() {
        const map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 30.4066, lng: -88.9475 },
            zoom: 10
        });
        new google.maps.Marker({
            position: { lat: 30.4066, lng: -88.9475 },
            map: map,
            title: 'Gulf Coast Flooring'
        });
    };

    // Render testimonials with real-time updates
    function renderTestimonials() {
        const q = query(collection(db, 'testimonials'), orderBy('timestamp', 'desc'));
        onSnapshot(q, (snapshot) => {
            const container = document.getElementById('testimonialContainer');
            const ticker = document.getElementById('tickerContent');
            container.innerHTML = '';
            ticker.innerHTML = '';
            snapshot.forEach((doc) => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = 'testimonial';
                div.innerHTML = `<blockquote>${data.message}</blockquote><cite>- ${data.name}</cite>`;
                container.appendChild(div);
                ticker.innerHTML += `<span>${data.message} - ${data.name}</span>`;
            });
        }, (error) => {
            console.error('Error fetching testimonials:', error);
            document.getElementById('testimonialContainer').innerHTML = '<p>Unable to load testimonials.</p>';
        });
    }

    // Render photo gallery with real-time updates
    let photos = [];
    let currentIndex = 0;
    function renderPhotos() {
        const q = query(collection(db, 'photos'), orderBy('timestamp', 'desc'));
        onSnapshot(q, (snapshot) => {
            photos = snapshot.docs.map(doc => doc.data());
            const carousel = document.getElementById('photoCarousel');
            carousel.innerHTML = '';
            photos.forEach((photo, index) => {
                const img = document.createElement('img');
                img.src = photo.url;
                img.alt = photo.caption || 'User submitted photo';
                img.loading = 'lazy';
                img.addEventListener('click', () => openLightbox(index));
                carousel.appendChild(img);
            });
        }, (error) => {
            console.error('Error fetching photos:', error);
            document.getElementById('photoCarousel').innerHTML = '<p>Unable to load photos.</p>';
        });
    }

    // Lightbox functionality with keyboard support
    function openLightbox(index) {
        currentIndex = index;
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightboxImg');
        const caption = document.getElementById('lightboxCaption');
        img.src = photos[index].url;
        caption.textContent = photos[index].caption || '';
        lightbox.classList.remove('hidden');
        lightbox.focus();
    }

    document.getElementById('lightboxClose').addEventListener('click', () => {
        document.getElementById('lightbox').classList.add('hidden');
    });

    document.getElementById('lightboxPrev').addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        openLightbox(currentIndex);
    });

    document.getElementById('lightboxNext').addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % photos.length;
        openLightbox(currentIndex);
    });

    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft') {
                currentIndex = (currentIndex - 1 + photos.length) % photos.length;
                openLightbox(currentIndex);
            } else if (e.key === 'ArrowRight') {
                currentIndex = (currentIndex + 1) % photos.length;
                openLightbox(currentIndex);
            } else if (e.key === 'Escape') {
                lightbox.classList.add('hidden');
            }
        }
    });

    // Testimonial form handling
    const testimonialModal = document.getElementById('testimonialModal');
    document.getElementById('openTestimonialForm').addEventListener('click', () => {
        testimonialModal.classList.remove('hidden');
        document.getElementById('testimonialName').focus();
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        testimonialModal.classList.add('hidden');
    });

    document.getElementById('testimonialForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('testimonialName').value.trim();
        const message = document.getElementById('testimonialMessage').value.trim();
        const feedback = document.getElementById('feedback');
        if (!name || !message) {
            feedback.textContent = 'Please fill in all required fields.';
            return;
        }
        feedback.textContent = 'Submitting...';
        try {
            await addDoc(collection(db, 'testimonials'), {
                name,
                message,
                timestamp: new Date().toISOString()
            });
            feedback.textContent = 'Thank you for your testimonial!';
            document.getElementById('testimonialForm').reset();
            setTimeout(() => {
                testimonialModal.classList.add('hidden');
                feedback.textContent = '';
            }, 2000);
        } catch (error) {
            feedback.textContent = 'Error submitting testimonial. Please try again.';
            console.error('Testimonial submission error:', error);
        }
    });

    // Photo form handling
    const photoModal = document.getElementById('photoModal');
    document.getElementById('openPhotoForm').addEventListener('click', () => {
        photoModal.classList.remove('hidden');
        document.getElementById('photoName').focus();
    });

    document.getElementById('closePhotoModal').addEventListener('click', () => {
        photoModal.classList.add('hidden');
    });

    document.getElementById('photoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('photoName').value.trim();
        const type = document.getElementById('photoType').value;
        const caption = document.getElementById('photoCaption').value.trim();
        const file = document.getElementById('photoFile').files[0];
        const feedback = document.getElementById('photoFeedback');
        if (!name || !type || !file) {
            feedback.textContent = 'Please fill in all required fields.';
            return;
        }
        feedback.textContent = 'Uploading...';
        try {
            const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            await addDoc(collection(db, 'photos'), {
                name,
                type,
                caption,
                url,
                timestamp: new Date().toISOString()
            });
            feedback.textContent = 'Photo submitted successfully!';
            document.getElementById('photoForm').reset();
            setTimeout(() => {
                photoModal.classList.add('hidden');
                feedback.textContent = '';
            }, 2000);
        } catch (error) {
            feedback.textContent = 'Error uploading photo. Please try again.';
            console.error('Photo upload error:', error);
        }
    });

    // Carousel navigation
    document.getElementById('prevArrow').addEventListener('click', () => {
        document.getElementById('photoCarousel').scrollBy({ left: -210, behavior: 'smooth' });
    });

    document.getElementById('nextArrow').addEventListener('click', () => {
        document.getElementById('photoCarousel').scrollBy({ left: 210, behavior: 'smooth' });
    });

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.remove('hidden');
        } else {
            backToTop.classList.add('hidden');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Dynamic form entries
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = document.getElementById(btn.dataset.container);
            const entry = container.querySelector('.entry').cloneNode(true);
            entry.querySelectorAll('input, select').forEach(el => el.value = '');
            entry.querySelector('.remove-btn').addEventListener('click', () => {
                if (container.children.length > 1) entry.remove();
            });
            container.appendChild(entry);
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('.form-group').querySelector('.entries');
            if (container.children.length > 1) btn.parentElement.remove();
        });
    });

    // Initialize AOS
    AOS.init({ duration: 800, once: true });

    // Render content on load
    renderTestimonials();
    renderPhotos();
}

// Calendly integration
document.querySelector('.schedule-button')?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
        Calendly.initPopupWidget({ url: 'https://calendly.com/gulfcoastflooringinstallers/freequote' });
    } catch (error) {
        console.error('Calendly initialization failed:', error);
        alert('Unable to load scheduling tool. Please try again later.');
    }
});