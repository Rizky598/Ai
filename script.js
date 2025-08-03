// AI Chatbot JavaScript dengan Google AI API dan Memori Percakapan
class AIChatbot {
    constructor() {
        this.chatBox = document.getElementById("chat-box");
        this.userInput = document.getElementById("user-input");
        this.sendButton = document.getElementById("send-button");
        this.aiModeSelect = document.getElementById("ai-mode");
        this.clearChatButton = document.getElementById("clear-chat");
        this.exportChatButton = document.getElementById("export-chat");
        this.voiceInputButton = document.getElementById("voice-input");
        this.statusDiv = document.getElementById("status");
        this.typingIndicator = document.getElementById("typing-indicator");
        this.charCount = document.querySelector(".char-count");
        
        this.sessionId = 'web-session-' + Date.now();
        this.chatHistory = [];
        this.isTyping = false;
        
        // Google AI API Configuration
        this.googleAIApiKey = "AIzaSyDhmCzfIJ7YbUpl1m0uIvHuEvt2yf-FC6A";
        this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
        
        // Storage key untuk localStorage
        this.storageKey = 'ai-chatbot-history';
        
        this.initializeEventListeners();
        this.initializeModals();
        this.initializeAudioControl();
        this.initializeNavigation();
        this.loadChatHistory(); // Load riwayat percakapan saat startup
        this.updateStatus("Siap untuk chat dengan AI sungguhan");
    }

    // Fungsi untuk menyimpan riwayat percakapan ke localStorage
    saveChatHistory() {
        try {
            const historyData = {
                sessionId: this.sessionId,
                lastUpdated: new Date().toISOString(),
                history: this.chatHistory
            };
            localStorage.setItem(this.storageKey, JSON.stringify(historyData));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    // Fungsi untuk memuat riwayat percakapan dari localStorage
    loadChatHistory() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const historyData = JSON.parse(savedData);
                this.chatHistory = historyData.history || [];
                
                // Restore chat messages di UI
                if (this.chatHistory.length > 0) {
                    // Hide welcome message
                    const welcomeMessage = document.querySelector('.welcome-message');
                    if (welcomeMessage) {
                        welcomeMessage.style.display = 'none';
                    }
                    
                    // Restore semua pesan
                    this.chatHistory.forEach(chat => {
                        this.appendMessage("user", chat.user, chat.timestamp, false);
                        this.appendMessage("ai", chat.ai, chat.timestamp, false);
                    });
                    
                    this.updateStatus(`Riwayat percakapan dimuat (${this.chatHistory.length} pesan)`);
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.chatHistory = [];
        }
    }

    // Fungsi untuk menghapus riwayat percakapan dari localStorage
    clearChatHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            this.chatHistory = [];
        } catch (error) {
            console.error('Error clearing chat history:', error);
        }
    }

    // Fungsi untuk mendapatkan konteks percakapan untuk API
    getChatContext() {
        // Ambil maksimal 10 percakapan terakhir untuk konteks
        const maxContext = 10;
        const recentHistory = this.chatHistory.slice(-maxContext);
        
        let context = "";
        recentHistory.forEach(chat => {
            context += `User: ${chat.user}\nAI: ${chat.ai}\n\n`;
        });
        
        return context;
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
            
            // Handle video events
            backgroundVideo.addEventListener('loadeddata', () => {
                console.log('Video loaded successfully');
            });
            
            backgroundVideo.addEventListener('canplay', () => {
                console.log('Video can start playing');
            });
            
            backgroundVideo.addEventListener('error', (e) => {
                console.error('Video error:', e);
                newAudioToggle.style.display = 'none'; // Hide button if video fails
            });
            
            // Handle browser autoplay policy
            backgroundVideo.addEventListener('play', () => {
                if (!backgroundVideo.muted) {
                    newAudioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                    newAudioToggle.classList.remove('muted');
                    newAudioToggle.title = 'Matikan Audio';
                }
            });
            
            backgroundVideo.addEventListener('pause', () => {
                if (!backgroundVideo.muted) {
                    // Video paused but not muted, try to resume
                    backgroundVideo.play().catch(error => {
                        console.log('Auto-resume failed:', error);
                    });
                }
            });
            
        } else {
            console.error('Audio toggle button or background video not found');
        }
    }

    initializeNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navClose = document.getElementById('nav-close');
        
        if (navToggle && navMenu && navClose) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            navClose.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
            
            // Close navigation when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            });
        }
    }

    initializeEventListeners() {
        // Send message events
        this.sendButton.addEventListener("click", () => this.sendMessage());
        this.userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input character count - REMOVED (unlimited text)
        // this.userInput.addEventListener("input", () => {
        //     const length = this.userInput.value.length;
        //     this.charCount.textContent = `${length}/6000`;
        //     
        //     if (length > 5500) {
        //         this.charCount.style.color = "#ff6b6b";
        //     } else if (length > 5000) {
        //         this.charCount.style.color = "#ffa726";
        //     } else {
        //         this.charCount.style.color = "#999";
        //     }
        // });

        // Other controls
        this.clearChatButton.addEventListener("click", () => this.clearChat());
        this.exportChatButton.addEventListener("click", () => this.exportChat());
        this.voiceInputButton.addEventListener("click", () => this.simulateVoiceInput());
        
        // AI mode change
        this.aiModeSelect.addEventListener("change", () => {
            this.updateStatus(`Mode diubah ke: ${this.getModeDisplayName()}`);
        });

        // Quick action buttons
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("quick-btn")) {
                const message = e.target.getAttribute("data-message");
                this.userInput.value = message;
                this.sendMessage();
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
    }

    getModeDisplayName() {
        const modes = {
            'friendly': '🤗 Ramah',
            'professional': '💼 Profesional',
            'creative': '🎨 Kreatif',
            'casual': '😎 Santai',
            'technical': '🔧 Teknis'
        };
        return modes[this.aiModeSelect.value] || this.aiModeSelect.value;
    }

    async sendMessage() {
        const prompt = this.userInput.value.trim();
        if (prompt === "" || this.isTyping) return;

        // Hide welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        this.appendMessage("user", prompt);
        this.userInput.value = "";
        // Character count removed - unlimited text now
        
        this.showTypingIndicator();
        this.updateStatus("AI sedang berpikir...");

        try {
            const response = await this.callGoogleAI(prompt);
            this.hideTypingIndicator();
            this.appendMessage("ai", response);
            this.updateStatus(`Mode: ${this.getModeDisplayName()} | Session: ${this.sessionId.slice(-8)}`);
            
            // Add to chat history dan simpan ke localStorage
            const chatEntry = {
                user: prompt,
                ai: response,
                mode: this.aiModeSelect.value,
                timestamp: new Date().toISOString()
            };
            this.chatHistory.push(chatEntry);
            this.saveChatHistory(); // Simpan ke localStorage
            
        } catch (error) {
            this.hideTypingIndicator();
            console.error("Error calling Google AI:", error);
            this.appendMessage("ai", "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.");
            this.updateStatus("Error terjadi");
        }
    }

    async callGoogleAI(userMessage) {
        const mode = this.aiModeSelect.value;
        const systemPrompt = this.getSystemPromptByMode(mode);
        const chatContext = this.getChatContext(); // Dapatkan konteks percakapan sebelumnya
        
        // Gabungkan system prompt, konteks, dan pesan user
        let fullPrompt = systemPrompt;
        if (chatContext) {
            fullPrompt += `\n\nKonteks percakapan sebelumnya:\n${chatContext}`;
        }
        fullPrompt += `\nUser: ${userMessage}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.9, // Increased for more creativity/less deterministic responses
                topK: 50, // Increased for more diverse responses
                topP: 0.98, // Increased for more diverse responses
                maxOutputTokens: 2048, // Increased output length
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.googleAIApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from Google AI');
            }
        } catch (error) {
            console.error('Detailed API Error:', error);
            throw error;
        }
    }

    getSystemPromptByMode(mode) {
        const prompts = {
            friendly: "Kamu adalah AI assistant yang sangat ramah, bersahabat, dan suka bercanda. Selalu gunakan bahasa Indonesia yang hangat dan penuh empati. Gunakan emoji yang sesuai dan sesekali buat lelucon ringan atau pun yang lucu untuk membuat percakapan lebih menyenangkan. Jawab dengan gaya yang santai tapi tetap informatif. Jangan ragu untuk menambahkan humor yang sehat dan menghibur. Ingat konteks percakapan sebelumnya dan rujuk kembali jika relevan.",
            
            professional: "Kamu adalah AI assistant profesional yang memberikan jawaban yang terstruktur, akurat, dan formal, tapi sesekali bisa menyelipkan humor halus yang sopan. Gunakan bahasa Indonesia yang baku dan profesional. Berikan informasi yang komprehensif dan well-organized. Boleh sesekali menambahkan analogi lucu atau contoh yang menghibur untuk mempermudah pemahaman. Selalu ingat konteks percakapan sebelumnya untuk memberikan jawaban yang konsisten.",
            
            creative: "Kamu adalah AI assistant yang sangat kreatif, inovatif, dan penuh humor! Gunakan bahasa Indonesia yang ekspresif dan penuh imajinasi. Berikan jawaban yang out-of-the-box dan inspiratif dengan sentuhan komedi yang cerdas. Gunakan analogi lucu, metafora kocak, dan pendekatan kreatif yang menghibur dalam menjelaskan sesuatu. Gunakan emoji kreatif dan jangan takut untuk bercanda. Bangun dari ide-ide yang sudah dibahas sebelumnya dengan twist yang menghibur.",
            
            casual: "Kamu adalah AI assistant yang santai, gaul, dan super lucu! Gunakan bahasa Indonesia yang casual, seperti bahasa anak muda zaman sekarang. Boleh pakai bahasa gaul yang wajar, singkatan, dan gaya bicara yang rileks. Buat suasana percakapan jadi chill dan menyenangkan dengan banyak lelucon, meme reference, dan humor yang relate sama anak muda. Jangan lupa bercanda dan bikin ketawa! Ingat topik yang udah dibahas sebelumnya biar nyambung terus.",
            
            technical: "Kamu adalah AI assistant yang fokus pada aspek teknis dan detail, tapi juga punya sense of humor yang kering dan cerdas. Gunakan bahasa Indonesia yang presisi dan akurat. Berikan penjelasan yang mendalam, step-by-step, dan berbasis data, tapi sesekali selipkan joke programmer atau analogi teknis yang lucu. Sertakan contoh kode, spesifikasi teknis, atau referensi yang relevan dengan sentuhan humor geek. Selalu rujuk kembali ke diskusi teknis sebelumnya untuk kontinuitas."
        };
        
        return prompts[mode] || prompts.friendly;
    }

    appendMessage(sender, text, timestamp = null, shouldSave = true) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);
        
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = text;
        
        const messageInfo = document.createElement("div");
        messageInfo.classList.add("message-info");
        
        // Gunakan timestamp yang diberikan atau buat yang baru
        const messageTime = timestamp ? new Date(timestamp) : new Date();
        const timeString = messageTime.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (sender === "user") {
            messageInfo.innerHTML = `<i class="fas fa-user"></i> ${timeString}`;
        } else {
            messageInfo.innerHTML = `<i class="fas fa-robot"></i> ${this.getModeDisplayName()} • ${timeString}`;
        }
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageInfo);
        this.chatBox.appendChild(messageDiv);
        
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.add("show");
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.classList.remove("show");
    }

    updateStatus(message) {
        this.statusDiv.innerHTML = `<i class="fas fa-circle" style="color: #4CAF50; font-size: 0.6rem;"></i> ${message}`;
    }

    clearChat() {
        if (confirm("Apakah Anda yakin ingin menghapus semua percakapan? Ini akan menghapus riwayat percakapan yang tersimpan.")) {
            this.chatBox.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>Selamat datang di AI Chatbot!</h3>
                    <p>Saya siap membantu Anda. Silakan ketik pesan untuk memulai percakapan.</p>
                    <div class="quick-actions">
                        <button class="quick-btn" data-message="Bisakah kamu membantu saya?">
                            <i class="fas fa-question-circle"></i>
                            Minta Bantuan
                        </button>
                        <button class="quick-btn" data-message="Ceritakan tentang dirimu">
                            <i class="fas fa-info-circle"></i>
                            Tentang AI
                        </button>
                    </div>
                </div>
            `;
            this.clearChatHistory(); // Hapus dari localStorage
            this.updateStatus("Chat dan riwayat percakapan berhasil dihapus");
        }
    }

    exportChat() {
        if (this.chatHistory.length === 0) {
            alert("Tidak ada percakapan untuk diekspor!");
            return;
        }

        const exportData = {
            sessionId: this.sessionId,
            exportDate: new Date().toISOString(),
            totalMessages: this.chatHistory.length,
            conversations: this.chatHistory
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.updateStatus("Chat berhasil diekspor");
    }

    simulateVoiceInput() {
        const voiceMessages = [
            "Bisakah kamu membantu saya?",
            "Ceritakan tentang dirimu",
            "Bagaimana cara kerja AI?",
            "Apa yang bisa kamu lakukan?"
        ];
        
        const randomMessage = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];
        this.userInput.value = randomMessage;
        
        // Simulate typing effect
        this.userInput.value = "";
        let i = 0;
        const typeInterval = setInterval(() => {
            this.userInput.value += randomMessage[i];
            i++;
            if (i >= randomMessage.length) {
                clearInterval(typeInterval);
            }
        }, 50);
        
        this.updateStatus("Voice input disimulasikan");
    }

    updateInputHeader() {
        const currentModeElement = document.getElementById("current-mode");
        const currentTimeElement = document.getElementById("current-time");
        const sessionIdElement = document.getElementById("session-id");

        if (currentModeElement) {
            currentModeElement.textContent = this.getModeDisplayName().replace(/\s*\S+$/, ""); // Remove emoji and keep only text
        }
        if (currentTimeElement) {
            currentTimeElement.textContent = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        }
        if (sessionIdElement) {
            sessionIdElement.textContent = `Session: ${this.sessionId.slice(-8)}`;
        }
    }
}

// Global functions for modals
function showAbout() {
    document.getElementById("about-modal").style.display = "block";
}

function showHelp() {
    document.getElementById("help-modal").style.display = "block";
}

// Initialize chatbot when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new AIChatbot();
});

// Add some fun easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code: ↑↑↓↓←→←→BA
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    if (!window.konamiIndex) window.konamiIndex = 0;
    
    if (e.keyCode === konamiCode[window.konamiIndex]) {
        window.konamiIndex++;
        if (window.konamiIndex === konamiCode.length) {
            document.body.style.animation = 'rainbow 2s infinite';
            setTimeout(() => {
                document.body.style.animation = '';
                window.konamiIndex = 0;
            }, 5000);
        }
    } else {
        window.konamiIndex = 0;
    }
});

// Add rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);



// Gallery functionality
function showGallery() {
    const modal = document.getElementById('gallery-modal');
    modal.style.display = 'block';
    loadGalleryImages();
}

function loadGalleryImages() {
    const galleryScroll = document.getElementById('gallery-scroll');
    
    // Array gambar yang akan ditampilkan
    const images = [
        'https://files.catbox.moe/u5rv9k.jpg',
        'https://files.catbox.moe/gizi7p.jpg',
        'https://files.catbox.moe/en6nl2.png',
        'https://files.catbox.moe/ejw9jq.jpg',
        'https://files.catbox.moe/d3dquy.jpg',
        'https://files.catbox.moe/7cs70u.jpg',
        'https://files.catbox.moe/amcwrg.jpg'
    ];
    
    // Clear existing content
    galleryScroll.innerHTML = '';
    
    // Add images to gallery
    images.forEach((imagePath, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = `Gallery Image ${index + 1}`;
        img.onerror = function() {
            // Jika gambar tidak ditemukan, gunakan placeholder
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlICcgKyAoaW5kZXggKyAxKSArICc8L3RleHQ+PC9zdmc+';
        };
        
        galleryItem.appendChild(img);
        galleryScroll.appendChild(galleryItem);
    });
    
    // Initialize gallery controls
    initializeGalleryControls();
}

function initializeGalleryControls() {
    const galleryScroll = document.getElementById('gallery-scroll');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.addEventListener('click', () => {
        galleryScroll.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });
    
    nextBtn.addEventListener('click', () => {
        galleryScroll.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });
}

// Update modal close functionality to include gallery modal
document.addEventListener('DOMContentLoaded', function() {
    // Existing modal close functionality
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

