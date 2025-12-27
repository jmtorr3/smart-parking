# ParkGrid

A real-time smart parking availability system for Virginia Tech that helps drivers find open spots instantly. Built with Django REST Framework, React, and simulated IoT sensors.

## What It Does

ParkGrid tracks parking lot occupancy in real-time. Users can see which lots have space, drill down to individual spots, and watch availability change live as cars come and go.

![Dashboard Preview](dashboard.png)

## ER Diagram

![ER Diagram](Database_Diagram.png)

## Features

- **Live Dashboard** - See all parking lots with available/total spots and occupancy percentage
- **Individual Spot View** - Click any lot to see exactly which spots are free (green) or taken (red)
- **Real-time Updates** - Data refreshes every 3 seconds automatically
- **Search** - Filter lots by name
- **User Authentication** - JWT-based login/register system
- **IoT Simulation** - Simulates parking sensors detecting cars entering/leaving
- **Multiple Layouts** - 5 different parking lot visualizations (horizontal, angled, vertical, double-row, compact)

## Tech Stack

**Backend**
- Python 3.12
- Django 6.0
- Django REST Framework
- Simple JWT for authentication
- Django Channels (WebSocket infrastructure)
- SQLite (development)

**Frontend**
- React 19
- CSS3 with VT-themed styling
- Fetch API with polling

## Database Schema

| Table | Purpose |
|-------|---------|
| User | Custom user model with permit linking |
| PermitType | Student, Faculty, Visitor classifications |
| Vehicle | User vehicles (one-to-many) |
| ParkingLot | Physical lots with occupancy tracking |
| ParkingSpot | Individual spots with availability status |
| Event | Game day restrictions on lots |
| Session | Tracks parking sessions (who parked where, when) |

## Project Structure

```
smart-parking/
├── backend/
│   └── parking_system/
│       ├── manage.py
│       ├── requirements.txt
│       ├── parking/
│       │   ├── models.py
│       │   ├── views.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── admin.py
│       │   ├── consumers.py
│       │   ├── routing.py
│       │   └── management/
│       │       └── commands/
│       │           ├── seed_data.py
│       │           └── simulate_sensors.py
│       └── parking_system/
│           ├── settings.py
│           ├── urls.py
│           ├── asgi.py
│           └── wsgi.py
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── Login.js
│       ├── index.js
│       └── index.css
├── run.sh
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/Subhanshrestha/smart-parking.git
   cd smart-parking
   ```

2. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r parking_system/requirements.txt
   cd parking_system
   python manage.py migrate
   python manage.py seed_data
   ```

3. **Set up frontend**
   ```bash
   cd ../../frontend
   npm install
   ```

### Running the App

**Option 1: Use the run script (from project root)**
```bash
chmod +x run.sh
./run.sh
```

**Option 2: Run manually (3 terminals)**

Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
cd parking_system
python manage.py runserver
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

Terminal 3 - IoT Simulator:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
cd parking_system
python manage.py simulate_sensors
```

### Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://127.0.0.1:8000/api/ |
| Admin | http://127.0.0.1:8000/admin/ |

### Demo Account

- **Username:** `demo`
- **Password:** `demo123`

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/dashboard/` | GET | No | Summary of all lots with availability |
| `/api/lots/` | GET | No | List all parking lots with spots |
| `/api/lots/{id}/` | GET | No | Single lot details |
| `/api/spots/` | GET | No | List all spots |
| `/api/spots/?parking_lot={id}` | GET | No | Get spots for a specific lot |
| `/api/permits/` | GET | No | List permit types |
| `/api/events/` | GET | No | List events |
| `/api/sessions/` | GET | No | List parking sessions |
| `/api/register/` | POST | No | Create new user |
| `/api/token/` | POST | No | Get JWT access token |
| `/api/token/refresh/` | POST | No | Refresh JWT token |

### Example API Response

**GET /api/dashboard/**
```json
[
  {
    "id": 1,
    "name": "Perry Street Lot",
    "total_spots": 25,
    "available_spots": 18,
    "occupancy_percent": 28.0
  }
]
```

## How the IoT Simulation Works

The `simulate_sensors` management command mimics real parking sensors:

1. Randomly selects a parking spot every 2 seconds
2. 60% chance to flip its availability (car arrived or left)
3. Updates the lot's occupancy count
4. Logs the event to console
5. Broadcasts update via WebSocket channel layer

**Custom interval:**
```bash
python manage.py simulate_sensors --interval 5
```

In production, this would be replaced by actual IoT sensor data via webhooks or MQTT.

## WebSocket Support

The backend includes Django Channels infrastructure for real-time updates:

- **Endpoint:** `ws://localhost:8000/ws/parking/`
- **Channel Layer:** In-memory
- **Consumer:** `parking.consumers.ParkingConsumer`

The frontend currently uses polling, but WebSocket integration is ready.

## Running Tests

**Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
cd parking_system
python manage.py test
```

**CI Pipeline:**

The project includes GitHub Actions CI (`.github/workflows/ci.yml`) that runs:
- Django checks and tests
- Frontend build verification

## Default Seed Data

Running `python manage.py seed_data` creates:

**Permit Types:**
- Student
- Faculty
- Visitor

**Parking Lots:**
| Lot Name | Spots |
|----------|-------|
| Perry Street Lot | 25 |
| The Cage | 40 |
| Duck Pond Lot | 30 |
| Drill Field Lot | 20 |
| North End Lot | 35 |

## Future Improvements

- [ ] Campus map view with lot locations
- [ ] Historical occupancy charts
- [ ] Peak hours prediction
- [ ] Mobile app
- [ ] Push notifications when spots open
