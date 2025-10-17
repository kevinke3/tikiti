# app.py
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # Add this import
from werkzeug.security import generate_password_hash, check_password_hash
import qrcode
import os
from datetime import datetime
import random
import string


app = Flask(__name__)
app.config['SECRET_KEY'] = 'tikozetu-secret-key-2023'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tikozetu.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Add this after creating the app
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

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

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    attendee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    booking_reference = db.Column(db.String(20), unique=True, nullable=False)
    qr_code_path = db.Column(db.String(500))
    is_checked_in = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    event = db.relationship('Event', backref=db.backref('tickets', lazy=True))
    attendee = db.relationship('User', backref=db.backref('tickets', lazy=True))

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
    
    db.session.commit()

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
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.get_json()
        new_event = Event(
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            date=datetime.fromisoformat(data.get('date').replace('Z', '+00:00')),
            location=data.get('location'),
            price=float(data.get('price')),
            capacity=int(data.get('capacity')),
            organizer_id=session['user_id'],
            image_url=data.get('image_url')
        )
        db.session.add(new_event)
        db.session.commit()
        
        return jsonify({
            'message': 'Event created successfully', 
            'event_id': new_event.id
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
        import random
        import string
        booking_ref = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
        total_price = event.price * quantity
        
        # Create qrcodes directory if it doesn't exist
        os.makedirs('static/qrcodes', exist_ok=True)
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr_data = f"TikoZetu|{booking_ref}|{event_id}|{session['user_id']}|{quantity}"
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_path = f"static/qrcodes/{booking_ref}.png"
        qr_img.save(qr_path)
        
        new_ticket = Ticket(
            event_id=event_id,
            attendee_id=session['user_id'],
            quantity=quantity,
            total_price=total_price,
            booking_reference=booking_ref,
            qr_code_path=qr_path
        )
        db.session.add(new_ticket)
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket booked successfully',
            'booking_reference': booking_ref,
            'qr_code_path': f'/{qr_path}',
            'total_price': total_price,
            'event_title': event.title,
            'quantity': quantity
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_sample_data()
    app.run(debug=True, host='0.0.0.0', port=5000)