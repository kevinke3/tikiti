// DOM Elements
const eventsGrid = document.getElementById('eventsGrid');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const mobileMenu = document.querySelector('.mobile-menu');
const nav = document.querySelector('nav');

// Global variables
let events = [];
let currentUser = null;

// Modal Manager Class
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.currentModal = null;
    }
    
    register(id, element) {
        this.modals.set(id, element);
    }
    
    open(id) {
        this.closeCurrent();
        const modal = this.modals.get(id);
        if (modal) {
            modal.style.display = 'flex';
            this.currentModal = id;
        }
    }
    
    closeCurrent() {
        if (this.currentModal) {
            const modal = this.modals.get(this.currentModal);
            if (modal) {
                modal.style.display = 'none';
            }
        }
    }
    
    closeAll() {
        this.modals.forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentModal = null;
    }
    
    close(modal) {
        if (modal) {
            modal.style.display = 'none';
            if (this.currentModal === modal.id) {
                this.currentModal = null;
            }
        }
    }
}

const modalManager = new ModalManager();

// API Helper Functions
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Call failed:', error);
        throw error;
    }
}

// Form Validation Helper
function validateForm(formData, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        
        if (rule.required && (!value || value.toString().trim() === '')) {
            errors.push(`${field} is required`);
        }
        
        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        
        if (rule.pattern && value && !rule.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
        }
        
        if (rule.min && value && parseFloat(value) < rule.min) {
            errors.push(`${field} must be at least ${rule.min}`);
        }
    }
    
    return errors;
}

// Loading State Management
function setLoading(element, isLoading, originalContent = null) {
    if (isLoading) {
        element.dataset.originalContent = originalContent || element.innerHTML;
        element.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        element.disabled = true;
    } else {
        element.innerHTML = element.dataset.originalContent || originalContent;
        element.disabled = false;
        delete element.dataset.originalContent;
    }
}

// Local Storage Management
function saveUserPreferences(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function loadUserPreferences() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function clearUserPreferences() {
    localStorage.removeItem('currentUser');
}

// Debounce Helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event Management
async function loadEvents() {
    try {
        const loadingElement = eventsGrid;
        setLoading(loadingElement, true, loadingElement.innerHTML);
        
        events = await apiCall('/api/events');
        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        loadSampleEvents();
    }
}

function loadSampleEvents() {
    events = [
        {
            id: 1,
            title: "Nairobi Music Festival",
            category: "Music",
            date: "2023-12-15T18:00:00",
            location: "Carnivore Grounds, Nairobi",
            price: 1500,
            image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80"
        },
        {
            id: 2,
            title: "Tech Innovation Summit",
            category: "Conference",
            date: "2023-12-20T09:00:00",
            location: "KICC, Nairobi",
            price: 3000,
            image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80"
        }
    ];
    renderEvents();
}

function renderEvents() {
    if (!eventsGrid) return;
    
    eventsGrid.innerHTML = '';
    
    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--gray);">No events found</h3>
                <p>Check back later for upcoming events.</p>
            </div>
        `;
        return;
    }
    
    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.setAttribute('data-event-id', event.id);
        eventCard.innerHTML = `
            <img src="${event.image_url || event.image}" alt="${event.title}" class="event-image">
            <div class="event-content">
                <span class="event-category">${event.category}</span>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-date">
                    <i class="far fa-calendar"></i>
                    <span>${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="event-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location}</span>
                </div>
                <div class="event-price">KSh ${event.price.toLocaleString()}</div>
                <div class="event-actions">
                    <button class="btn btn-outline details-btn" style="color: var(--primary); border-color: var(--primary);">Details</button>
                    <button class="btn btn-primary book-btn">Book Now</button>
                </div>
            </div>
        `;
        eventsGrid.appendChild(eventCard);
    });
    
    attachEventListeners();
}

// Event Listeners Management
function attachEventListeners() {
    // Use event delegation for dynamic content
    eventsGrid.addEventListener('click', function(e) {
        const bookBtn = e.target.closest('.book-btn');
        const detailsBtn = e.target.closest('.details-btn');
        
        if (bookBtn) {
            handleBookButtonClick(bookBtn);
        }
        
        if (detailsBtn) {
            handleDetailsButtonClick(detailsBtn);
        }
    });
}

async function handleBookButtonClick(button) {
    const eventCard = button.closest('.event-card');
    const eventId = eventCard.getAttribute('data-event-id');
    const eventTitle = eventCard.querySelector('.event-title').textContent;
    const eventPrice = parseFloat(eventCard.querySelector('.event-price').textContent.replace(/[^\d.]/g, ''));
    
    try {
        const user = await apiCall('/api/user/profile');
        
        const quantity = prompt(`How many tickets for "${eventTitle}"?\nPrice per ticket: KSh ${eventPrice.toLocaleString()}`, '1');
        if (quantity && !isNaN(quantity) && quantity > 0) {
            setLoading(button, true);
            
            try {
                const data = await apiCall('/api/tickets/book', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        event_id: parseInt(eventId), 
                        quantity: parseInt(quantity) 
                    })
                });
                
                const totalPrice = eventPrice * quantity;
                alert(`Ticket reserved successfully!\n\nPlease complete payment to get your ticket.`);
                openPaymentModal(eventId, data.ticket_id, totalPrice, eventTitle);
            } finally {
                setLoading(button, false);
            }
        }
    } catch (error) {
        alert('Please login to book tickets');
        modalManager.open('loginModal');
    }
}

function handleDetailsButtonClick(button) {
    const eventCard = button.closest('.event-card');
    const eventTitle = eventCard.querySelector('.event-title').textContent;
    const eventDate = eventCard.querySelector('.event-date span').textContent;
    const eventLocation = eventCard.querySelector('.event-location span').textContent;
    const eventPrice = eventCard.querySelector('.event-price').textContent;
    
    alert(`Event Details:\n\n${eventTitle}\n\n📅 ${eventDate}\n📍 ${eventLocation}\n💰 ${eventPrice}\n\nClick "Book Now" to reserve your tickets!`);
}

// Modal Functions
function openModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        // Clear form fields when closing modal
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
}

// Initialize Modal Manager
function initializeModals() {
    // Register existing modals
    if (loginModal) modalManager.register('loginModal', loginModal);
    if (registerModal) modalManager.register('registerModal', registerModal);
    
    // Add event listeners for modal buttons
    if (loginBtn) loginBtn.addEventListener('click', () => modalManager.open('loginModal'));
    if (registerBtn) registerBtn.addEventListener('click', () => modalManager.open('registerModal'));
    
    // Close modal buttons
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalManager.closeAll();
        });
    });
    
    // Modal switches
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            modalManager.closeCurrent();
            modalManager.open('registerModal');
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            modalManager.closeCurrent();
            modalManager.open('loginModal');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        modalManager.modals.forEach((modal, id) => {
            if (e.target === modal) {
                modalManager.close(modal);
            }
        });
    });
}

// Mobile menu toggle
if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
}

// Form submission - Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        setLoading(submitBtn, true);
        
        try {
            const data = await apiCall('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            alert('Login successful!');
            modalManager.closeAll();
            updateAuthUI(data.user);
            currentUser = data.user;
            saveUserPreferences(data.user);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

// Form submission - Register
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;
        
        // Validation
        const errors = validateForm(
            { name, email, password, role },
            {
                name: { required: true, minLength: 2 },
                email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
                password: { required: true, minLength: 6 },
                role: { required: true }
            }
        );
        
        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        setLoading(submitBtn, true);
        
        try {
            const data = await apiCall('/api/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role })
            });
            
            alert('Registration successful! You can now login.');
            modalManager.closeAll();
            // Auto-fill login form
            if (document.getElementById('loginEmail')) {
                document.getElementById('loginEmail').value = email;
            }
            modalManager.open('loginModal');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

// Authentication UI Management
function updateAuthUI(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (user) {
        authButtons.innerHTML = `
            <button class="btn btn-outline" id="myTicketsBtn" style="margin-right: 1rem;">
                <i class="fas fa-ticket-alt"></i> My Tickets
            </button>
            ${(user.role === 'organizer' || user.role === 'admin') ? 
                `<button class="btn btn-outline" id="organizerDashboardBtn" style="margin-right: 1rem;">
                    <i class="fas fa-chart-bar"></i> Dashboard
                </button>` : ''
            }
            <span style="color: white; margin-right: 1rem;">
                <i class="fas fa-user"></i> ${user.name}
                ${user.role === 'organizer' ? ' (Organizer)' : ''}
                ${user.role === 'admin' ? ' (Admin)' : ''}
            </span>
            <button class="btn btn-outline" id="logoutBtn">Logout</button>
        `;
        
        document.getElementById('myTicketsBtn').addEventListener('click', openTicketsModal);
        document.getElementById('logoutBtn').addEventListener('click', logout);
        
        if (user.role === 'organizer' || user.role === 'admin') {
            document.getElementById('organizerDashboardBtn').addEventListener('click', openOrganizerDashboard);
            showCreateEventButton();
        }
    } else {
        authButtons.innerHTML = `
            <button class="btn btn-outline" id="loginBtn">Login</button>
            <button class="btn btn-primary" id="registerBtn">Register</button>
        `;
        // Re-attach event listeners to new buttons
        document.getElementById('loginBtn').addEventListener('click', () => modalManager.open('loginModal'));
        document.getElementById('registerBtn').addEventListener('click', () => modalManager.open('registerModal'));
        
        // Hide create event button
        hideCreateEventButton();
    }
}

// Create Event Management
function showCreateEventButton() {
    let createEventBtn = document.getElementById('createEventBtn');
    if (!createEventBtn) {
        createEventBtn = document.createElement('button');
        createEventBtn.id = 'createEventBtn';
        createEventBtn.className = 'btn btn-primary';
        createEventBtn.innerHTML = '<i class="fas fa-plus"></i> Create Event';
        createEventBtn.style.marginRight = '1rem';
        createEventBtn.addEventListener('click', openCreateEventModal);
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            headerContent.insertBefore(createEventBtn, document.querySelector('.auth-buttons'));
        }
    }
}

function hideCreateEventButton() {
    const createEventBtn = document.getElementById('createEventBtn');
    if (createEventBtn) {
        createEventBtn.remove();
    }
}

function openCreateEventModal() {
    let createEventModal = document.getElementById('createEventModal');
    if (!createEventModal) {
        createEventModal = document.createElement('div');
        createEventModal.id = 'createEventModal';
        createEventModal.className = 'modal';
        createEventModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <span class="close-modal">&times;</span>
                <h2>Create New Event</h2>
                <form id="createEventForm">
                    <div class="form-group">
                        <label for="eventTitle">Event Title</label>
                        <input type="text" id="eventTitle" class="form-control" placeholder="Enter event title" required>
                    </div>
                    <div class="form-group">
                        <label for="eventDescription">Description</label>
                        <textarea id="eventDescription" class="form-control" placeholder="Describe your event" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="eventCategory">Category</label>
                        <select id="eventCategory" class="form-control" required>
                            <option value="">Select category</option>
                            <option value="Music">Music</option>
                            <option value="Conference">Conference</option>
                            <option value="Art">Art</option>
                            <option value="Food & Drink">Food & Drink</option>
                            <option value="Sports">Sports</option>
                            <option value="Comedy">Comedy</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Networking">Networking</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="eventDate">Date & Time</label>
                        <input type="datetime-local" id="eventDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="eventLocation">Location</label>
                        <input type="text" id="eventLocation" class="form-control" placeholder="Enter event location" required>
                    </div>
                    <div class="form-group">
                        <label for="eventPrice">Ticket Price (KSh)</label>
                        <input type="number" id="eventPrice" class="form-control" placeholder="Enter ticket price" min="0" step="100" required>
                    </div>
                    <div class="form-group">
                        <label for="eventCapacity">Capacity</label>
                        <input type="number" id="eventCapacity" class="form-control" placeholder="Maximum attendees" min="1" required>
                    </div>
                    
                    <!-- Payment Information Section -->
                    <div style="background: var(--light-gray); padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                        <h3 style="color: var(--primary); margin-bottom: 1rem;">Payment Information</h3>
                        <div class="form-group">
                            <label for="tillNumber">Till Number *</label>
                            <input type="text" id="tillNumber" class="form-control" placeholder="e.g., 123456" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentName">Payment Name *</label>
                            <input type="text" id="paymentName" class="form-control" placeholder="e.g., MPESA Buy Goods" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentInstructions">Payment Instructions</label>
                            <textarea id="paymentInstructions" class="form-control" placeholder="Instructions for attendees..." rows="2">Pay to the till number above and include your name as reference</textarea>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="eventImage">Image URL</label>
                        <input type="url" id="eventImage" class="form-control" placeholder="https://example.com/image.jpg">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Create Event</button>
                </form>
            </div>
        `;
        document.body.appendChild(createEventModal);
        modalManager.register('createEventModal', createEventModal);
        
        document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
        createEventModal.querySelector('.close-modal').addEventListener('click', () => {
            modalManager.close(createEventModal);
        });
    }
    
    const today = new Date().toISOString().slice(0, 16);
    document.getElementById('eventDate').min = today;
    modalManager.open('createEventModal');
}

async function handleCreateEvent(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        category: document.getElementById('eventCategory').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        price: parseFloat(document.getElementById('eventPrice').value),
        capacity: parseInt(document.getElementById('eventCapacity').value),
        image_url: document.getElementById('eventImage').value || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        till_number: document.getElementById('tillNumber').value,
        payment_name: document.getElementById('paymentName').value,
        payment_instructions: document.getElementById('paymentInstructions').value
    };
    
    // Validation
    const errors = validateForm(formData, {
        title: { required: true, minLength: 5 },
        description: { required: true, minLength: 10 },
        category: { required: true },
        date: { required: true },
        location: { required: true },
        price: { required: true, min: 0 },
        capacity: { required: true, min: 1 },
        till_number: { required: true, minLength: 5 },
        payment_name: { required: true, minLength: 3 }
    });
    
    if (errors.length > 0) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);
    
    try {
        const data = await apiCall('/api/events/create', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        alert('Event created successfully!');
        modalManager.closeAll();
        document.getElementById('createEventForm').reset();
        loadEvents();
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        setLoading(submitBtn, false);
    }
}

// Payment Flow Management
function openPaymentModal(eventId, ticketId, totalPrice, eventTitle) {
    let paymentModal = document.getElementById('paymentModal');
    if (!paymentModal) {
        paymentModal = document.createElement('div');
        paymentModal.id = 'paymentModal';
        paymentModal.className = 'modal';
        paymentModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal">&times;</span>
                <h2>Complete Payment</h2>
                <div id="paymentSteps">
                    <div id="step1">
                        <h3>Payment Instructions</h3>
                        <div id="paymentInstructions" style="background: var(--light-gray); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <p>Loading payment instructions...</p>
                        </div>
                        <p><strong>Total Amount: KSh <span id="paymentAmount">${totalPrice.toLocaleString()}</span></strong></p>
                        <button class="btn btn-primary" id="proceedToPayment">I Have Paid</button>
                    </div>
                    
                    <div id="step2" style="display: none;">
                        <h3>Submit Payment Proof</h3>
                        <div class="form-group">
                            <label for="paymentReference">Payment Reference/Code *</label>
                            <input type="text" id="paymentReference" class="form-control" placeholder="Enter M-PESA transaction code" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentMethod">Payment Method *</label>
                            <select id="paymentMethod" class="form-control" required>
                                <option value="MPESA">MPESA</option>
                                <option value="Airtel Money">Airtel Money</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="submitPayment">Submit Payment</button>
                    </div>
                    
                    <div id="step3" style="display: none; text-align: center;">
                        <div style="color: var(--warning); font-size: 4rem; margin-bottom: 1rem;">⏳</div>
                        <h3>Payment Submitted!</h3>
                        <p>Your payment is being verified. You'll receive a confirmation message soon.</p>
                        <p><strong>Status: <span style="color: var(--warning);">Pending Confirmation</span></strong></p>
                        <button class="btn btn-primary" id="closePaymentModal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(paymentModal);
        modalManager.register('paymentModal', paymentModal);
        
        paymentModal.querySelector('.close-modal').addEventListener('click', () => {
            modalManager.close(paymentModal);
        });
        
        document.getElementById('proceedToPayment').addEventListener('click', () => {
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        });
        
        document.getElementById('submitPayment').addEventListener('click', () => submitPaymentProof(ticketId));
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            modalManager.close(paymentModal);
            loadUserTickets();
        });
    }
    
    loadPaymentInstructions(eventId, totalPrice, eventTitle);
    modalManager.open('paymentModal');
}

async function loadPaymentInstructions(eventId, totalPrice, eventTitle) {
    try {
        const paymentInfo = await apiCall(`/api/events/${eventId}/payment-info`);
        document.getElementById('paymentInstructions').innerHTML = `
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Amount:</strong> KSh ${totalPrice.toLocaleString()}</p>
            <p><strong>Till Number/ Send money:</strong> ${paymentInfo.till_number}</p>
            <p><strong>Account Name:</strong> ${paymentInfo.payment_name}</p>
            <p><strong>Instructions:</strong> ${paymentInfo.payment_instructions}</p>
        `;
    } catch (error) {
        document.getElementById('paymentInstructions').innerHTML = '<p>Error loading payment instructions</p>';
    }
}

async function submitPaymentProof(ticketId) {
    const reference = document.getElementById('paymentReference').value;
    const method = document.getElementById('paymentMethod').value;
    
    if (!reference) {
        alert('Please enter your payment reference');
        return;
    }
    
    const submitBtn = document.getElementById('submitPayment');
    setLoading(submitBtn, true);
    
    try {
        await apiCall(`/api/tickets/${ticketId}/submit-payment`, {
            method: 'POST',
            body: JSON.stringify({
                payment_reference: reference,
                payment_method: method
            })
        });
        
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'block';
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        setLoading(submitBtn, false);
    }
}

// Ticket Management
function openTicketsModal() {
    let ticketsModal = document.getElementById('ticketsModal');
    if (!ticketsModal) {
        ticketsModal = document.createElement('div');
        ticketsModal.id = 'ticketsModal';
        ticketsModal.className = 'modal';
        ticketsModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-modal">&times;</span>
                <h2>My Tickets</h2>
                <div id="ticketsList" style="max-height: 400px; overflow-y: auto;">
                    Loading tickets...
                </div>
            </div>
        `;
        document.body.appendChild(ticketsModal);
        modalManager.register('ticketsModal', ticketsModal);
        
        ticketsModal.querySelector('.close-modal').addEventListener('click', () => {
            modalManager.close(ticketsModal);
        });
    }
    
    loadUserTickets();
    modalManager.open('ticketsModal');
}

async function loadUserTickets() {
    try {
        const tickets = await apiCall('/api/user/tickets');
        displayTickets(tickets);
    } catch (error) {
        document.getElementById('ticketsList').innerHTML = '<p>Error loading tickets</p>';
    }
}

function displayTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p>No tickets found.</p>';
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => `
        <div class="ticket-item">
            <h4>${ticket.event_title}</h4>
            <p>Date: ${new Date(ticket.event_date).toLocaleDateString()}</p>
            <p>Location: ${ticket.event_location}</p>
            <p>Tickets: ${ticket.quantity} | Total: KSh ${ticket.total_price.toLocaleString()}</p>
            <p>Status: 
                <span style="color: ${
                    ticket.payment_status === 'paid' ? 'var(--success)' : 
                    ticket.payment_status === 'pending' ? 'var(--warning)' : 'var(--danger)'
                }; font-weight: bold;">
                    ${ticket.payment_status.toUpperCase()}
                </span>
            </p>
            <p>Reference: ${ticket.booking_reference}</p>
            ${ticket.payment_status === 'paid' ? `
                <button class="btn btn-primary view-ticket-btn" data-ticket-id="${ticket.id}">
                    <i class="fas fa-ticket-alt"></i> View & Print Ticket
                </button>
            ` : ticket.payment_status === 'pending' ? `
                <p style="color: var(--warning);"><i class="fas fa-clock"></i> Waiting for organizer confirmation</p>
            ` : `
                <button class="btn btn-outline complete-payment-btn" data-event-id="${ticket.event_id}" data-ticket-id="${ticket.id}" data-total-price="${ticket.total_price}" data-event-title="${ticket.event_title}">
                    Complete Payment
                </button>
            `}
        </div>
    `).join('');
    
    // Add event listeners using event delegation
    ticketsList.addEventListener('click', function(e) {
        const viewBtn = e.target.closest('.view-ticket-btn');
        const paymentBtn = e.target.closest('.complete-payment-btn');
        
        if (viewBtn) {
            const ticketId = viewBtn.getAttribute('data-ticket-id');
            const ticket = tickets.find(t => t.id == ticketId);
            if (ticket) {
                openTicketView(ticket);
            }
        }
        
        if (paymentBtn) {
            const eventId = paymentBtn.getAttribute('data-event-id');
            const ticketId = paymentBtn.getAttribute('data-ticket-id');
            const totalPrice = paymentBtn.getAttribute('data-total-price');
            const eventTitle = paymentBtn.getAttribute('data-event-title');
            openPaymentModal(eventId, ticketId, parseFloat(totalPrice), eventTitle);
        }
    });
}

function openTicketView(ticket) {
    let ticketModal = document.getElementById('ticketModal');
    if (!ticketModal) {
        ticketModal = document.createElement('div');
        ticketModal.id = 'ticketModal';
        ticketModal.className = 'modal';
        ticketModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <span class="close-modal">&times;</span>
                <div id="ticketContent" style="border: 2px solid var(--primary); padding: 2rem; border-radius: 10px; background: white;">
                    <!-- Ticket content will be loaded here -->
                </div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" id="printTicket">Print Ticket</button>
                    <button class="btn btn-outline" id="downloadTicket">Download</button>
                </div>
            </div>
        `;
        document.body.appendChild(ticketModal);
        modalManager.register('ticketModal', ticketModal);
        
        ticketModal.querySelector('.close-modal').addEventListener('click', () => {
            modalManager.close(ticketModal);
        });
        
        document.getElementById('printTicket').addEventListener('click', printTicket);
        document.getElementById('downloadTicket').addEventListener('click', downloadTicket);
    }
    
    // Format time like "10JOLY-10:00AM"
    const eventDate = new Date(ticket.event_date);
    const formattedTime = eventDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    }).toUpperCase();
    
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short'
    }).toUpperCase().replace(' ', '');
    
    document.getElementById('ticketContent').innerHTML = `
        <div style="border-bottom: 2px dashed var(--primary); padding-bottom: 1rem; margin-bottom: 1rem;">
            <h2 style="color: var(--primary); margin: 0;">TICKET</h2>
        </div>
        
        <div style="font-size: 1.5rem; font-weight: bold; letter-spacing: 2px; margin: 1rem 0;">
            ${formattedDate}-${formattedTime}
        </div>
        
        <h3 style="margin: 1rem 0; color: var(--dark);">${ticket.event_title}</h3>
        
        <div style="margin: 1rem 0;">
            <p><strong>Date:</strong> ${eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Location:</strong> ${ticket.event_location}</p>
            <p><strong>Tickets:</strong> ${ticket.quantity}</p>
        </div>
        
        <div style="margin: 1.5rem 0;">
            ${ticket.qr_code_path ? `<img src="${ticket.qr_code_path}" alt="QR Code" style="width: 150px; height: 150px;">` : ''}
        </div>
        
        <div style="border-top: 2px dashed var(--primary); padding-top: 1rem; margin-top: 1rem;">
            <p style="font-family: monospace; font-size: 0.9rem;">Ref: ${ticket.booking_reference}</p>
        </div>
    `;
    
    modalManager.open('ticketModal');
}

function printTicket() {
    const ticketContent = document.getElementById('ticketContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Ticket</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .ticket { border: 2px solid #4a00e0; padding: 20px; border-radius: 10px; max-width: 400px; margin: 0 auto; }
                @media print { 
                    body { margin: 0; }
                    .ticket { border: 2px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="ticket">${ticketContent}</div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function downloadTicket() {
    const ticketContent = document.getElementById('ticketContent');
    if (typeof html2canvas !== 'undefined') {
        html2canvas(ticketContent).then(canvas => {
            const link = document.createElement('a');
            link.download = 'ticket.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    } else {
        alert('Download feature requires html2canvas library. Please use Print instead.');
    }
}

// // Organizer Dashboard
// function openOrganizerDashboard() {
//     let dashboardModal = document.getElementById('organizerDashboardModal');
//     if (!dashboardModal) {
//         dashboardModal = document.createElement('div');
//         dashboardModal.id = 'organizerDashboardModal';
//         dashboardModal.className = 'modal';
//         dashboardModal.innerHTML = `
//             <div class="modal-content" style="max-width: 900px;">
//                 <span class="close-modal">&times;</span>
//                 <h2>Organizer Dashboard</h2>
//                 <div id="dashboardTabs" style="margin-bottom: 1rem;">
//                     <button class="btn btn-outline active" data-tab="events">My Events</button>
//                     <button class="btn btn-outline" data-tab="payments">Pending Payments</button>
//                 </div>
//                 <div id="dashboardContent">
//                     <div id="eventsTab" class="tab-content">
//                         Loading events...
//                     </div>
//                     <div id="paymentsTab" class="tab-content" style="display: none;">
//                         Loading payments...
//                     </div>
//                 </div>
//             </div>
//         `;

function openOrganizerDashboard() {
    let dashboardModal = document.getElementById('organizerDashboardModal');
    if (!dashboardModal) {
        dashboardModal = document.createElement('div');
        dashboardModal.id = 'organizerDashboardModal';
        dashboardModal.className = 'modal';
        dashboardModal.innerHTML = `
            <div class="modal-content scrollable" style="max-width: 1000px;">
                <span class="close-modal">&times;</span>
                <div class="dashboard-header">
                    <h2><i class="fas fa-chart-bar"></i> Organizer Dashboard</h2>
                    <p>Manage your events and track payments</p>
                </div>
                
                <div id="dashboardTabs" class="dashboard-tabs">
                    <button class="tab-btn active" data-tab="events">
                        <i class="fas fa-calendar-alt"></i>
                        My Events
                    </button>
                    <button class="tab-btn" data-tab="payments">
                        <i class="fas fa-money-bill-wave"></i>
                        Pending Payments
                        <span class="badge" id="pendingPaymentsCount" style="display: none;">0</span>
                    </button>
                    <button class="tab-btn" data-tab="analytics">
                        <i class="fas fa-chart-line"></i>
                        Analytics
                    </button>
                </div>
                
                <div id="dashboardContent" class="dashboard-content">
                    <!-- Events Tab -->
                    <div id="eventsTab" class="tab-content active">
                        <div class="tab-header">
                            <h3><i class="fas fa-calendar-alt"></i> My Events</h3>
                            <button class="btn btn-primary" id="createEventFromDashboard">
                                <i class="fas fa-plus"></i> Create New Event
                            </button>
                        </div>
                        <div class="loading-state" id="eventsLoading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading your events...</p>
                        </div>
                        <div id="eventsList" style="display: none;"></div>
                    </div>
                    
                    <!-- Payments Tab -->
                    <div id="paymentsTab" class="tab-content">
                        <div class="tab-header">
                            <h3><i class="fas fa-money-bill-wave"></i> Pending Payments</h3>
                            <div class="tab-actions">
                                <button class="btn btn-outline" id="refreshPayments">
                                    <i class="fas fa-sync-alt"></i> Refresh
                                </button>
                            </div>
                        </div>
                        <div class="loading-state" id="paymentsLoading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading pending payments...</p>
                        </div>
                        <div id="paymentsList" style="display: none;"></div>
                    </div>
                    
                    <!-- Analytics Tab -->
                    <div id="analyticsTab" class="tab-content">
                        <div class="tab-header">
                            <h3><i class="fas fa-chart-line"></i> Event Analytics</h3>
                            <select id="analyticsPeriod" class="form-control" style="width: auto;">
                                <option value="7">Last 7 days</option>
                                <option value="30" selected>Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                        </div>
                        <div class="loading-state" id="analyticsLoading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading analytics...</p>
                        </div>
                        <div id="analyticsContent" style="display: none;">
                            <div class="analytics-stats" id="analyticsStats"></div>
                            <div class="analytics-charts" id="analyticsCharts"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dashboardModal);
        modalManager.register('organizerDashboardModal', dashboardModal);
        
        dashboardModal.querySelector('.close-modal').addEventListener('click', () => {
            modalManager.close(dashboardModal);
        });
        
        // Tab switching
        document.querySelectorAll('#dashboardTabs button').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#dashboardTabs button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
                document.getElementById(this.getAttribute('data-tab') + 'Tab').style.display = 'block';
                
                if (this.getAttribute('data-tab') === 'payments') {
                    loadPendingPayments();
                } else {
                    loadOrganizerEvents();
                }
            });
        });
    }
    
    loadOrganizerEvents();
    modalManager.open('organizerDashboardModal');
}

async function loadOrganizerEvents() {
    try {
        const events = await apiCall('/api/organizer/dashboard');
        displayOrganizerEvents(events);
    } catch (error) {
        document.getElementById('eventsTab').innerHTML = '<p>Error loading events</p>';
    }
}

function displayOrganizerEvents(events) {
    const eventsTab = document.getElementById('eventsTab');
    
    if (events.length === 0) {
        eventsTab.innerHTML = '<p>No events created yet.</p>';
        return;
    }
    
    // Calculate totals
    const totalEvents = events.length;
    const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
    const totalTickets = events.reduce((sum, event) => sum + event.total_tickets, 0);
    const confirmedTickets = events.reduce((sum, event) => sum + event.confirmed_tickets, 0);
    
    eventsTab.innerHTML = `
        <div class="dashboard-stats">
            <div class="stat-card">
                <h3>${totalEvents}</h3>
                <p>Total Events</p>
            </div>
            <div class="stat-card">
                <h3>${totalTickets}</h3>
                <p>Total Tickets</p>
            </div>
            <div class="stat-card">
                <h3>${confirmedTickets}</h3>
                <p>Confirmed Tickets</p>
            </div>
            <div class="stat-card">
                <h3>KSh ${totalRevenue.toLocaleString()}</h3>
                <p>Total Revenue</p>
            </div>
        </div>
        <h3>Event Details</h3>
        ${events.map(event => `
            <div class="ticket-item">
                <h4>${event.title}</h4>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date(event.date).toLocaleTimeString()}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">${event.total_tickets}</div>
                        <div style="font-size: 0.9rem; color: var(--gray);">Total Tickets</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${event.confirmed_tickets}</div>
                        <div style="font-size: 0.9rem; color: var(--gray);">Confirmed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning);">${event.pending_payments}</div>
                        <div style="font-size: 0.9rem; color: var(--gray);">Pending</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">KSh ${event.revenue.toLocaleString()}</div>
                        <div style="font-size: 0.9rem; color: var(--gray);">Revenue</div>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadPendingPayments() {
    try {
        const payments = await apiCall('/api/organizer/payments/pending');
        displayPendingPayments(payments);
    } catch (error) {
        document.getElementById('paymentsTab').innerHTML = '<p>Error loading payments</p>';
    }
}

function displayPendingPayments(payments) {
    const paymentsTab = document.getElementById('paymentsTab');
    
    if (payments.length === 0) {
        paymentsTab.innerHTML = '<p>No pending payments.</p>';
        return;
    }
    
    paymentsTab.innerHTML = payments.map(payment => `
        <div class="ticket-item">
            <h4>${payment.event_title}</h4>
            <p><strong>Attendee:</strong> ${payment.attendee_name}</p>
            <p><strong>Amount:</strong> KSh ${payment.amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${payment.payment_reference}</p>
            <p><strong>Method:</strong> ${payment.payment_method}</p>
            <p><strong>Submitted:</strong> ${new Date(payment.created_at).toLocaleString()}</p>
            <div style="margin-top: 1rem;">
                <button class="btn btn-success confirm-payment-btn" data-payment-id="${payment.payment_id}">
                    Confirm Payment
                </button>
                <button class="btn btn-danger reject-payment-btn" data-payment-id="${payment.payment_id}" style="margin-left: 0.5rem;">
                    Reject
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for payment actions using event delegation
    paymentsTab.addEventListener('click', function(e) {
        const confirmBtn = e.target.closest('.confirm-payment-btn');
        const rejectBtn = e.target.closest('.reject-payment-btn');
        
        if (confirmBtn) {
            const paymentId = confirmBtn.getAttribute('data-payment-id');
            confirmPayment(paymentId);
        }
        
        if (rejectBtn) {
            const paymentId = rejectBtn.getAttribute('data-payment-id');
            rejectPayment(paymentId);
        }
    });
}

async function confirmPayment(paymentId) {
    if (!confirm('Are you sure you want to confirm this payment?')) return;
    
    try {
        await apiCall(`/api/organizer/payments/${paymentId}/confirm`, {
            method: 'POST'
        });
        
        alert('Payment confirmed successfully! The attendee can now access their ticket.');
        loadPendingPayments();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function rejectPayment(paymentId) {
    if (!confirm('Are you sure you want to reject this payment?')) return;
    
    try {
        await apiCall(`/api/organizer/payments/${paymentId}/reject`, {
            method: 'POST'
        });
        
        alert('Payment rejected successfully.');
        loadPendingPayments();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Logout function
async function logout() {
    try {
        await apiCall('/api/logout');
        alert('Logged out successfully!');
        updateAuthUI(null);
        currentUser = null;
        clearUserPreferences();
        loadEvents();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Check if user is logged in on page load
async function checkAuthStatus() {
    try {
        // Try to load from localStorage first for better UX
        const cachedUser = loadUserPreferences();
        if (cachedUser) {
            currentUser = cachedUser;
            updateAuthUI(cachedUser);
        }
        
        // Verify with server
        const user = await apiCall('/api/user/profile');
        currentUser = user;
        updateAuthUI(user);
        saveUserPreferences(user);
    } catch (error) {
        console.log('User not logged in');
        clearUserPreferences();
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    
    if (!searchInput || !searchButton) return;
    
    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            const filteredEvents = events.filter(event => 
                event.title.toLowerCase().includes(searchTerm) ||
                event.category.toLowerCase().includes(searchTerm) ||
                event.location.toLowerCase().includes(searchTerm) ||
                event.description?.toLowerCase().includes(searchTerm)
            );
            
            if (filteredEvents.length > 0) {
                const originalEvents = [...events];
                events = filteredEvents;
                renderEvents();
                document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
                // Restore original events after showing filtered results
                setTimeout(() => { events = originalEvents; }, 100);
            } else {
                alert('No events found matching your search.');
            }
        } else {
            loadEvents();
        }
    };
    
    const debouncedSearch = debounce(performSearch, 300);
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('input', debouncedSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Load html2canvas for ticket downloads
function loadHtml2Canvas() {
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
        document.head.appendChild(script);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    loadEvents();
    checkAuthStatus();
    setupSearch();
    loadHtml2Canvas();
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

// Make functions globally available for debugging
window.debug = {
    loadEvents,
    checkAuthStatus,
    updateAuthUI,
    openCreateEventModal,
    openTicketsModal,
    openOrganizerDashboard,
    modalManager,
    apiCall
};

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ModalManager,
        apiCall,
        validateForm,
        setLoading,
        debounce
    };
}