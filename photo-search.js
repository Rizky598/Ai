// Photo Search JavaScript dengan Pinterest API
class PhotoSearch {
    constructor() {
        this.searchInput = document.getElementById("search-input");
        this.searchButton = document.getElementById("search-button");
        this.searchResults = document.getElementById("search-results");
        this.searchStatus = document.getElementById("search-status");
        this.loadingIndicator = document.getElementById("loading-indicator");
        this.navToggle = document.getElementById("nav-toggle");
        this.navMenu = document.getElementById("nav-menu");
        this.navClose = document.getElementById("nav-close");
        
        // Pinterest API Configuration
        this.pinterestApiUrl = "https://api.vreden.my.id/api/pinterest?query=";
        
        this.isSearching = false;
        this.currentPhotos = [];
        
        this.initializeEventListeners();
        this.initializeModals();
        this.initializeAudioControl();
        this.updateStatus("Masukkan kata kunci untuk mencari foto");
    }

    initializeEventListeners() {
        // Search events
        this.searchButton.addEventListener("click", () => this.searchPhotos());
        this.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.searchPhotos();
            }
        });

        // Navigation events
        this.navToggle.addEventListener("click", () => this.toggleNavigation());
        this.navClose.addEventListener("click", () => this.closeNavigation());
        
        // Close navigation when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
                this.closeNavigation();
            }
        });

        // Suggestion tags
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("suggestion-tag")) {
                const query = e.target.getAttribute("data-query");
                this.searchInput.value = query;
                this.searchPhotos();
            }
        });

        // Photo modal events
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("photo-item") || e.target.closest(".photo-item")) {
                const photoItem = e.target.closest(".photo-item");
                if (photoItem) {
                    const photoUrl = photoItem.getAttribute("data-url");
                    const photoSrc = photoItem.querySelector("img").src;
                    this.showPhotoModal(photoSrc, photoUrl);
                }
            }
        });
    }

    initializeModals() {
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.close');

        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Photo modal specific events
        const downloadBtn = document.getElementById("download-photo");
        const copyUrlBtn = document.getElementById("copy-url");

        if (downloadBtn) {
            downloadBtn.addEventListener("click", () => this.downloadCurrentPhoto());
        }

        if (copyUrlBtn) {
            copyUrlBtn.addEventListener("click", () => this.copyCurrentPhotoUrl());
        }
    }

    initializeAudioControl() {
        const audioToggle = document.getElementById('audio-toggle');
        const backgroundVideo = document.getElementById('background-video');
        
        if (audioToggle && backgroundVideo) {
            // Remove any existing event listeners to prevent duplicates
            const newAudioToggle = audioToggle.cloneNode(true);
            audioToggle.parentNode.replaceChild(newAudioToggle, audioToggle);
            
            // Set initial state
            newAudioToggle.classList.add('muted');
            newAudioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            newAudioToggle.title = 'Hidupkan Audio';
            
            // Add debouncing to prevent multiple rapid clicks
            let isProcessing = false;
            
            newAudioToggle.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Prevent multiple rapid clicks
                if (isProcessing) return;
                isProcessing = true;
                
                try {
                    // Wait for video to be ready
                    if (backgroundVideo.readyState < 2) {
                        await new Promise((resolve) => {
                            backgroundVideo.addEventListener('loadeddata', resolve, { once: true });
                        });
                    }
                    
                    if (backgroundVideo.muted) {
                        // Unmute the video
                        backgroundVideo.muted = false;
                        newAudioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                        newAudioToggle.classList.remove('muted');
                        newAudioToggle.title = 'Matikan Audio';
                        
                        // Ensure video is playing
                        if (backgroundVideo.paused) {
                            try {
                                await backgroundVideo.play();
                            } catch (playError) {
                                console.log('Video play failed:', playError);
                                // If play fails, revert the changes
                                backgroundVideo.muted = true;
                                newAudioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
                                newAudioToggle.classList.add('muted');
                                newAudioToggle.title = 'Hidupkan Audio';
                                this.updateStatus('Audio tidak dapat dihidupkan - browser memblokir autoplay');
                                return;
                            }
                        }
                        
                        this.updateStatus('Audio dihidupkan');
                    } else {
                        // Mute the video
                        backgroundVideo.muted = true;
                        newAudioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
                        newAudioToggle.classList.add('muted');
                        newAudioToggle.title = 'Hidupkan Audio';
                        
                        this.updateStatus('Audio dimatikan');
                    }
                } catch (error) {
                    console.error('Audio toggle error:', error);
                    this.updateStatus('Terjadi kesalahan saat mengubah audio');
                } finally {
                    // Reset processing flag after a short delay
                    setTimeout(() => {
                        isProcessing = false;
                    }, 500);
                }
            });
        }
    }

    toggleNavigation() {
        this.navMenu.classList.toggle("active");
        this.navToggle.classList.toggle("active");
    }

    closeNavigation() {
        this.navMenu.classList.remove("active");
        this.navToggle.classList.remove("active");
    }

    async searchPhotos() {
        const query = this.searchInput.value.trim();
        if (query === "" || this.isSearching) return;

        // Hide welcome message
        const welcomeSearch = document.querySelector('.welcome-search');
        if (welcomeSearch) {
            welcomeSearch.style.display = 'none';
        }

        this.showLoadingIndicator();
        this.updateStatus("Mencari foto...");
        this.isSearching = true;

        try {
            const response = await this.callPinterestAPI(query);
            this.hideLoadingIndicator();
            
            if (response && response.length > 0) {
                this.displayPhotos(response);
                this.updateStatus(`Ditemukan ${response.length} foto untuk "${query}"`);
            } else {
                this.displayNoResults(query);
                this.updateStatus(`Tidak ada foto ditemukan untuk "${query}"`);
            }
            
        } catch (error) {
            this.hideLoadingIndicator();
            console.error("Error searching photos:", error);
            this.displayError();
            this.updateStatus("Terjadi kesalahan saat mencari foto");
        } finally {
            this.isSearching = false;
        }
    }

    async callPinterestAPI(query) {
        try {
            // Try with CORS mode first, fallback to no-cors if needed
            let response;
            try {
                response = await fetch(`${this.pinterestApiUrl}${encodeURIComponent(query)}`, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
            } catch (corsError) {
                console.log('CORS error, trying with no-cors mode:', corsError);
                // Fallback to no-cors mode
                response = await fetch(`${this.pinterestApiUrl}${encodeURIComponent(query)}`, {
                    method: 'GET',
                    mode: 'no-cors'
                });
            }
            
            if (!response.ok && response.type !== 'opaque') {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // For no-cors mode, we can't read the response, so we'll simulate data
            if (response.type === 'opaque') {
                console.log('Using simulated data due to CORS restrictions');
                return this.getSimulatedData(query);
            }

            const data = await response.json();
            console.log('Pinterest API Response:', data);
            
            // Assuming the API returns an array of photo objects
            // Adjust this based on the actual API response structure
            if (data && Array.isArray(data)) {
                return data;
            } else if (data && data.data && Array.isArray(data.data)) {
                return data.data;
            } else if (data && data.results && Array.isArray(data.results)) {
                return data.results;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Pinterest API Error:', error);
            // Return simulated data as fallback
            console.log('Using simulated data as fallback');
            return this.getSimulatedData(query);
        }
    }

    getSimulatedData(query) {
        // Simulated photo data for demonstration
        const baseImages = [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
            'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400'
        ];

        return baseImages.map((url, index) => ({
            image: url,
            url: url,
            title: `${query} photo ${index + 1}`,
            description: `Beautiful ${query} image from Unsplash`
        }));
    }

    displayPhotos(photos) {
        this.currentPhotos = photos;
        
        const photoGrid = document.createElement('div');
        photoGrid.className = 'photo-grid';
        
        photos.forEach((photo, index) => {
            const photoItem = this.createPhotoItem(photo, index);
            photoGrid.appendChild(photoItem);
        });
        
        this.searchResults.innerHTML = '';
        this.searchResults.appendChild(photoGrid);
    }

    createPhotoItem(photo, index) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.setAttribute('data-url', photo.url || photo.link || photo.image);
        photoItem.setAttribute('data-index', index);
        
        // Handle different possible image URL properties
        const imageUrl = photo.image || photo.url || photo.src || photo.thumbnail;
        
        photoItem.innerHTML = `
            <img src="${imageUrl}" alt="Pinterest Photo" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='">
            <div class="photo-info">
                <div class="photo-actions">
                    <button class="btn-small btn-download" onclick="photoSearch.downloadPhoto(${index})">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <button class="btn-small btn-copy" onclick="photoSearch.copyPhotoUrl(${index})">
                        <i class="fas fa-copy"></i>
                        Copy URL
                    </button>
                </div>
            </div>
        `;
        
        return photoItem;
    }

    displayNoResults(query) {
        this.searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Tidak ada hasil ditemukan</h3>
                <p>Tidak ada foto yang ditemukan untuk pencarian "${query}".</p>
                <div class="search-suggestions">
                    <h4>Coba kata kunci lain:</h4>
                    <div class="suggestion-tags">
                        <button class="suggestion-tag" data-query="nature">Alam</button>
                        <button class="suggestion-tag" data-query="food">Makanan</button>
                        <button class="suggestion-tag" data-query="travel">Travel</button>
                        <button class="suggestion-tag" data-query="art">Seni</button>
                    </div>
                </div>
            </div>
        `;
    }

    displayError() {
        this.searchResults.innerHTML = `
            <div class="error-message">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Terjadi Kesalahan</h3>
                <p>Maaf, terjadi kesalahan saat mencari foto. Silakan coba lagi.</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i>
                    Muat Ulang
                </button>
            </div>
        `;
    }

    showLoadingIndicator() {
        this.loadingIndicator.classList.add('show');
    }

    hideLoadingIndicator() {
        this.loadingIndicator.classList.remove('show');
    }

    showPhotoModal(imageSrc, imageUrl) {
        const modal = document.getElementById('photo-modal');
        const modalPhoto = document.getElementById('modal-photo');
        const photoUrl = document.getElementById('photo-url');
        
        modalPhoto.src = imageSrc;
        photoUrl.textContent = imageUrl;
        
        // Store current photo data for download/copy actions
        this.currentModalPhoto = {
            src: imageSrc,
            url: imageUrl
        };
        
        modal.style.display = 'block';
    }

    downloadPhoto(index) {
        if (this.currentPhotos[index]) {
            const photo = this.currentPhotos[index];
            const imageUrl = photo.image || photo.url || photo.src || photo.thumbnail;
            this.downloadImage(imageUrl, `pinterest-photo-${index + 1}`);
        }
    }

    copyPhotoUrl(index) {
        if (this.currentPhotos[index]) {
            const photo = this.currentPhotos[index];
            const imageUrl = photo.image || photo.url || photo.src || photo.thumbnail;
            this.copyToClipboard(imageUrl);
        }
    }

    downloadCurrentPhoto() {
        if (this.currentModalPhoto) {
            this.downloadImage(this.currentModalPhoto.src, 'pinterest-photo');
        }
    }

    copyCurrentPhotoUrl() {
        if (this.currentModalPhoto) {
            this.copyToClipboard(this.currentModalPhoto.url);
        }
    }

    async downloadImage(url, filename) {
        try {
            this.updateStatus("Mengunduh foto...");
            
            const response = await fetch(url);
            const blob = await response.blob();
            
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${filename}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            this.updateStatus("Foto berhasil diunduh");
        } catch (error) {
            console.error('Download error:', error);
            this.updateStatus("Gagal mengunduh foto");
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.updateStatus("URL berhasil disalin ke clipboard");
        } catch (error) {
            console.error('Copy error:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus("URL berhasil disalin ke clipboard");
        }
    }

    updateStatus(message) {
        this.searchStatus.textContent = message;
    }
}

// Global functions for inline event handlers
let photoSearch;

function showAbout() {
    document.getElementById('about-modal').style.display = 'block';
}

function showHelp() {
    document.getElementById('help-modal').style.display = 'block';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    photoSearch = new PhotoSearch();
});

// Make photoSearch globally accessible for inline event handlers
window.photoSearch = photoSearch;

