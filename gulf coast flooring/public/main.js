window.initMap = function() {
    console.log('initMap called');
    try {
        const map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 30.3674, lng: -89.0928 },
            zoom: 10
        });
        const areas = [
            { name: "Gulfport", lat: 30.3674, lng: -89.0928 },
            { name: "Biloxi", lat: 30.3960, lng: -88.8853 },
            { name: "D'Iberville", lat: 30.4266, lng: -88.8906 },
            { name: "Ocean Springs", lat: 30.4113, lng: -88.8278 },
            { name: "Long Beach", lat: 30.3505, lng: -89.1528 },
            { name: "Pass Christian", lat: 30.3158, lng: -89.2475 },
            { name: "Bay St. Louis", lat: 30.3088, lng: -89.3300 },
            { name: "Waveland", lat: 30.2869, lng: -89.3762 }
        ];
        areas.forEach(area => {
            const marker = new google.maps.Marker({
                position: { lat: area.lat, lng: area.lng },
                map: map,
                title: area.name
            });
            const infoWindow = new google.maps.InfoWindow({
                content: `<h3>${area.name}</h3><p>Expert flooring services available here.</p>`
            });
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });
    } catch (error) {
        console.error('Error initializing map:', error);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    AOS.init();
    Calendly.initBadgeWidget({
        url: 'https://calendly.com/gulfcoastflooringinstallers/freequote',
        text: 'Schedule a Free Estimate Now',
        color: '#ff5722',
        textColor: '#ffffff',
        branding: false
    });
    document.getElementById('scheduleEstimate').addEventListener('click', function(e) {
        e.preventDefault();
        Calendly.initPopupWidget({url: 'https://calendly.com/gulfcoastflooringinstallers/freequote'});
    });
    const db = window.firebaseDb;
    const storage = window.firebaseStorage;
    const { collection, addDoc, query, orderBy, onSnapshot, ref, uploadBytes, getDownloadURL } = window.firebaseFunctions;

    const installationCostsWithMaterials = {
        "Glue Down Vinyl Plank": 3.25, "Floating Vinyl Plank": 5.25, "Carpet": 2.45, "Sheet Vinyl": 2.45,
        "Glue Down Carpet": 2.45, "Glue Down Wood": null, "Ceramic Tile": null, "Flooring Self Leveler": 3, "Other": null
    };
    const installationCostsLaborOnly = {
        "Glue Down Vinyl Plank": 2.00, "Floating Vinyl Plank": 2.00, "Carpet": 1.00, "Sheet Vinyl": 1.00,
        "Glue Down Carpet": 1.00, "Glue Down Wood": 2.75, "Ceramic Tile": 4.00, "Flooring Self Leveler": 3.00, "Other": null
    };
    const removalCosts = {
        "Carpet Floor Removal": 0.50, "Glue Down Carpet Removal": 1.00, "Floating Wood/Laminate/Vinyl Removal": 1.00,
        "Glue Down Vinyl Floor Removal": 2.00, "Ceramic Tile Removal": 4.00, "Glue Down Wood Floor Removal": 4.00, "Other": null
    };

    const estimateDiv = document.getElementById('estimate');
    const costSpan = document.getElementById('cost');
    const otherNote = document.getElementById('other-note');

    function addEntry(containerId) {
        const container = document.getElementById(containerId);
        const firstEntry = container.querySelector('.entry');
        const newEntry = firstEntry.cloneNode(true);
        newEntry.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
        newEntry.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
        container.appendChild(newEntry);
        updateEstimate();
    }

    function updateEstimate() {
        let totalCost = 0, hasOther = false;
        document.querySelectorAll('#installation-entries .entry').forEach(entry => {
            const type = entry.querySelector('select[name="install_type[]"]').value;
            const option = entry.querySelector('select[name="install_option[]"]').value;
            const sqft = parseFloat(entry.querySelector('input[name="install_sqft[]"]').value) || 0;
            if (type && option && sqft > 0) {
                const costPerSqFt = option === "with_materials" ? installationCostsWithMaterials[type] : installationCostsLaborOnly[type];
                if (costPerSqFt !== null) totalCost += costPerSqFt * sqft;
                else if (type === "Other") hasOther = true;
            }
        });
        document.querySelectorAll('#removal-entries .entry').forEach(entry => {
            const type = entry.querySelector('select[name="remove_type[]"]').value;
            const sqft = parseFloat(entry.querySelector('input[name="remove_sqft[]"]').value) || 0;
            if (type && sqft > 0) {
                const costPerSqFt = removalCosts[type];
                if (costPerSqFt !== null) totalCost += costPerSqFt * sqft;
                else if (type === "Other") hasOther = true;
            }
        });
        costSpan.textContent = `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        estimateDiv.style.display = 'block';
        otherNote.style.display = hasOther ? 'block' : 'none';
    }

    document.querySelectorAll('.add-btn').forEach(button => button.addEventListener('click', () => addEntry(button.getAttribute('data-container'))));
    document.querySelector('.contact-form').addEventListener('click', e => {
        if (e.target.classList.contains('remove-btn')) {
            const entry = e.target.closest('.entry');
            if (entry.parentElement.querySelectorAll('.entry').length > 1) {
                entry.remove();
                updateEstimate();
            }
        }
    });
    document.querySelector('.contact-form').addEventListener('change', e => { if (e.target.closest('.entry')) updateEstimate(); });
    document.querySelector('.contact-form').addEventListener('input', e => { if (e.target.closest('.entry')) updateEstimate(); });
    updateEstimate();

    const testimonialContainer = document.getElementById('testimonialContainer');
    const tickerContent = document.getElementById('tickerContent');
    const testimonialModal = document.getElementById('testimonialModal');
    const testimonialForm = document.getElementById('testimonialForm');

    function renderTestimonials() {
        const q = query(collection(db, 'testimonials'), orderBy('timestamp', 'desc'));
        onSnapshot(q, (snapshot) => {
            testimonialContainer.innerHTML = '';
            tickerContent.innerHTML = '';
            if (snapshot.empty) {
                testimonialContainer.innerHTML = '<p>No testimonials yet. Be the first to submit one!</p>';
                tickerContent.innerHTML = '<span>No testimonials yet. Be the first to submit one!</span>';
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const blockquote = document.createElement('blockquote');
                    blockquote.innerHTML = `<p>"${data.message}" - ${data.name}</p>`;
                    testimonialContainer.appendChild(blockquote);
                    const span = document.createElement('span');
                    span.textContent = `"${data.message}" - ${data.name}`;
                    tickerContent.appendChild(span);
                });
                tickerContent.innerHTML += tickerContent.innerHTML; // Seamless loop
            }
        }, (error) => {
            console.error('Error fetching testimonials:', error);
            testimonialContainer.innerHTML = '<p>Unable to load testimonials.</p>';
            tickerContent.innerHTML = '<span>Unable to load testimonials.</span>';
        });
    }

    renderTestimonials();
    document.getElementById('openTestimonialForm').addEventListener('click', () => testimonialModal.classList.add('show'));
    document.getElementById('closeModal').addEventListener('click', () => {
        testimonialModal.classList.remove('show');
        document.getElementById('feedback').textContent = '';
        testimonialForm.reset();
    });
    testimonialForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('testimonialName').value.trim();
        const message = document.getElementById('testimonialMessage').value.trim();
        if (name && message) {
            addDoc(collection(db, 'testimonials'), { name, message, timestamp: new Date() })
                .then(() => {
                    document.getElementById('feedback').textContent = 'Thank you for your testimonial!';
                    testimonialForm.reset();
                    setTimeout(() => testimonialModal.classList.remove('show'), 2000);
                })
                .catch(error => document.getElementById('feedback').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('feedback').textContent = 'Please fill all required fields.';
        }
    });

    const photoCarousel = document.getElementById('photoCarousel');
    let photos = [], currentIndex = 0, lightboxIndex = 0;

    function renderPhotos() {
        const q = query(collection(db, 'photos'), orderBy('timestamp', 'desc'));
        onSnapshot(q, (snapshot) => {
            photos = [];
            photoCarousel.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.url) {
                    photos.push(data);
                    const img = document.createElement('img');
                    img.src = data.url;
                    img.alt = `${data.photo_type || 'Photo'} - ${data.caption || `${data.name}'s flooring photo`}`;
                    img.title = img.alt;
                    img.dataset.index = photos.length - 1;
                    img.loading = 'lazy';
                    img.setAttribute('data-aos', 'flip-left');
                    img.onerror = () => img.style.display = 'none';
                    photoCarousel.appendChild(img);
                }
            });
            updateCarousel();
        }, (error) => {
            console.error('Error fetching photos:', error);
            photoCarousel.innerHTML = '<p>Unable to load photos.</p>';
        });
    }

    function updateCarousel() {
        if (photos.length === 0) {
            photoCarousel.style.transform = 'translateX(0)';
            return;
        }
        const width = window.innerWidth > 768 ? 300 : photoCarousel.offsetWidth;
        const offset = -currentIndex * width;
        photoCarousel.style.transform = `translateX(${offset}px)`;
    }

    document.getElementById('prevArrow').addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; updateCarousel(); } });
    document.getElementById('nextArrow').addEventListener('click', () => { if (currentIndex < photos.length - 1) { currentIndex++; updateCarousel(); } });
    photoCarousel.addEventListener('click', e => {
        if (e.target.tagName === 'IMG') {
            lightboxIndex = parseInt(e.target.dataset.index);
            document.getElementById('lightboxImg').src = photos[lightboxIndex].url;
            document.getElementById('lightboxCaption').textContent = photos[lightboxIndex].caption || '';
            document.getElementById('lightbox').classList.add('show');
        }
    });
    document.getElementById('lightboxPrev').addEventListener('click', () => { if (lightboxIndex > 0) { lightboxIndex--; document.getElementById('lightboxImg').src = photos[lightboxIndex].url; document.getElementById('lightboxCaption').textContent = photos[lightboxIndex].caption || ''; } });
    document.getElementById('lightboxNext').addEventListener('click', () => { if (lightboxIndex < photos.length - 1) { lightboxIndex++; document.getElementById('lightboxImg').src = photos[lightboxIndex].url; document.getElementById('lightboxCaption').textContent = photos[lightboxIndex].caption || ''; } });
    document.getElementById('lightboxClose').addEventListener('click', () => document.getElementById('lightbox').classList.remove('show'));
    renderPhotos();

    document.getElementById('openPhotoForm').addEventListener('click', () => document.getElementById('photoModal').classList.add('show'));
    document.getElementById('closePhotoModal').addEventListener('click', () => {
        document.getElementById('photoModal').classList.remove('show');
        document.getElementById('photoFeedback').textContent = '';
        document.getElementById('photoForm').reset();
    });
    document.getElementById('photoForm').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('photoName').value.trim();
        const photoType = document.getElementById('photoType').value;
        const caption = document.getElementById('photoCaption').value.trim();
        const file = document.getElementById('photoFile').files[0];
        if (name && file && photoType) {
            const storageRef = ref(storage, 'photos/' + Date.now() + '-' + file.name);
            uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref)).then(url => {
                return addDoc(collection(db, 'photos'), { name, photo_type: photoType, caption, url, timestamp: new Date() });
            }).then(() => {
                document.getElementById('photoFeedback').textContent = 'Thank you for your photo!';
                document.getElementById('photoForm').reset();
                setTimeout(() => document.getElementById('photoModal').classList.remove('show'), 2000);
            }).catch(error => document.getElementById('photoFeedback').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('photoFeedback').textContent = 'Please provide all required fields.';
        }
    });

    window.addEventListener('scroll', () => {
        const backToTop = document.getElementById('backToTop');
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });

    document.getElementById('backToTop').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
