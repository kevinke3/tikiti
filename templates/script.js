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

    // Global events array
    let events = [];
    let currentUser = null;

    // Load events from backend
    async function loadEvents() {
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                events = await response.json();
                renderEvents();
            } else {
                // Fallback to sample data if API fails
                loadSampleEvents();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            loadSampleEvents();
        }
    }

    // Sample event data as fallback
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

    // Render events to the grid
    function renderEvents() {
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
        
        // Attach event listeners after rendering
        setTimeout(attachEventListeners, 100);
    }

    // Modal Functions
    function openModal(modal) {
        modal.style.display = 'flex';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        // Clear form fields when closing modal
        if (modal === loginModal) {
            document.getElementById('loginForm').reset();
        } else if (modal === registerModal) {
            document.getElementById('registerForm').reset();
        }
    }

    // Event Listeners for modals
    loginBtn.addEventListener('click', () => openModal(loginModal));
    registerBtn.addEventListener('click', () => openModal(registerModal));

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(loginModal);
            closeModal(registerModal);
            closeModal(document.getElementById('createEventModal'));
            closeModal(document.getElementById('paymentModal'));
            closeModal(document.getElementById('ticketsModal'));
            closeModal(document.getElementById('ticketModal'));
            closeModal(document.getElementById('organizerDashboardModal'));
        });
    });

    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(registerModal);
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(registerModal);
        openModal(loginModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === registerModal) closeModal(registerModal);
        if (e.target === document.getElementById('createEventModal')) closeModal(document.getElementById('createEventModal'));
        if (e.target === document.getElementById('paymentModal')) closeModal(document.getElementById('paymentModal'));
        if (e.target === document.getElementById('ticketsModal')) closeModal(document.getElementById('ticketsModal'));
        if (e.target === document.getElementById('ticketModal')) closeModal(document.getElementById('ticketModal'));
        if (e.target === document.getElementById('organizerDashboardModal')) closeModal(document.getElementById('organizerDashboardModal'));
    });

    // Mobile menu toggle
    mobileMenu.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    // Form submission - Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Login successful!');
                closeModal(loginModal);
                updateAuthUI(data.user);
                currentUser = data.user;
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error connecting to server: ' + error.message);
        }
    });

    // Form submission - Register
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;
        
        if (!name || !email || !password || !role) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Registration successful! You can now login.');
                closeModal(registerModal);
                // Auto-fill login form
                document.getElementById('loginEmail').value = email;
                openModal(loginModal);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error connecting to server: ' + error.message);
        }
    });

    // Function to update UI based on authentication state
    function updateAuthUI(user) {
        const authButtons = document.querySelector('.auth-buttons');
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
            document.getElementById('loginBtn').addEventListener('click', () => openModal(loginModal));
            document.getElementById('registerBtn').addEventListener('click', () => openModal(registerModal));
            
            // Hide create event button
            hideCreateEventButton();
        }
    }

    // Show create event button for organizers
    function showCreateEventButton() {
        let createEventBtn = document.getElementById('createEventBtn');
        if (!createEventBtn) {
            createEventBtn = document.createElement('button');
            createEventBtn.id = 'createEventBtn';
            createEventBtn.className = 'btn btn-primary';
            createEventBtn.innerHTML = '<i class="fas fa-plus"></i> Create Event';
            createEventBtn.style.marginRight = '1rem';
            createEventBtn.addEventListener('click', openCreateEventModal);
            document.querySelector('.header-content').insertBefore(createEventBtn, document.querySelector('.auth-buttons'));
        }
    }

    // Hide create event button
    function hideCreateEventButton() {
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.remove();
        }
    }

    // Create Event Modal with Payment Information
    function openCreateEventModal() {
        let createEventModal = document.getElementById('createEventModal');
        if (!createEventModal) {
            createEventModal = document.createElement('div');
            createEventModal.id = 'createEventModal';
            createEventModal.className = 'modal';
            createEventModal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
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
            
            document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
            createEventModal.querySelector('.close-modal').addEventListener('click', () => {
                closeModal(createEventModal);
            });
        }
        
        const today = new Date().toISOString().slice(0, 16);
        document.getElementById('eventDate').min = today;
        openModal(createEventModal);
    }

    // Handle event creation with payment info
    async function handleCreateEvent(e) {
        e.preventDefault();
        
        const eventData = {
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
        
        try {
            const response = await fetch('/api/events/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Event created successfully!');
                closeModal(document.getElementById('createEventModal'));
                document.getElementById('createEventForm').reset();
                loadEvents();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error connecting to server: ' + error.message);
        }
    }

    // Payment Modal and Flow
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
            
            paymentModal.querySelector('.close-modal').addEventListener('click', () => {
                closeModal(paymentModal);
            });
            
            document.getElementById('proceedToPayment').addEventListener('click', () => {
                document.getElementById('step1').style.display = 'none';
                document.getElementById('step2').style.display = 'block';
            });
            
            document.getElementById('submitPayment').addEventListener('click', () => submitPaymentProof(ticketId));
            document.getElementById('closePaymentModal').addEventListener('click', () => {
                closeModal(paymentModal);
                loadUserTickets();
            });
        }
        
        loadPaymentInstructions(eventId, totalPrice, eventTitle);
        openModal(paymentModal);
    }

    async function loadPaymentInstructions(eventId, totalPrice, eventTitle) {
        try {
            const response = await fetch(`/api/events/${eventId}/payment-info`);
            if (response.ok) {
                const paymentInfo = await response.json();
                document.getElementById('paymentInstructions').innerHTML = `
                    <p><strong>Event:</strong> ${eventTitle}</p>
                    <p><strong>Amount:</strong> KSh ${totalPrice.toLocaleString()}</p>
                    <p><strong>Till Number:</strong> ${paymentInfo.till_number}</p>
                    <p><strong>Account Name:</strong> ${paymentInfo.payment_name}</p>
                    <p><strong>Instructions:</strong> ${paymentInfo.payment_instructions}</p>
                `;
            }
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
        
        try {
            const response = await fetch(`/api/tickets/${ticketId}/submit-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_reference: reference,
                    payment_method: method
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step3').style.display = 'block';
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error submitting payment: ' + error.message);
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
            
            ticketsModal.querySelector('.close-modal').addEventListener('click', () => {
                closeModal(ticketsModal);
            });
        }
        
        loadUserTickets();
        openModal(ticketsModal);
    }

    async function loadUserTickets() {
        try {
            const response = await fetch('/api/user/tickets');
            if (response.ok) {
                const tickets = await response.json();
                displayTickets(tickets);
            }
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
        
        // Add event listeners
        document.querySelectorAll('.view-ticket-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = this.getAttribute('data-ticket-id');
                const ticket = tickets.find(t => t.id == ticketId);
                if (ticket) {
                    openTicketView(ticket);
                }
            });
        });
        
        document.querySelectorAll('.complete-payment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const eventId = this.getAttribute('data-event-id');
                const ticketId = this.getAttribute('data-ticket-id');
                const totalPrice = this.getAttribute('data-total-price');
                const eventTitle = this.getAttribute('data-event-title');
                openPaymentModal(eventId, ticketId, parseFloat(totalPrice), eventTitle);
            });
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
            
            ticketModal.querySelector('.close-modal').addEventListener('click', () => {
                closeModal(ticketModal);
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
        
        openModal(ticketModal);
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

    // Organizer Dashboard
    function openOrganizerDashboard() {
        let dashboardModal = document.getElementById('organizerDashboardModal');
        if (!dashboardModal) {
            dashboardModal = document.createElement('div');
            dashboardModal.id = 'organizerDashboardModal';
            dashboardModal.className = 'modal';
            dashboardModal.innerHTML = `
                <div class="modal-content" style="max-width: 900px;">
                    <span class="close-modal">&times;</span>
                    <h2>Organizer Dashboard</h2>
                    <div id="dashboardTabs" style="margin-bottom: 1rem;">
                        <button class="btn btn-outline active" data-tab="events">My Events</button>
                        <button class="btn btn-outline" data-tab="payments">Pending Payments</button>
                    </div>
                    <div id="dashboardContent">
                        <div id="eventsTab" class="tab-content">
                            Loading events...
                        </div>
                        <div id="paymentsTab" class="tab-content" style="display: none;">
                            Loading payments...
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(dashboardModal);
            
            dashboardModal.querySelector('.close-modal').addEventListener('click', () => {
                closeModal(dashboardModal);
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
        openModal(dashboardModal);
    }

    async function loadOrganizerEvents() {
        try {
            const response = await fetch('/api/organizer/dashboard');
            if (response.ok) {
                const events = await response.json();
                displayOrganizerEvents(events);
            }
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
            const response = await fetch('/api/organizer/payments/pending');
            if (response.ok) {
                const payments = await response.json();
                displayPendingPayments(payments);
            }
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
        
        // Add event listeners for payment actions
        document.querySelectorAll('.confirm-payment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const paymentId = this.getAttribute('data-payment-id');
                confirmPayment(paymentId);
            });
        });
        
        document.querySelectorAll('.reject-payment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const paymentId = this.getAttribute('data-payment-id');
                rejectPayment(paymentId);
            });
        });
    }

    async function confirmPayment(paymentId) {
        if (!confirm('Are you sure you want to confirm this payment?')) return;
        
        try {
            const response = await fetch(`/api/organizer/payments/${paymentId}/confirm`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Payment confirmed successfully! The attendee can now access their ticket.');
                loadPendingPayments();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error confirming payment: ' + error.message);
        }
    }

    async function rejectPayment(paymentId) {
        if (!confirm('Are you sure you want to reject this payment?')) return;
        
        try {
            const response = await fetch(`/api/organizer/payments/${paymentId}/reject`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Payment rejected successfully.');
                loadPendingPayments();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error rejecting payment: ' + error.message);
        }
    }

    // Logout function
    async function logout() {
        try {
            const response = await fetch('/api/logout');
            const data = await response.json();
            
            if (response.ok) {
                alert('Logged out successfully!');
                updateAuthUI(null);
                currentUser = null;
                loadEvents();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error logging out: ' + error.message);
        }
    }

    // Check if user is logged in on page load
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user/profile');
            if (response.ok) {
                const user = await response.json();
                currentUser = user;
                updateAuthUI(user);
            }
        } catch (error) {
            console.log('User not logged in');
        }
    }

    // Attach event listeners to event cards
    function attachEventListeners() {
        // Attach event listeners to all "Book Now" buttons
        document.querySelectorAll('.book-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const eventCard = this.closest('.event-card');
                const eventId = eventCard.getAttribute('data-event-id');
                const eventTitle = eventCard.querySelector('.event-title').textContent;
                const eventPrice = parseFloat(eventCard.querySelector('.event-price').textContent.replace(/[^\d.]/g, ''));
                
                // Check if user is logged in
                try {
                    const profileResponse = await fetch('/api/user/profile');
                    if (!profileResponse.ok) {
                        alert('Please login to book tickets');
                        openModal(loginModal);
                        return;
                    }
                    
                    const user = await profileResponse.json();
                    
                    const quantity = prompt(`How many tickets for "${eventTitle}"?\nPrice per ticket: KSh ${eventPrice.toLocaleString()}`, '1');
                    if (quantity && !isNaN(quantity) && quantity > 0) {
                        try {
                            const response = await fetch('/api/tickets/book', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                    event_id: parseInt(eventId), 
                                    quantity: parseInt(quantity) 
                                })
                            });
                            
                            const data = await response.json();
                            
                            if (response.ok) {
                                const totalPrice = eventPrice * quantity;
                                alert(`Ticket reserved successfully!\n\nPlease complete payment to get your ticket.`);
                                openPaymentModal(eventId, data.ticket_id, totalPrice, eventTitle);
                            } else {
                                alert('Error: ' + data.error);
                            }
                        } catch (error) {
                            alert('Error connecting to server: ' + error.message);
                        }
                    }
                } catch (error) {
                    alert('Please login to book tickets');
                    openModal(loginModal);
                }
            });
        });

        // Attach event listeners to details buttons
        document.querySelectorAll('.details-btn').forEach(button => {
            button.addEventListener('click', function() {
                const eventCard = this.closest('.event-card');
                const eventTitle = eventCard.querySelector('.event-title').textContent;
                const eventDate = eventCard.querySelector('.event-date span').textContent;
                const eventLocation = eventCard.querySelector('.event-location span').textContent;
                const eventPrice = eventCard.querySelector('.event-price').textContent;
                
                alert(`Event Details:\n\n${eventTitle}\n\n📅 ${eventDate}\n📍 ${eventLocation}\n💰 ${eventPrice}\n\nClick "Book Now" to reserve your tickets!`);
            });
        });
    }

    // Search functionality
    function setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        const searchButton = document.querySelector('.search-bar button');
        
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
                    events = filteredEvents;
                    renderEvents();
                    document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert('No events found matching your search.');
                }
            } else {
                loadEvents();
            }
        };
        
        searchButton.addEventListener('click', performSearch);
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
        openOrganizerDashboard
    };
