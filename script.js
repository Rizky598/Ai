// AI Chatbot JavaScript dengan Google AI API
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
        this.googleAIApiKey = "AIzaSyAcIVehNGo2jN-SlZv8P7Ss0-sPfxe9VCw";
        this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
        
        this.initializeEventListeners();
        this.initializeModals();
        this.initializeAudioControl();
        this.updateStatus("Siap untuk chat dengan AI sungguhan");
    }

    initializeAudioControl() {
        const audioToggle = document.getElementById('audio-toggle');
        const backgroundVideo = document.getElementById('background-video');
        
        if (audioToggle && backgroundVideo) {
            // Set initial state
            audioToggle.classList.add('muted');
            audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            audioToggle.title = 'Hidupkan Audio';
            
            // Remove any existing event listeners
            audioToggle.replaceWith(audioToggle.cloneNode(true));
            const newAudioToggle = document.getElementById('audio-toggle');
            
            newAudioToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Add visual feedback immediately
                newAudioToggle.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    newAudioToggle.style.transform = '';
                }, 150);
                
                if (backgroundVideo.muted) {
                    // Unmute the video
                    backgroundVideo.muted = false;
                    newAudioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                    newAudioToggle.classList.remove('muted');
                    newAudioToggle.title = 'Matikan Audio';
                    
                    // Ensure video is playing
                    const playPromise = backgroundVideo.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Video playing with audio');
                            this.updateStatus('Audio dihidupkan');
                        }).catch(error => {
                            console.log('Video play failed:', error);
                            this.updateStatus('Audio gagal dihidupkan');
                        });
                    }
                } else {
                    // Mute the video
                    backgroundVideo.muted = true;
                    newAudioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
                    newAudioToggle.classList.add('muted');
                    newAudioToggle.title = 'Hidupkan Audio';
                    
                    this.updateStatus('Audio dimatikan');
                }
            });
            
            // Handle video events
            backgroundVideo.addEventListener('loadeddata', () => {
                console.log('Video loaded successfully');
            });
            
            backgroundVideo.addEventListener('error', (e) => {
                console.error('Video error:', e);
                newAudioToggle.style.display = 'none'; // Hide button if video fails
            });
            
            // Handle autoplay policy
            backgroundVideo.addEventListener('canplay', () => {
                backgroundVideo.play().catch(error => {
                    console.log('Autoplay prevented:', error);
                });
            });
        } else {
            console.error('Audio toggle button or background video not found');
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

        // Input character count
        this.userInput.addEventListener("input", () => {
            const length = this.userInput.value.length;
            this.charCount.textContent = `${length}/6000`;
            
            if (length > 5500) {
                this.charCount.style.color = "#ff6b6b";
            } else if (length > 5000) {
                this.charCount.style.color = "#ffa726";
            } else {
                this.charCount.style.color = "#999";
            }
        });

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
        this.charCount.textContent = "0/6000";
        this.charCount.style.color = "#999";
        
        this.showTypingIndicator();
        this.updateStatus("AI sedang berpikir...");

        try {
            const response = await this.callGoogleAI(prompt);
            this.hideTypingIndicator();
            this.appendMessage("ai", response);
            this.updateStatus(`Mode: ${this.getModeDisplayName()} | Session: ${this.sessionId.slice(-8)}`);
            
            // Add to chat history
            this.chatHistory.push({
                user: prompt,
                ai: response,
                mode: this.aiModeSelect.value,
                timestamp: new Date().toISOString()
            });
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
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nUser: ${userMessage}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
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
            friendly: "Kamu adalah AI assistant yang sangat ramah dan bersahabat. Selalu gunakan bahasa Indonesia yang hangat dan penuh empati. Gunakan emoji yang sesuai untuk membuat percakapan lebih menyenangkan. Jawab dengan gaya yang santai tapi tetap informatif.",
            
            professional: "Kamu adalah AI assistant profesional yang memberikan jawaban yang terstruktur, akurat, dan formal. Gunakan bahasa Indonesia yang baku dan profesional. Berikan informasi yang komprehensif dan well-organized. Hindari penggunaan emoji dan bahasa casual.",
            
            creative: "Kamu adalah AI assistant yang sangat kreatif dan inovatif. Gunakan bahasa Indonesia yang ekspresif dan penuh imajinasi. Berikan jawaban yang out-of-the-box dan inspiratif. Gunakan analogi, metafora, dan pendekatan kreatif dalam menjelaskan sesuatu. Gunakan emoji kreatif untuk memperkaya respons.",
            
            casual: "Kamu adalah AI assistant yang santai dan gaul. Gunakan bahasa Indonesia yang casual, seperti bahasa anak muda zaman sekarang. Boleh pakai bahasa gaul yang wajar, singkatan, dan gaya bicara yang rileks. Buat suasana percakapan jadi chill dan menyenangkan.",
            
            technical: "Kamu adalah AI assistant yang fokus pada aspek teknis dan detail. Gunakan bahasa Indonesia yang presisi dan akurat. Berikan penjelasan yang mendalam, step-by-step, dan berbasis data. Sertakan contoh kode, spesifikasi teknis, atau referensi yang relevan jika diperlukan."
        };
        
        return prompts[mode] || prompts.friendly;
    }

    appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);
        
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = text;
        
        const messageInfo = document.createElement("div");
        messageInfo.classList.add("message-info");
        
        const timestamp = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (sender === "user") {
            messageInfo.innerHTML = `<i class="fas fa-user"></i> ${timestamp}`;
        } else {
            messageInfo.innerHTML = `<i class="fas fa-robot"></i> ${this.getModeDisplayName()} • ${timestamp}`;
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
        if (confirm("Apakah Anda yakin ingin menghapus semua percakapan?")) {
            this.chatBox.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>Selamat datang di AI Chatbot!</h3>
                    <p>Saya siap membantu Anda. Silakan ketik pesan untuk memulai percakapan.</p>
                    <div class="quick-actions">
                        <button class="quick-btn" data-message="Halo, apa kabar?">
                            <i class="fas fa-hand-wave"></i>
                            Sapa AI
                        </button>
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
            this.chatHistory = [];
            this.updateStatus("Chat berhasil dihapus");
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
            "Halo, apa kabar?",
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
}

// Global functions for modals
function showAbout() {
    document.getElementById('about-modal').style.display = 'block';
}

function showHelp() {
    document.getElementById('help-modal').style.display = 'block';
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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

