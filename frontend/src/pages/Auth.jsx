import React, { useState } from 'react';
import Login from './Login.jsx';
import Register from './Register.jsx';

const Auth = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = (loginData) => {
    // Mock authentication - in real app, validate with backend
    const mockUser = {
      id: 1,
      username: loginData.email.split('@')[0],
      displayName: "User",
      email: loginData.email,
      avatar: "https://picsum.photos/seed/user/100/100",
      university: "University",
      year: "Student",
      location: "Campus"
    };
    onAuthenticated(mockUser);
  };

  const handleRegister = (registerData) => {
    // Mock registration - in real app, create user in backend
    const newUser = {
      id: Date.now(),
      username: registerData.username,
      displayName: registerData.displayName,
      email: registerData.email,
      avatar: "https://picsum.photos/seed/" + registerData.username + "/100/100",
      university: registerData.university,
      year: "Student",
      location: "Campus"
    };
    onAuthenticated(newUser);
  };

  return isLogin ? (
    <Login 
      onLogin={handleLogin}
      onSwitchToRegister={() => setIsLogin(false)}
    />
  ) : (
    <Register 
      onRegister={handleRegister}
      onSwitchToLogin={() => setIsLogin(true)}
    />
  );
};

export default Auth;
