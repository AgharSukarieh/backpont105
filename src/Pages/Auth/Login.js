
import React, { useState } from "react";

const Login = ({ onLogin, setPage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ name: "Ahmed", email, university: "Cairo University" });
    alert("Login successful! Welcome to ArabCode.");
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">Sign in to ArabCode</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label>Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">Sign In</button>
        </form>
        <p className="text-sm text-gray-600 text-center">
          Don't have an account? <button onClick={() => setPage("signup")} className="text-indigo-600">Sign up here</button>
        </p>
      </div>
    </div>
  );
};

export default Login;