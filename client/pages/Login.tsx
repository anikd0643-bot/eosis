import { useAuth, type User } from "@/store/auth";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, LogIn, UserPlus, Shield } from "lucide-react";

interface AdminUser extends User {
  password?: string;
  isAdmin?: boolean;
}

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [userType, setUserType] = useState<"customer" | "admin">("customer");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Initialize admin account on mount
  useEffect(() => {
    const admins = getAdminUsers();
    if (admins.length === 0) {
      const defaultAdmin: AdminUser = {
        id: "admin_001",
        name: "Admin",
        email: "admin@example.com",
        mobile: "+88 01700000000",
        password: "admin123",
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      saveAdminUsers([defaultAdmin]);
    }
  }, []);

  // Get all users from localStorage
  const getAllUsers = (): User[] => {
    try {
      return JSON.parse(localStorage.getItem("all_users") || "[]");
    } catch {
      return [];
    }
  };

  // Save all users to localStorage
  const saveAllUsers = (users: User[]) => {
    localStorage.setItem("all_users", JSON.stringify(users));
  };

  // Get all admin users
  const getAdminUsers = (): AdminUser[] => {
    try {
      return JSON.parse(localStorage.getItem("admin_users") || "[]");
    } catch {
      return [];
    }
  };

  // Save admin users
  const saveAdminUsers = (users: AdminUser[]) => {
    localStorage.setItem("admin_users", JSON.stringify(users));
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!loginEmail || !loginPassword) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    if (userType === "admin") {
      // Admin login
      const admins = getAdminUsers();
      const admin = admins.find((a) => a.email === loginEmail);

      if (!admin) {
        setError("Admin account not found");
        setLoading(false);
        return;
      }

      if (admin.password !== loginPassword) {
        setError("Invalid password");
        setLoading(false);
        return;
      }

      // Admin login successful
      setTimeout(() => {
        signIn("admin", {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          createdAt: admin.createdAt,
        });
        nav("/admin");
        setLoading(false);
      }, 800);
    } else {
      // Customer login
      const users = getAllUsers();
      const user = users.find((u) => u.email === loginEmail);

      if (!user) {
        setError("Email not found. Please sign up first.");
        setLoading(false);
        return;
      }

      // Login successful
      setTimeout(() => {
        signIn("user", user);
        nav("/dashboard");
        setLoading(false);
      }, 800);
    }
  };

  // Handle Signup
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!signupName || !signupEmail || !signupMobile || !signupPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    // Check if email already exists
    const users = getAllUsers();
    if (users.some((u) => u.email === signupEmail)) {
      setError("Email already registered. Please log in.");
      setLoading(false);
      return;
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: signupName,
      email: signupEmail,
      mobile: signupMobile,
      createdAt: new Date().toISOString(),
    };

    // Save user to all_users
    saveAllUsers([...users, newUser]);

    setTimeout(() => {
      signIn("user", newUser);
      nav("/dashboard");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
              {mode === "login" ? <LogIn size={24} /> : <UserPlus size={24} />}
            </div>
            <h1 className="text-3xl font-bold font-['Playfair Display']">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-primary/90 text-sm mt-2">
              {mode === "login"
                ? "Sign in to access your orders and preferences"
                : "Join us for exclusive deals and faster checkout"}
            </p>
          </div>

          {/* User Type Tabs */}
          {mode === "login" && (
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setUserType("customer");
                  setError("");
                  setLoginEmail("");
                  setLoginPassword("");
                }}
                className={`flex-1 py-4 font-semibold text-center transition-all ${
                  userType === "customer"
                    ? "bg-white border-b-2 border-primary text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                👤 Customer
              </button>
              <button
                onClick={() => {
                  setUserType("admin");
                  setError("");
                  setLoginEmail("");
                  setLoginPassword("");
                }}
                className={`flex-1 py-4 font-semibold text-center transition-all ${
                  userType === "admin"
                    ? "bg-white border-b-2 border-primary text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🛡️ Admin
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Login Mode */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📧 Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔐 Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Sign In
                    </>
                  )}
                </button>

                {/* Switch to Signup */}
                <div className="text-center pt-4">
                  <p className="text-gray-600 text-sm">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Signup Mode */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Info Message for Customer Only */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    📝 <strong>Customer Registration</strong><br/>
                    Create your account to start shopping and access exclusive features.
                  </p>
                </div>
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👤 Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📧 Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Mobile Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📱 Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="+88 017XXXXXXXX"
                      value={signupMobile}
                      onChange={(e) => setSignupMobile(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔐 Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔐 Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Signup Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Create Account
                    </>
                  )}
                </button>

                {/* Switch to Login */}
                <div className="text-center pt-4">
                  <p className="text-gray-600 text-sm">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              By continuing, you agree to our{" "}
              <Link to="/policies" className="text-primary hover:underline">
                Terms & Conditions
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 space-y-3 text-center text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold mb-2">👤 Customer Demo Login</p>
            <p className="text-blue-700 text-xs">Create your account or use any test credentials</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 font-semibold mb-2">🛡️ Admin Demo Login</p>
            <p className="text-purple-700 text-xs mb-2">Switch to <strong>Admin</strong> tab to login</p>
            <div className="bg-white rounded p-2 text-left font-mono text-xs space-y-1">
              <p className="text-gray-700">📧 Email: <span className="text-purple-600">admin@example.com</span></p>
              <p className="text-gray-700">🔐 Password: <span className="text-purple-600">admin123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
