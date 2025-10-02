🎯 QuizMaster

QuizMaster is a modern, full-stack quiz application built with React (frontend), Node.js + Express (backend), and MongoDB (database).
It allows users to sign up, take quizzes across different categories, track results, and view a leaderboard.

🚀 Features

🔐 User Authentication — Sign up and log in securely with JWT tokens

📝 Dynamic Quizzes — Multiple quizzes stored in MongoDB, loaded dynamically

🏆 Leaderboard — Tracks top scorers with sorting

💾 Result Storage — Quiz results stored in MongoDB for persistence

📱 Responsive UI — Works across devices

🛠 Tech Stack

Frontend: React, TypeScript, Tailwind CSS

Backend: Node.js, Express

Database: MongoDB Atlas

Authentication: JWT

Version Control: Git & GitHub

📂 Project Structure
quizmaster/
│── backend/          # Express API
│   ├── controller/   # API controllers
│   ├── models/       # Mongoose models
│   ├── routes/       # Express routes
│   └── server.js     # Backend entry point
│
│── frontend/         # React application
│   ├── src/          # React source code
│   ├── public/       # Static files
│   └── package.json  # Frontend dependencies
│
│── README.md         # Project documentation
└── .gitignore        # Ignored files

🛠️ Setup & Run Locally

```bash
#1️⃣ Clone the repository
git clone https://github.com/anchalbhoite/quizmaster.git
cd quizmaster

2️⃣ Setup Backend
cd backend
npm install
```bash


Create a .env file inside backend/ and add:
```bash
PORT=5000
MONGO_URI=mongodb+srv://Anchal:Anchal05@cluster0.qxuf3fk.mongodb.net/quizmaster?retryWrites=true&w=majority
JWT_SECRET=mysecretkey
VITE_API_URL=http://localhost:5000
```

Run backend server:
```bash
npx nodemon server.js
```

Server will run on 👉 http://localhost:5000

3️⃣ Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on 👉 http://localhost:3000

📦 API Endpoints
```bash
🔑 Auth
POST   /api/auth/signup     # Register a new user
POST   /api/auth/login      # Login and receive JWT token

📝 Quizzes
GET    /api/quizzes         # Get all quizzes
GET    /api/quizzes/:id     # Get quiz details by ID

📊 Results
POST   /api/results               # Save quiz result (authenticated)
GET    /api/results/leaderboard   # Get top scores
GET    /api/results/user/:userId  # Get all results for a user
```

