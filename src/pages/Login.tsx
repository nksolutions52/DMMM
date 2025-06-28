import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, isAuthenticated, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    await login(email, password);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative overflow-hidden">
      {/* Decorative SVG */}
      <svg className="absolute left-0 top-0 w-96 h-96 opacity-20 -z-10" viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="200" fill="url(#paint0_radial)" />
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(200 200) scale(200)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#f472b6" stopOpacity="0.5" />
          </radialGradient>
        </defs>
      </svg>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-purple-500 to-pink-500 shadow-lg">
              <ShieldCheck size={36} className="text-white" />
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 drop-shadow">
            DRIVE DESK
          </h1>
          <p className="mt-2 text-gray-600 font-medium">Smart Access to Road Authority Services</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign in to your account</h2>
          {(error || formError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error || formError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@rta.gov"
              fullWidth
              leftIcon={<User size={18} className="text-gray-400" />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              fullWidth
              leftIcon={<KeyRound size={18} className="text-gray-400" />}
              autoComplete="current-password"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                  Forgot password?
                </a>
              </div>
            </div>
            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white font-bold shadow hover:from-blue-700 hover:to-pink-600 transition"
            >
              Sign in
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              <span className="font-semibold text-gray-700">Demo credentials:</span> agent@rta.gov / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;