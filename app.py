# app.py
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import qrcode
import os
from datetime import datetime
import random
import string
import sqlite3

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tikozetu-secret-key-2023'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tikozetu.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Add CORS support
CORS(app)

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='attendee')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    organizer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    image_url = db.Column(db.String(500))
    
    organizer = db.relationship('User', backref=db.backref('events', lazy=True))

class EventPayment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    till_number = db.Column(db.String(20), nullable=False)
    payment_name = db.Column(db.String(100), nullable=False)
    payment_instructions = db.Column(db.Text, nullable=True)
    
    event = db.relationship('Event', backref=db.backref('payment_info', lazy=True))

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    attendee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    booking_reference = db.Column(db.String(20), unique=True, nullable=False)
    qr_code_path = db.Column(db.String(500))
    is_checked_in = db.Column(db.Boolean, default=False)
    payment_status = db.Column(db.String(20), default='unpaid')  # unpaid, pending, paid
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    event = db.relationship('Event', backref=db.backref('tickets', lazy=True))
    attendee = db.relationship('User', backref=db.backref('tickets', lazy=True))

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    payment_reference = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    ticket = db.relationship('Ticket', backref=db.backref('payment', uselist=False))

# Function to check and update database schema
def check_and_update_schema():
    """Check if database schema needs to be updated and handle it"""
    try:
        # Try to query the Ticket table to see if payment_status column exists
        db.session.execute('SELECT payment_status FROM ticket LIMIT 1')
        print("Database schema is up to date.")
    except Exception as e:
        print("Database schema needs update. Recreating database...")
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        create_sample_data()
        print("Database recreated successfully.")

# Create sample data
def create_sample_data():
    # Check if sample data already exists
    if User.query.count() > 0:
        return
    
    # Create admin user
    admin = User(
        name='Admin User',
        email='admin@tikozetu.com',
        password=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)
    
    # Create organizer
    organizer = User(
        name='Event Organizer',
        email='organizer@tikozetu.com',
        password=generate_password_hash('organizer123'),
        role='organizer'
    )
    db.session.add(organizer)
    
    # Create attendee
    attendee = User(
        name='John Attendee',
        email='attendee@tikozetu.com',
        password=generate_password_hash('attendee123'),
        role='attendee'
    )
    db.session.add(attendee)
    
    db.session.commit()
    
    # Create sample events
    events_data = [
        {
            'title': 'Nairobi Music Festival',
            'description': 'The biggest music festival in Nairobi featuring top artists from Kenya and beyond.',
            'category': 'Music',
            'date': datetime(2023, 12, 15, 18, 0),
            'location': 'Carnivore Grounds, Nairobi',
            'price': 1500.0,
            'capacity': 5000,
            'organizer_id': organizer.id,
            'image_url': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        },
        {
            'title': 'Tech Innovation Summit',
            'description': 'Join tech leaders and innovators for a day of inspiring talks and networking.',
            'category': 'Conference',
            'date': datetime(2023, 12, 20, 9, 0),
            'location': 'KICC, Nairobi',
            'price': 3000.0,
            'capacity': 1000,
            'organizer_id': organizer.id,
            'image_url': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        },
        {
            'title': 'Art Exhibition: Kenyan Masters',
            'description': 'A showcase of contemporary Kenyan art from established and emerging artists.',
            'category': 'Art',
            'date': datetime(2023, 12, 10, 10, 0),
            'location': 'Nairobi Gallery',
            'price': 500.0,
            'capacity': 200,
            'organizer_id': organizer.id,
            'image_url': 'https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        }
    ]
    
    for event_data in events_data:
        event = Event(**event_data)
        db.session.add(event)
        
        # Create payment info for each event
        payment_info = EventPayment(
            event_id=event.id,
            till_number='123456',
            payment_name='MPESA Buy Goods',
            payment_instructions='Pay to the till number above and include your name as reference'
        )
        db.session.add(payment_info)
    
    db.session.commit()
    print("Sample data created successfully!")

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/events')
def get_events():
    events = Event.query.all()
    events_data = []
    for event in events:
        events_data.append({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'category': event.category,
            'date': event.date.isoformat(),
            'location': event.location,
            'price': event.price,
            'capacity': event.capacity,
            'image_url': event.image_url,
            'organizer': event.organizer.name
        })
    return jsonify(events_data)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'attendee')
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        hashed_password = generate_password_hash(password)
        new_user = User(name=name, email=email, password=hashed_password, role=role)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'name': new_user.name,
                'email': new_user.email,
                'role': new_user.role
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['user_role'] = user.role
            return jsonify({
                'message': 'Login successful', 
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role
                }
            })
        
        return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout')
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/events/create', methods=['POST'])
def create_event():
    try:
        if 'user_id' not in session or session['user_role'] not in ['organizer', 'admin']:
            return jsonify({'error': 'Unauthorized. Only organizers and admins can create events.'}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'date', 'location', 'price', 'capacity', 'till_number', 'payment_name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse date and create event
        event_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        
        new_event = Event(
            title=data['title'],
            description=data['description'],
            category=data['category'],
            date=event_date,
            location=data['location'],
            price=float(data['price']),
            capacity=int(data['capacity']),
            organizer_id=session['user_id'],
            image_url=data.get('image_url', 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80')
        )
        
        db.session.add(new_event)
        db.session.flush()  # Get the event ID
        
        # Create payment information
        payment_info = EventPayment(
            event_id=new_event.id,
            till_number=data['till_number'],
            payment_name=data['payment_name'],
            payment_instructions=data.get('payment_instructions', 'Pay to the till number above and include your name as reference')
        )
        db.session.add(payment_info)
        db.session.commit()
        
        return jsonify({
            'message': 'Event created successfully', 
            'event_id': new_event.id,
            'event': {
                'id': new_event.id,
                'title': new_event.title,
                'description': new_event.description,
                'category': new_event.category,
                'date': new_event.date.isoformat(),
                'location': new_event.location,
                'price': new_event.price,
                'capacity': new_event.capacity,
                'image_url': new_event.image_url
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tickets/book', methods=['POST'])
def book_ticket():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Please login to book tickets'}), 401
        
        data = request.get_json()
        event_id = data.get('event_id')
        quantity = data.get('quantity', 1)
        
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Generate booking reference
        booking_ref = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
        total_price = event.price * quantity
        
        new_ticket = Ticket(
            event_id=event_id,
            attendee_id=session['user_id'],
            quantity=quantity,
            total_price=total_price,
            booking_reference=booking_ref,
            qr_code_path=None,  # Will be generated after payment confirmation
            payment_status='unpaid'
        )
        db.session.add(new_ticket)
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket reserved successfully. Please complete payment.',
            'ticket_id': new_ticket.id,
            'booking_reference': booking_ref,
            'total_price': total_price,
            'event_title': event.title,
            'quantity': quantity
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>/payment-info')
def get_event_payment_info(event_id):
    payment_info = EventPayment.query.filter_by(event_id=event_id).first()
    if not payment_info:
        return jsonify({'error': 'Payment information not found for this event'}), 404
    
    return jsonify({
        'till_number': payment_info.till_number,
        'payment_name': payment_info.payment_name,
        'payment_instructions': payment_info.payment_instructions
    })

@app.route('/api/tickets/<int:ticket_id>/submit-payment', methods=['POST'])
def submit_payment(ticket_id):
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Please login to submit payment'}), 401
        
        data = request.get_json()
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket or ticket.attendee_id != session['user_id']:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Create payment record
        payment = Payment(
            ticket_id=ticket_id,
            amount=ticket.total_price,
            payment_method=data.get('payment_method', 'MPESA'),
            payment_reference=data.get('payment_reference', ''),
            status='pending'
        )
        
        # Update ticket payment status
        ticket.payment_status = 'pending'
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment submitted successfully. Waiting for organizer confirmation.',
            'payment_id': payment.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/organizer/payments/pending')
def get_pending_payments():
    if 'user_id' not in session or session['user_role'] not in ['organizer', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get events organized by this user
    user_events = Event.query.filter_by(organizer_id=session['user_id']).all()
    event_ids = [event.id for event in user_events]
    
    pending_payments = Payment.query.join(Ticket).filter(
        Ticket.event_id.in_(event_ids),
        Payment.status == 'pending'
    ).all()
    
    payments_data = []
    for payment in pending_payments:
        payments_data.append({
            'payment_id': payment.id,
            'ticket_id': payment.ticket_id,
            'event_title': payment.ticket.event.title,
            'attendee_name': payment.ticket.attendee.name,
            'amount': payment.amount,
            'payment_reference': payment.payment_reference,
            'payment_method': payment.payment_method,
            'created_at': payment.created_at.isoformat()
        })
    
    return jsonify(payments_data)

@app.route('/api/organizer/payments/<int:payment_id>/confirm', methods=['POST'])
def confirm_payment(payment_id):
    try:
        if 'user_id' not in session or session['user_role'] not in ['organizer', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 401
        
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Verify the organizer owns this event
        event_organizer_id = payment.ticket.event.organizer_id
        if event_organizer_id != session['user_id'] and session['user_role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        
        payment.status = 'confirmed'
        payment.confirmed_at = datetime.utcnow()
        payment.ticket.payment_status = 'paid'
        
        # Generate QR code for the ticket
        booking_ref = payment.ticket.booking_reference
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr_data = f"TikoZetu|{booking_ref}|{payment.ticket.event_id}|{payment.ticket.attendee_id}|{payment.ticket.quantity}"
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_path = f"static/qrcodes/{booking_ref}.png"
        os.makedirs(os.path.dirname(qr_path), exist_ok=True)
        qr_img.save(qr_path)
        
        payment.ticket.qr_code_path = qr_path
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment confirmed successfully',
            'ticket': {
                'booking_reference': booking_ref,
                'qr_code_path': f'/{qr_path}',
                'payment_status': 'paid'
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/organizer/payments/<int:payment_id>/reject', methods=['POST'])
def reject_payment(payment_id):
    try:
        if 'user_id' not in session or session['user_role'] not in ['organizer', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 401
        
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Verify the organizer owns this event
        event_organizer_id = payment.ticket.event.organizer_id
        if event_organizer_id != session['user_id'] and session['user_role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        
        payment.status = 'rejected'
        payment.ticket.payment_status = 'unpaid'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment rejected successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/tickets')
def get_user_tickets():
    if 'user_id' not in session:
        return jsonify({'error': 'Please login to view tickets'}), 401
    
    tickets = Ticket.query.filter_by(attendee_id=session['user_id']).all()
    tickets_data = []
    
    for ticket in tickets:
        tickets_data.append({
            'id': ticket.id,
            'event_title': ticket.event.title,
            'event_date': ticket.event.date.isoformat(),
            'event_location': ticket.event.location,
            'quantity': ticket.quantity,
            'total_price': ticket.total_price,
            'booking_reference': ticket.booking_reference,
            'payment_status': ticket.payment_status,
            'qr_code_path': ticket.qr_code_path,
            'created_at': ticket.created_at.isoformat()
        })
    
    return jsonify(tickets_data)

@app.route('/api/user/profile')
def get_user_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role
    })

@app.route('/api/organizer/dashboard')
def get_organizer_dashboard():
    if 'user_id' not in session or session['user_role'] not in ['organizer', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get organizer's events
    events = Event.query.filter_by(organizer_id=session['user_id']).all()
    events_data = []
    
    for event in events:
        total_tickets = Ticket.query.filter_by(event_id=event.id).count()
        confirmed_tickets = Ticket.query.filter_by(event_id=event.id, payment_status='paid').count()
        pending_payments = Payment.query.join(Ticket).filter(
            Ticket.event_id == event.id,
            Payment.status == 'pending'
        ).count()
        
        events_data.append({
            'id': event.id,
            'title': event.title,
            'date': event.date.isoformat(),
            'total_tickets': total_tickets,
            'confirmed_tickets': confirmed_tickets,
            'pending_payments': pending_payments,
            'revenue': confirmed_tickets * event.price
        })
    
    return jsonify(events_data)

if __name__ == '__main__':
    with app.app_context():
        # Check and update database schema
        check_and_update_schema()
    app.run(debug=True, host='0.0.0.0', port=5000)