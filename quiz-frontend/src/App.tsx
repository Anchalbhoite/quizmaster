import React, { useState, useEffect } from "react";
import {
  Clock, Trophy, BookOpen, Users, Play, RotateCcw, Home, User,
  Sun, Moon, LogIn, LogOut, UserPlus, Mail, Lock, Eye, EyeOff
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Separator } from "./components/ui/separator";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { motion } from "motion/react";

// ---------------- Types ----------------
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

interface Quiz {
  id: number;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
  timeLimit: number;
  description: string;
}

interface QuizResult {
  quizId: number;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
}

interface User {
  id: string;
  email: string;
  name: string;
  joinedAt: Date;
}

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const API_URL = "http://localhost:5000";

// ---------------- API Helper ----------------
async function apiRequest(endpoint: string, method = "GET", body?: any, token?: string) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error((await res.json()).message || "API Error");
  }
  return res.json();
}

// ---------------- Main Component ----------------
type Page = "home" | "quiz" | "taking" | "results" | "leaderboard" | "profile" | "login" | "signup";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  // States
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // ---------------- Auth Handlers ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");
    try {
      const data = await apiRequest("/api/auth/login", "POST", loginForm);
      const newUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        joinedAt: new Date(data.user.joinedAt),
      };
      localStorage.setItem("quizmaster_token", data.token);
      localStorage.setItem("quizmaster_user", JSON.stringify(newUser));
      setUser(newUser);
      setCurrentPage("home");
      setLoginForm({ email: "", password: "" });
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");
    try {
      if (signupForm.password !== signupForm.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const data = await apiRequest("/api/auth/signup", "POST", signupForm);
      const newUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        joinedAt: new Date(data.user.joinedAt),
      };
      localStorage.setItem("quizmaster_token", data.token);
      localStorage.setItem("quizmaster_user", JSON.stringify(newUser));
      setUser(newUser);
      setCurrentPage("home");
    } catch (err: any) {
      setAuthError(err.message || "Signup failed");
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("quizmaster_token");
    localStorage.removeItem("quizmaster_user");
    setCurrentPage("login");
  };

  // ---------------- Quiz Handlers ----------------
  const startQuiz = (quiz: Quiz) => {
    if (!user) {
      setCurrentPage("login");
      return;
    }
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTimeRemaining(quiz.timeLimit * 60);
    setQuizStartTime(new Date());
    setCurrentPage("taking");
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleQuizComplete = async () => {
    if (!selectedQuiz || !quizStartTime) return;

    let score = 0;
    selectedQuiz.questions.forEach((q, idx) => {
      if (Number(userAnswers[idx]) === Number(q.correctAnswer)) score++;
    });

    const result: QuizResult = {
      quizId: selectedQuiz.id,
      score,
      totalQuestions: selectedQuiz.questions.length,
      timeSpent: Math.floor((Date.now() - quizStartTime.getTime()) / 1000),
      completedAt: new Date(),
    };

    try {
      const token = localStorage.getItem("quizmaster_token") || "";
      await apiRequest("/api/result", "POST", result, token);
    } catch (err) {
      console.error("Error saving result", err);
    }

    const newResults = [...quizResults, result];
    setQuizResults(newResults);
    localStorage.setItem("quizmaster_results", JSON.stringify(newResults));
    setCurrentPage("results");
  };

  // ---------------- Effects ----------------
  useEffect(() => {
  const storedUser = localStorage.getItem("quizmaster_user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    parsedUser.joinedAt = new Date(parsedUser.joinedAt); // ✅ convert to Date
    setUser(parsedUser);
    setCurrentPage("home");
  }
}, []);
useEffect(() => {
  const storedResults = localStorage.getItem("quizmaster_results");
  if (storedResults) {
    const parsedResults = JSON.parse(storedResults).map((result: any) => ({
      ...result,
      completedAt: new Date(result.completedAt) // ✅ convert to Date
    }));
    setQuizResults(parsedResults);
  }
}, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("quizmaster_token") || "";
        const data = await apiRequest("/api/quizzes", "GET", undefined, token);
        setQuizzes(data);
      } catch (err) {
        console.error("Error fetching quizzes", err);
      }
    };
    if (user) fetchQuizzes();
  }, [user]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await apiRequest("/api/leaderboard");
        setLeaderboard(data);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      }
    };
    fetchLeaderboard();
  }, [quizResults]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentPage === "taking" && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleQuizComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentPage, timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

 const getCategoryIcon = (category?: string) => {
  if (!category) return '📖'; // default icon if category is missing

  switch (category.toLowerCase()) {
    case 'technology': return '💻';
    case 'history': return '📚';
    case 'science': return '🔬';
    case 'sports': return '⚽';
    default: return '📖';
  }
};


  const renderLogin = () => (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your QuizMaster account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {authError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {authError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => {
                      setCurrentPage('signup');
                      setAuthError('');
                    }}
                  >
                    Sign up
                  </Button>
                </p>
              </div>
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
                <p className="text-xs text-muted-foreground">Email: anchalbhoite@gmail.com</p>
                <p className="text-xs text-muted-foreground">Password: 1234</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderSignup = () => (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join QuizMaster and start learning today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {authError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {authError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => {
                      setCurrentPage('login');
                      setAuthError('');
                    }}
                  >
                    Sign in
                  </Button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 p-8 text-white"
      >
        <div className="relative z-10">
          <h1 className="mb-4 text-4xl">Welcome to QuizMaster</h1>
          <p className="mb-6 text-xl opacity-90">Challenge yourself with our diverse collection of quizzes and track your progress!</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>{quizzes.length} Quizzes Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Join 10,000+ Learners</span>
            </div>
          </div>
        </div>
        
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl">
                {quizResults.length}
              </p>
              <p className="text-sm text-muted-foreground">Quizzes Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl">
                {quizResults.length > 0 ? Math.round(quizResults.reduce((acc, result) => acc + (result.score / result.totalQuestions * 100), 0) / quizResults.length) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl">156</p>
              <p className="text-sm text-muted-foreground">Global Ranking</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Quizzes */}
      <div>
        <h2 className="mb-6 text-2xl">Available Quizzes</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(quiz.category)}</span>
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.category}</CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getDifficultyColor(quiz.difficulty)} text-white`}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{quiz.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.timeLimit} min</span>
                    </div>
                  </div>
                  <Button 
                    className="mt-4 w-full"
                    onClick={() => startQuiz(quiz)}
                    disabled={!user}
                  >
                    {user ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Quiz
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Login Required
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuizTaking = () => {
    if (!selectedQuiz) return null;

    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Quiz Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedQuiz.title}</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 60 ? 'text-red-500' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={userAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                    className="w-full justify-start p-4 text-left"
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={goToNextQuestion}
            disabled={userAnswers[currentQuestionIndex] === undefined}
          >
            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
          </Button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!selectedQuiz || quizResults.length === 0) return null;

    const latestResult = quizResults[quizResults.length - 1];
    const scorePercentage = (latestResult.score / latestResult.totalQuestions) * 100;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="text-center">
            <CardHeader>
              
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription>Great job on completing {selectedQuiz.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-6xl text-primary">
                  {scorePercentage.toFixed(0)}%
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-2xl">{latestResult.score}</p>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                  </div>
                  <div>
                    <p className="text-2xl">{latestResult.totalQuestions}</p>
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                  </div>
                  <div>
                    <p className="text-2xl">{formatTime(latestResult.timeSpent)}</p>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Answer Review</h3>
                  {selectedQuiz.questions.map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="text-sm">
                        Question {index + 1}: {question.question || question.question}
                      </span>
                      <span className={`text-sm ${Number(userAnswers[index]) === Number(question.correctAnswer) ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(userAnswers[index]) === Number(question.correctAnswer) ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  ))}

                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setCurrentPage('home')} className="flex-1">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                  <Button variant="outline" onClick={() => startQuiz(selectedQuiz)} className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">See how you rank against other quiz masters</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <Avatar>
                  <AvatarFallback>
                    {(user.userId?.name || "")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p>{user.userId?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{user.quizzes || 0} quizzes completed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg">{user.score || 0}%</p>
                  <p className="text-sm text-muted-foreground">avg score</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarFallback className="text-2xl">
            {user?.name.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl mb-2">{user?.name || 'User'}</h1>
        <p className="text-muted-foreground">
          Quiz Enthusiast since {user?.joinedAt?.getFullYear() || new Date().getFullYear()}
        </p>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-4"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Quizzes Completed</span>
              <span>{quizResults.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Average Score</span>
              <span>
                {quizResults.length > 0 
                  ? Math.round(quizResults.reduce((acc, result) => acc + (result.score / result.totalQuestions * 100), 0) / quizResults.length)
                  : 0}%
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Total Time Spent</span>
              <span>
                {formatTime(quizResults.reduce((acc, result) => acc + result.timeSpent, 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {quizResults.length > 0 ? (
              <div className="space-y-4">
                {quizResults.slice(-5).reverse().map((result, index) => {
                  const quiz = quizzes.find(q => q.id === result.quizId);
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">{quiz?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.completedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Math.round((result.score / result.totalQuestions) * 100)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No quiz attempts yet. Start your first quiz!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-xl">QuizMaster</h1>
                {user && (
                  <div className="hidden md:flex gap-6">
                    <Button 
                      variant={currentPage === 'home' ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage('home')}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                    <Button 
                      variant={currentPage === 'leaderboard' ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage('leaderboard')}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Leaderboard
                    </Button>
                    <Button 
                      variant={currentPage === 'profile' ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage('profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <div className="hidden sm:flex items-center gap-2 mr-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </div>
                )}
                {!user && (
                  <div className="flex gap-2 mr-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentPage('login')}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setCurrentPage('signup')}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {currentPage === 'login' && renderLogin()}
          {currentPage === 'signup' && renderSignup()}
          {currentPage === 'home' && user && renderHome()}
          {currentPage === 'taking' && user && renderQuizTaking()}
          {currentPage === 'results' && user && renderResults()}
          {currentPage === 'leaderboard' && user && renderLeaderboard()}
          {currentPage === 'profile' && user && renderProfile()}
          {!user && currentPage !== 'login' && currentPage !== 'signup' && renderLogin()}
        </main>
      </div>
    </div>
  );
}
export default App;