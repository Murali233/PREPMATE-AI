# PREPMATE AI

A sophisticated interview preparation platform powered by Gemini AI to help candidates practice and prepare for technical interviews.

## 🌟 Features

- **AI-Powered Questions**: Dynamically generated interview questions based on role and experience
- **Personalized Experience**: Customized preparation paths for different roles and experience levels
- **Interactive Sessions**: Real-time AI responses and explanations
- **Progress Tracking**: Monitor your preparation journey
- **User Authentication**: Secure access to personalized content
- **Responsive Design**: Seamless experience across devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Google's Gemini AI API

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Gemini AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/PrepMate-AI.git
   cd PrepMate-AI
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```
   Create a .env file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   ```
   Create a .env file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd Backend
   npm run dev
   ```
   Server will run on http://localhost:5000

2. **Start Frontend Development Server**
   ```bash
   cd Frontend
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## 📁 Project Structure

### Backend Structure
```
Backend/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/          # Helper functions
└── server.js       # Entry point
```

### Frontend Structure
```
Frontend/
├── src/
│   ├── assets/     # Static files
│   ├── components/ # Reusable components
│   ├── context/    # React context
│   ├── pages/      # Page components
│   ├── utils/      # Helper functions
│   ├── App.jsx     # Root component
│   └── main.jsx    # Entry point
└── index.html
```

## 🔒 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Interview Sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions` - Get user sessions
- `GET /api/sessions/:id` - Get specific session

### AI Integration
- `POST /api/ai/generate-questions` - Generate interview questions
- `POST /api/ai/generate-explanation` - Get detailed explanations

## 💡 Key Features Explanation

### 1. Authentication System
- JWT-based authentication
- Secure password hashing
- Protected routes
- Session management

### 2. Interview Session Management
- Custom session creation
- Progress tracking
- Session history
- Performance analytics

### 3. AI Integration
- Dynamic question generation
- Contextual answers
- Real-time explanations
- Difficulty adjustment

### 4. User Experience
- Responsive design
- Intuitive navigation
- Progress indicators
- Error handling

## 🔐 Security Features

- JWT Authentication
- Password Hashing
- Rate Limiting
- Input Validation
- XSS Protection
- CORS Configuration

## 🧪 Testing

Run backend tests:
```bash
cd Backend
npm test
```

Run frontend tests:
```bash
cd Frontend
npm test
```

## 📈 Performance Optimization

- API Response Caching
- Image Optimization
- Code Splitting
- Lazy Loading
- MongoDB Indexing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work - [YourGithub](https://github.com/Murali233)

## 🙏 Acknowledgments

- Google's Gemini AI team for the API
- MongoDB team for the database
- React and Vite teams for the frontend frameworks
- Express.js team for the backend framework

