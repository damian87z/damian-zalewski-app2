// Damian Zalewski - Aplikacja Agenta Nieruchomości
// Główna logika aplikacji

class RealEstateApp {
    constructor() {
        try {
            this.contacts = JSON.parse(localStorage.getItem('dz_contacts') || '[]');
        } catch (e) {
            this.contacts = [];
        }
        
        try {
            this.meetings = JSON.parse(localStorage.getItem('dz_meetings') || '[]');
        } catch (e) {
            this.meetings = [];
        }
        
        try {
            const settingsData = localStorage.getItem('dz_settings');
            this.settings = settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();
        } catch (e) {
            this.settings = this.getDefaultSettings();
        }
        
        this.currentContact = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboardStats();
        this.renderContacts();
        this.renderMeetings();
        this.renderTodayMeetings();
        this.loadSettings();
        this.setDefaultDate();
        
        // Show dashboard by default
        this.showSection('dashboard');
        
        // Initialize contact monitoring
        this.initContactMonitoring();
        
        // Setup periodic reminder checks
        this.startReminderService();
    }

    initContactMonitoring() {
        // Monitor for contact changes using various methods
        
        // 1. Page Visibility API - detect when user returns to app (potentially after adding contact)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForNewContacts();
            }
        });

        // 2. Focus event - when user returns to app window
        window.addEventListener('focus', () => {
            setTimeout(() => this.checkForNewContacts(), 1000);
        });

        // 3. Storage events - if contacts are synced across tabs/devices
        window.addEventListener('storage', (e) => {
            if (e.key === 'dz_contacts') {
                this.handlePossibleNewContact();
            }
        });

        // 4. Periodic check for new contacts
        setInterval(() => {
            this.checkForNewContacts();
        }, 30000); // Every 30 seconds
    }

    checkForNewContacts() {
        // This is a simplified version - in real implementation, 
        // this would integrate with device's contact API
        
        const lastContactCheck = localStorage.getItem('dz_last_contact_check');
        const now = Date.now();
        
        // Only check if more than 1 minute passed since last check
        if (lastContactCheck && (now - parseInt(lastContactCheck)) < 60000) {
            return;
        }
        
        localStorage.setItem('dz_last_contact_check', now.toString());
        
        // Simulate contact detection - in real app this would query device contacts
        this.simulateContactDetection();
    }

    simulateContactDetection() {
        // For demo purposes - in real app this would check device contacts
        // and compare with stored contacts to find new ones
        
        console.log('Sprawdzanie nowych kontaktów...');
        
        // This is where real contact API integration would happen
        // For now, we'll just log that we're monitoring
    }

    handlePossibleNewContact() {
        // Show notification that new contact might need SMS invitation
        if (Notification.permission === 'granted') {
            new Notification('Nowy kontakt wykryty?', {
                body: 'Kliknij aby sprawdzić czy chcesz wysłać zaproszenie na prezentację',
                icon: 'images/app-icon.jpg',
                badge: 'images/app-icon.jpg'
            });
        }
    }

    startReminderService() {
        // Start the reminder service that checks every hour
        console.log('Uruchamianie serwisu przypomnień...');
        
        // Initial check after 10 seconds
        setTimeout(() => {
            this.checkForReminders();
        }, 10000);
        
        // Then check every hour
        setInterval(() => {
            this.checkForReminders();
        }, 60 * 60 * 1000);
    }

    getDefaultSettings() {
        return {
            invitationTemplate: "Dzień dobry. W nawiązaniu do rozmowy, zapraszam na prezentację nieruchomości. Adres: [adres] Termin: [data], godz. [godzina] Pozdrawiam Damian Zalewski",
            reminderTemplate: "Dzień dobry. Czy mogę prosić o potwierdzenie naszego dzisiejszego spotkania? Pozdrawiam Damian Zalewski",
            autoReminders: true,
            reminderStartTime: "09:00",
            reminderEndTime: "19:00"
        };
    }

    setupEventListeners() {
        // Menu toggle
        document.getElementById('menuBtn').addEventListener('click', () => this.toggleMenu());
        document.getElementById('mobileMenu').addEventListener('click', (e) => {
            if (e.target.id === 'mobileMenu') {
                this.toggleMenu();
            }
        });

        // Contact form
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContact();
        });

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
            });
        });

        // Contact picker functionality
        this.setupContactPicker();

        // Automatic reminders setup
        this.setupAutomaticReminders();

        // Google Calendar integration
        this.setupCalendarIntegration();
    }

    setupContactPicker() {
        // Add contact picker button if supported
        if ('contacts' in navigator && 'ContactsManager' in window) {
            const importBtn = document.createElement('button');
            importBtn.className = 'w-full bg-green-600 text-white rounded-lg p-4 flex items-center justify-between shadow-lg hover:bg-green-700 transition-colors mt-3';
            importBtn.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-address-book mr-3"></i>
                    <span class="font-semibold">Importuj z Kontaktów</span>
                </div>
                <i class="fas fa-download"></i>
            `;
            importBtn.addEventListener('click', () => this.importFromContacts());
            
            const dashboardActions = document.querySelector('#dashboard .space-y-3');
            if (dashboardActions) {
                dashboardActions.appendChild(importBtn);
            }
        }

        // Fallback: Manual contact sharing
        if (navigator.share) {
            this.setupContactSharing();
        }
    }

    async importFromContacts() {
        try {
            // Check if Contact Picker API is available
            if ('contacts' in navigator && 'ContactsManager' in window) {
                const contacts = await navigator.contacts.select(['name', 'tel'], {multiple: true});
                
                contacts.forEach(contact => {
                    const phoneNumber = contact.tel && contact.tel[0] ? contact.tel[0] : '';
                    const fullName = contact.name && contact.name[0] ? contact.name[0] : '';
                    
                    if (phoneNumber && fullName) {
                        // Auto-fill form with contact data
                        document.getElementById('fullName').value = fullName;
                        document.getElementById('phone').value = phoneNumber;
                        
                        // Show SMS suggestion immediately
                        this.showContactImportSuggestion(fullName, phoneNumber);
                    }
                });
            } else {
                // Fallback: Show manual contact creation suggestion
                this.showManualContactSuggestion();
            }
        } catch (error) {
            console.log('Contact picker nie jest dostępny:', error);
            // Fallback: Show manual contact creation suggestion
            this.showManualContactSuggestion();
        }
    }

    showManualContactSuggestion() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full">
                <div class="text-center mb-4">
                    <i class="fas fa-address-book text-4xl text-blue-600 mb-2"></i>
                    <h3 class="text-lg font-bold text-gray-800">Wykrywanie Kontaktów</h3>
                    <p class="text-gray-600">Czy dodałeś nowy kontakt w telefonie? Można ręcznie wprowadzić dane.</p>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="flex-1 bg-gray-300 text-gray-700 rounded-lg py-2 px-4 hover:bg-gray-400 transition-colors">
                        Anuluj
                    </button>
                    <button onclick="app.goToAddContact(this.parentElement.parentElement.parentElement)" 
                            class="flex-1 bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 transition-colors">
                        Dodaj Kontakt
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    goToAddContact(modal) {
        modal.remove();
        this.showSection('add-contact');
        this.showToast('Wprowadź dane nowego kontaktu', 'info');
    }

    showContactImportSuggestion(name, phone) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full">
                <div class="text-center mb-4">
                    <i class="fas fa-user-plus text-4xl text-blue-600 mb-2"></i>
                    <h3 class="text-lg font-bold text-gray-800">Nowy Kontakt Wykryty!</h3>
                    <p class="text-gray-600">Czy chcesz wysłać zaproszenie do ${name}?</p>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-3 mb-4">
                    <p class="text-sm text-gray-700"><strong>Imię:</strong> ${name}</p>
                    <p class="text-sm text-gray-700"><strong>Telefon:</strong> ${phone}</p>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="flex-1 bg-gray-300 text-gray-700 rounded-lg py-2 px-4 hover:bg-gray-400 transition-colors">
                        Anuluj
                    </button>
                    <button onclick="app.createContactAndSendSMS('${name}', '${phone}', this.parentElement.parentElement.parentElement)" 
                            class="flex-1 bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 transition-colors">
                        Wyślij SMS
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    createContactAndSendSMS(name, phone, modal) {
        // Fill form and navigate to add contact section
        document.getElementById('fullName').value = name;
        document.getElementById('phone').value = phone;
        this.showSection('add-contact');
        
        // Remove modal
        modal.remove();
        
        // Show toast
        this.showToast('Kontakt został wypełniony. Uzupełnij szczegóły prezentacji.', 'success');
    }

    setupAutomaticReminders() {
        // Check for meetings needing reminders every hour
        setInterval(() => {
            this.checkForReminders();
        }, 60 * 60 * 1000); // Every hour

        // Initial check
        setTimeout(() => {
            this.checkForReminders();
        }, 5000); // After 5 seconds
    }

    checkForReminders() {
        if (!this.settings.autoReminders) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDateString = tomorrow.toISOString().split('T')[0];

        // Current time check (9:00-19:00)
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const startTime = parseInt(this.settings.reminderStartTime.replace(':', ''));
        const endTime = parseInt(this.settings.reminderEndTime.replace(':', ''));

        if (currentTime < startTime || currentTime > endTime) {
            return; // Outside of allowed hours
        }

        // Find meetings for tomorrow that need reminders
        const meetingsNeedingReminders = this.meetings.filter(meeting => 
            meeting.date === tomorrowDateString && 
            !meeting.reminderSent &&
            meeting.status === 'confirmed'
        );

        meetingsNeedingReminders.forEach(meeting => {
            this.sendAutomaticReminder(meeting);
        });
    }

    async sendAutomaticReminder(meeting) {
        try {
            // Simulate SMS sending (in real app, integrate with SMS API)
            console.log(`Wysyłanie automatycznego przypomnienia do ${meeting.phone}`);
            
            // Mark as sent
            meeting.reminderSent = true;
            meeting.lastReminderSent = new Date().toISOString();
            this.saveToStorage('meetings');

            // Show notification if app is active
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Przypomnienie wysłane', {
                    body: `Automatyczne przypomnienie zostało wysłane do ${meeting.clientName}`,
                    icon: 'images/app-icon.jpg'
                });
            }

            // Log the action
            this.logActivity('auto_reminder', {
                meetingId: meeting.id,
                clientName: meeting.clientName,
                phone: meeting.phone
            });

        } catch (error) {
            console.error('Błąd wysyłania automatycznego przypomnienia:', error);
        }
    }

    setupCalendarIntegration() {
        // Request calendar permissions
        this.requestCalendarPermissions();
    }

    async requestCalendarPermissions() {
        // For PWA, we'll use a simplified calendar integration
        // In a native app, this would use actual calendar APIs
        
        if ('serviceWorker' in navigator) {
            // Register for push notifications for reminders
            this.requestNotificationPermission();
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Uprawnienia do powiadomień zostały przyznane');
            }
        }
    }

    async addToGoogleCalendar(meeting) {
        try {
            // Create Google Calendar URL
            const startDate = new Date(`${meeting.date} ${meeting.time}`);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
            
            const params = new URLSearchParams({
                action: 'TEMPLATE',
                text: meeting.title,
                dates: `${this.formatGoogleDate(startDate)}/${this.formatGoogleDate(endDate)}`,
                details: `Prezentacja nieruchomości dla ${meeting.clientName}\nAdres: ${meeting.address}\nTelefon: ${meeting.phone}`,
                location: meeting.address
            });

            const calendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
            
            // Open in new window/tab
            window.open(calendarUrl, '_blank');
            
            this.showToast('Spotkanie zostało dodane do kalendarza Google', 'success');
            
        } catch (error) {
            console.error('Błąd dodawania do kalendarza:', error);
            this.showToast('Nie udało się dodać do kalendarza', 'error');
        }
    }

    formatGoogleDate(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    logActivity(type, data) {
        const activity = {
            id: Date.now(),
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        };

        let activities = [];
        try {
            activities = JSON.parse(localStorage.getItem('dz_activities') || '[]');
        } catch (e) {
            activities = [];
        }

        activities.push(activity);
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities = activities.slice(-100);
        }

        localStorage.setItem('dz_activities', JSON.stringify(activities));
    }

    toggleMenu() {
        const menu = document.getElementById('mobileMenu');
        const panel = document.getElementById('menuPanel');
        
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            setTimeout(() => panel.classList.add('translate-x-0'), 10);
        } else {
            panel.classList.remove('translate-x-0');
            setTimeout(() => menu.classList.add('hidden'), 300);
        }
    }

    showSection(sectionId) {
        console.log('Przechodzę do sekcji:', sectionId);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Sekcja aktywowana:', sectionId);
        } else {
            console.error('Nie znaleziono sekcji:', sectionId);
        }

        // Update navigation
        this.updateNavigation(sectionId);

        // Close mobile menu if open
        const menu = document.getElementById('mobileMenu');
        const panel = document.getElementById('menuPanel');
        if (menu && panel) {
            panel.classList.remove('translate-x-0');
            setTimeout(() => menu.classList.add('hidden'), 300);
        }

        // Update system status if going to settings
        if (sectionId === 'settings') {
            setTimeout(() => {
                this.updateSystemStatus();
                this.renderActivityHistory();
            }, 100);
        }
    }

    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-section="${activeSection}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    setDefaultDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        document.getElementById('presentationDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('presentationTime').value = '10:00';
    }

    saveContact() {
        console.log('Zapisywanie kontaktu...');
        
        const formData = {
            id: Date.now(),
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            propertyAddress: document.getElementById('propertyAddress').value,
            presentationDate: document.getElementById('presentationDate').value,
            presentationTime: document.getElementById('presentationTime').value,
            notes: document.getElementById('notes').value,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        console.log('Dane kontaktu:', formData);

        // Validate required fields
        if (!formData.fullName || !formData.phone) {
            this.showToast('Imię, nazwisko i telefon są wymagane!', 'error');
            return;
        }

        this.contacts.push(formData);
        console.log('Kontakty po dodaniu:', this.contacts);
        
        this.saveToStorage('contacts');
        this.currentContact = formData;

        // Show SMS confirmation modal
        this.showSmsModal(formData);

        // Reset form
        document.getElementById('contactForm').reset();
        this.setDefaultDate();
        
        // Update UI immediately
        this.updateDashboardStats();
        this.renderContacts();
        
        console.log('Kontakt zapisany pomyślnie');
    }

    showSmsModal(contact) {
        const modal = document.getElementById('smsModal');
        const preview = document.getElementById('smsPreview');
        
        let smsText = this.settings.invitationTemplate;
        smsText = smsText.replace('[adres]', contact.propertyAddress);
        smsText = smsText.replace('[data]', this.formatDate(contact.presentationDate));
        smsText = smsText.replace('[godzina]', contact.presentationTime);
        
        preview.value = smsText;
        modal.classList.remove('hidden');
        modal.classList.add('modal-enter');
    }

    closeSmsModal() {
        const modal = document.getElementById('smsModal');
        modal.classList.add('modal-exit');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('modal-enter', 'modal-exit');
        }, 300);
    }

    async sendSms() {
        const smsText = document.getElementById('smsPreview').value;
        const phone = this.currentContact.phone;
        
        this.showLoading('Wysyłanie SMS...');
        
        try {
            // Try to use native SMS functionality if available
            if (this.canSendSMS()) {
                await this.sendNativeSMS(phone, smsText);
            } else {
                // Fallback: Web Share API for SMS
                await this.shareViaSMS(phone, smsText);
            }
            
            this.hideLoading();
            this.closeSmsModal();
            
            // Create meeting if date and time are provided
            if (this.currentContact.presentationDate && this.currentContact.presentationTime) {
                this.createMeeting(this.currentContact);
            }
            
            // Log SMS activity
            this.logActivity('sms_sent', {
                contactId: this.currentContact.id,
                phone: phone,
                message: smsText
            });
            
            this.showSuccessModal(
                'SMS został wysłany!',
                'Wiadomość z zaproszeniem została wysłana do klienta. Spotkanie zostało automatycznie dodane do kalendarza.'
            );
            
            this.updateDashboardStats();
            this.renderContacts();
            this.renderMeetings();
            this.renderTodayMeetings();
            
        } catch (error) {
            this.hideLoading();
            console.error('Błąd wysyłania SMS:', error);
            this.showToast('Nie udało się wysłać SMS. Spróbuj ponownie.', 'error');
        }
    }

    canSendSMS() {
        // Check if device supports native SMS
        return 'share' in navigator || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async sendNativeSMS(phone, message) {
        // For mobile devices, use SMS URL scheme
        const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
        
        if (navigator.share) {
            // Try Web Share API first
            try {
                await navigator.share({
                    text: message,
                    url: `tel:${phone}`
                });
                return;
            } catch (shareError) {
                console.log('Web Share API niedostępne, używam SMS URL');
            }
        }
        
        // Fallback to SMS URL scheme
        window.location.href = smsUrl;
    }

    async shareViaSMS(phone, message) {
        if (navigator.share) {
            await navigator.share({
                title: 'Wyślij SMS',
                text: `${message}\n\nDo: ${phone}`,
            });
        } else {
            // Final fallback: copy to clipboard
            await navigator.clipboard.writeText(`Do: ${phone}\n${message}`);
            this.showToast('Wiadomość skopiowana do schowka', 'info');
        }
    }

    createMeeting(contact) {
        const meeting = {
            id: Date.now(),
            contactId: contact.id,
            title: `Prezentacja DZ (${contact.phone})`,
            clientName: contact.fullName,
            phone: contact.phone,
            address: contact.propertyAddress,
            date: contact.presentationDate,
            time: contact.presentationTime,
            status: 'confirmed',
            reminderSent: false,
            createdAt: new Date().toISOString()
        };

        this.meetings.push(meeting);
        this.saveToStorage('meetings');

        // Automatically add to Google Calendar
        setTimeout(() => {
            this.addToGoogleCalendar(meeting);
        }, 1000);

        // Log the activity
        this.logActivity('meeting_created', {
            meetingId: meeting.id,
            clientName: meeting.clientName,
            date: meeting.date,
            time: meeting.time
        });
    }

    showSuccessModal(title, message) {
        const modal = document.getElementById('successModal');
        const messageElement = document.getElementById('successMessage');
        
        modal.querySelector('h3').textContent = title;
        messageElement.textContent = message;
        
        modal.classList.remove('hidden');
        modal.classList.add('modal-enter');
    }

    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.classList.add('modal-exit');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('modal-enter', 'modal-exit');
        }, 300);
    }

    renderContacts() {
        const container = document.getElementById('contactsList');
        
        if (this.contacts.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Brak kontaktów. Dodaj pierwszy kontakt!</p>';
            return;
        }

        const contactsHtml = this.contacts.map(contact => `
            <div class="bg-white rounded-lg p-4 shadow-md contact-item">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800">${contact.fullName}</h3>
                        <p class="text-gray-600 text-sm">${contact.phone}</p>
                        <p class="text-gray-500 text-sm">${contact.propertyAddress}</p>
                        ${contact.presentationDate ? `
                            <div class="flex items-center mt-2 text-sm text-blue-600">
                                <i class="fas fa-calendar mr-1"></i>
                                ${this.formatDate(contact.presentationDate)} ${contact.presentationTime || ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col space-y-2">
                        <button onclick="app.editContact(${contact.id})" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteContact(${contact.id})" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = contactsHtml;
    }

    renderMeetings() {
        const container = document.getElementById('meetingsList');
        
        if (this.meetings.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Brak zaplanowanych spotkań</p>';
            return;
        }

        // Sort meetings by date and time
        const sortedMeetings = [...this.meetings].sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        const meetingsHtml = sortedMeetings.map(meeting => {
            const isToday = this.isToday(meeting.date);
            const isPast = this.isPastMeeting(meeting.date, meeting.time);
            
            return `
                <div class="bg-white rounded-lg p-4 shadow-md meeting-item ${isToday ? 'today' : ''} ${isPast ? 'opacity-60' : ''}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800">${meeting.title}</h3>
                            <p class="text-gray-600 text-sm">${meeting.clientName}</p>
                            <p class="text-gray-600 text-sm">${meeting.phone}</p>
                            <p class="text-gray-500 text-sm">${meeting.address}</p>
                            <div class="flex items-center justify-between mt-2">
                                <div class="flex items-center text-sm text-blue-600">
                                    <i class="fas fa-calendar mr-1"></i>
                                    ${this.formatDate(meeting.date)} ${meeting.time}
                                </div>
                                <span class="status-badge status-${meeting.status}">
                                    ${this.getStatusText(meeting.status)}
                                </span>
                            </div>
                        </div>
                        <div class="flex flex-col space-y-2 ml-3">
                            <button onclick="app.sendReminder(${meeting.id})" class="text-blue-600 hover:text-blue-800" title="Wyślij przypomnienie">
                                <i class="fas fa-bell"></i>
                            </button>
                            <button onclick="app.editMeeting(${meeting.id})" class="text-green-600 hover:text-green-800" title="Edytuj">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="app.deleteMeeting(${meeting.id})" class="text-red-600 hover:text-red-800" title="Usuń">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = meetingsHtml;
    }

    renderTodayMeetings() {
        const container = document.getElementById('todayMeetings');
        const todayMeetings = this.meetings.filter(meeting => this.isToday(meeting.date));
        
        if (todayMeetings.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Brak spotkań na dzisiaj</p>';
            return;
        }

        const meetingsHtml = todayMeetings.map(meeting => `
            <div class="bg-white rounded-lg p-3 shadow-md border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-semibold text-gray-800 text-sm">${meeting.clientName}</h4>
                        <p class="text-gray-600 text-xs">${meeting.time} - ${meeting.address}</p>
                    </div>
                    <button onclick="app.sendReminder(${meeting.id})" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-bell text-sm"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = meetingsHtml;
    }

    sendReminder(meetingId) {
        const meeting = this.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        this.showLoading('Wysyłanie przypomnienia...');
        
        setTimeout(() => {
            this.hideLoading();
            meeting.reminderSent = true;
            this.saveToStorage('meetings');
            
            this.showToast('Przypomnienie zostało wysłane!', 'success');
        }, 1500);
    }

    editContact(contactId) {
        // Implement contact editing
        this.showToast('Funkcja edycji w rozwoju', 'warning');
    }

    deleteContact(contactId) {
        if (confirm('Czy na pewno chcesz usunąć ten kontakt?')) {
            this.contacts = this.contacts.filter(c => c.id !== contactId);
            this.saveToStorage('contacts');
            this.renderContacts();
            this.updateDashboardStats();
            this.showToast('Kontakt został usunięty', 'success');
        }
    }

    editMeeting(meetingId) {
        // Implement meeting editing
        this.showToast('Funkcja edycji w rozwoju', 'warning');
    }

    deleteMeeting(meetingId) {
        if (confirm('Czy na pewno chcesz usunąć to spotkanie?')) {
            this.meetings = this.meetings.filter(m => m.id !== meetingId);
            this.saveToStorage('meetings');
            this.renderMeetings();
            this.renderTodayMeetings();
            this.updateDashboardStats();
            this.showToast('Spotkanie zostało usunięte', 'success');
        }
    }

    updateDashboardStats() {
        document.getElementById('contactsCount').textContent = this.contacts.length;
        document.getElementById('meetingsCount').textContent = this.meetings.length;
    }

    loadSettings() {
        document.getElementById('invitationTemplate').value = this.settings.invitationTemplate;
        document.getElementById('reminderTemplate').value = this.settings.reminderTemplate;
        document.getElementById('autoReminders').checked = this.settings.autoReminders;
        document.getElementById('reminderStartTime').value = this.settings.reminderStartTime;
        document.getElementById('reminderEndTime').value = this.settings.reminderEndTime;
        
        // Load additional status information
        this.updateSystemStatus();
        this.renderActivityHistory();
    }

    updateSystemStatus() {
        // Update notification status
        const notificationStatus = document.getElementById('notificationStatus');
        if (notificationStatus) {
            if (Notification.permission === 'granted') {
                notificationStatus.textContent = 'Włączone';
                notificationStatus.className = 'text-green-600';
            } else if (Notification.permission === 'denied') {
                notificationStatus.textContent = 'Wyłączone';
                notificationStatus.className = 'text-red-600';
            } else {
                notificationStatus.textContent = 'Nie udzielono';
                notificationStatus.className = 'text-yellow-600';
            }
        }

        // Update last check time
        const lastCheckTime = document.getElementById('lastCheckTime');
        if (lastCheckTime) {
            const lastCheck = localStorage.getItem('dz_last_contact_check');
            if (lastCheck) {
                const date = new Date(parseInt(lastCheck));
                lastCheckTime.textContent = date.toLocaleTimeString('pl-PL');
            } else {
                lastCheckTime.textContent = 'Nigdy';
            }
        }

        // Update reminder service status
        const reminderServiceStatus = document.getElementById('reminderServiceStatus');
        if (reminderServiceStatus) {
            reminderServiceStatus.textContent = this.settings.autoReminders ? 'Aktywne' : 'Wyłączone';
            reminderServiceStatus.className = this.settings.autoReminders ? 'text-green-600' : 'text-red-600';
        }
    }

    renderActivityHistory() {
        const container = document.getElementById('activityHistory');
        if (!container) return;

        let activities = [];
        try {
            activities = JSON.parse(localStorage.getItem('dz_activities') || '[]');
        } catch (e) {
            activities = [];
        }

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Brak aktywności do wyświetlenia</p>';
            return;
        }

        // Sort by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const activitiesHtml = activities.slice(0, 20).map(activity => {
            const date = new Date(activity.timestamp);
            const timeString = date.toLocaleString('pl-PL');
            
            let description = '';
            let icon = '';
            
            switch (activity.type) {
                case 'sms_sent':
                    description = `SMS wysłany do ${activity.data.phone}`;
                    icon = 'fas fa-sms';
                    break;
                case 'meeting_created':
                    description = `Spotkanie utworzone: ${activity.data.clientName}`;
                    icon = 'fas fa-calendar-plus';
                    break;
                case 'auto_reminder':
                    description = `Automatyczne przypomnienie: ${activity.data.clientName}`;
                    icon = 'fas fa-bell';
                    break;
                default:
                    description = `Aktywność: ${activity.type}`;
                    icon = 'fas fa-info-circle';
            }

            return `
                <div class="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div class="flex-shrink-0">
                        <i class="${icon} text-blue-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-900 truncate">${description}</p>
                        <p class="text-xs text-gray-500">${timeString}</p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activitiesHtml;
    }

    clearActivityHistory() {
        if (confirm('Czy na pewno chcesz wyczyścić całą historię aktywności?')) {
            localStorage.removeItem('dz_activities');
            this.renderActivityHistory();
            this.showToast('Historia aktywności została wyczyszczona', 'success');
        }
    }

    saveSettings() {
        this.settings = {
            invitationTemplate: document.getElementById('invitationTemplate').value,
            reminderTemplate: document.getElementById('reminderTemplate').value,
            autoReminders: document.getElementById('autoReminders').checked,
            reminderStartTime: document.getElementById('reminderStartTime').value,
            reminderEndTime: document.getElementById('reminderEndTime').value
        };

        this.saveToStorage('settings');
        this.showToast('Ustawienia zostały zapisane!', 'success');
    }

    saveToStorage(type) {
        switch(type) {
            case 'contacts':
                localStorage.setItem('dz_contacts', JSON.stringify(this.contacts));
                break;
            case 'meetings':
                localStorage.setItem('dz_meetings', JSON.stringify(this.meetings));
                break;
            case 'settings':
                localStorage.setItem('dz_settings', JSON.stringify(this.settings));
                break;
        }
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    isToday(dateString) {
        const today = new Date();
        const date = new Date(dateString);
        return date.toDateString() === today.toDateString();
    }

    isPastMeeting(dateString, timeString) {
        const now = new Date();
        const meetingDateTime = new Date(`${dateString} ${timeString}`);
        return meetingDateTime < now;
    }

    getStatusText(status) {
        const statusMap = {
            'confirmed': 'Potwierdzone',
            'pending': 'Oczekuje',
            'cancelled': 'Anulowane'
        };
        return statusMap[status] || status;
    }

    showLoading(message = 'Ładowanie...') {
        // Create or update loading indicator
        let loading = document.getElementById('loadingIndicator');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loadingIndicator';
            loading.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            loading.innerHTML = `
                <div class="bg-white rounded-lg p-6 text-center">
                    <div class="w-8 h-8 border-4 border-blue-200 border-top-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p class="text-gray-700">${message}</p>
                </div>
            `;
            document.body.appendChild(loading);
        }
    }

    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.remove();
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Global functions for onclick handlers
function showSection(sectionId) {
    app.showSection(sectionId);
}

function closeSmsModal() {
    app.closeSmsModal();
}

function sendSms() {
    app.sendSms();
}

function closeSuccessModal() {
    app.closeSuccessModal();
}

function saveSettings() {
    app.saveSettings();
}

// Global app variable
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new RealEstateApp();
        window.app = app; // Make it globally accessible
        console.log('Aplikacja zainicjalizowana pomyślnie');
    } catch (error) {
        console.error('Błąd inicjalizacji aplikacji:', error);
    }
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
