QuizMaster 🎯

QuizMaster is a modern, full-stack quiz application built with React (frontend), Node.js + Express (backend), and MongoDB (database).
It allows users to sign up, take quizzes across different categories, track results, and view a leaderboard.

🚀 Features

User Authentication — Sign up and log in securely with JWT tokens

Dynamic Quizzes — Multiple quizzes stored in MongoDB, loaded dynamically

Leaderboard — Tracks top scorers with sorting

Result Storage — Quiz results stored in MongoDB for persistence

Responsive UI — Works across devices

🛠 Tech Stack

Frontend: React, TypeScript, Tailwind CSS

Backend: Node.js, Express

Database: MongoDB Atlas

Authentication: JWT

Version Control: Git & GitHub

📂 Project Structure
quizmaster/
│
├── backend/                 # Express API
│   ├── controller/          # API controllers
│   ├── models/              # Mongoose models
│   ├── routes/              # Express routes
│   └── server.js            # Backend entry point
│
├── frontend/                # React application
│   ├── src/                 # React source code
│   ├── public/              # Static files
│   └── package.json         # Frontend dependencies
│
├── README.md                # Project documentation
└── .gitignore               # Ignored files

⚙️ Setup & Installation
1. Clone the Repository
git clone https://github.com/Anchalbhoite/quizmaster.git
cd quizmaster/backend

2. Backend Setup
npm install


Create a .env file in the backend folder:

PORT=5000
MONGO_URI=mongodb+srv://Anchal:Anchal05@cluster0.qxuf3fk.mongodb.net/quizmaster?retryWrites=true&w=majority
JWT_SECRET=mysecretkey
VITE_API_URL=http://localhost:5000


Run the backend server:

npx nodemon server.js


Backend runs on: http://localhost:5000

3. Frontend Setup

Navigate to the frontend folder:

cd ../frontend
npm install


Run the frontend:

npm run dev


Frontend runs on: http://localhost:3000

📦 API Endpoints
Auth

POST /api/auth/signup — Register a new user

POST /api/auth/login — Login and receive JWT token

Quizzes

GET /api/quizzes — Get all quizzes

GET /api/quizzes/:id — Get quiz details by ID

Results

POST /api/results — Save quiz result (authenticated)

GET /api/results/leaderboard — Get top scores

GET /api/results/user/:userId — Get all results for a user
