import React, { useState } from "react";

const Signup = ({ onSignup, setPage }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignup({ name, email, university: university || "Not specified" });
    alert("Account created successfully! Welcome to ArabCode.");
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">Create Account</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          <input type="text" placeholder="University (optional)" value={university} onChange={e=>setUniversity(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">Create Account</button>
        </form>
        <p className="text-sm text-gray-600 text-center">
          Already have an account? <button onClick={()=>setPage("login")} className="text-indigo-600">Sign in here</button>
        </p>
      </div>
    </div>
  );
};

export default Signup;