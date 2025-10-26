import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./Navbar";
import Login from "./Pages/Auth/Login";
import Signup from "./Pages/Auth/Signup";

import AlgorithmsList from "./Pages/algorithm/AlgorithmsList";
import AlgorithmDetail from "./Pages/algorithm/AlgorithmDetail";

import { ContestRoutes } from "./Routes/ContestRoute";
import { ProblemRoutes } from "./Routes/ProblemRoute";
import { UserRoutes } from "./Routes/UserRoute";

import { ProblemRequestRoutes } from "./Routes/ProblemRequestRoute";
import { SubmissionRoutes } from "./Routes/SubmissionRoute";



function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* <Route path="/problems" element={<Problems />} /> */}
        <Route path="/algorithms" element={<AlgorithmsList />} />
        <Route path="/algorithm/:id" element={<AlgorithmDetail />} />



        {ContestRoutes}
        {ProblemRoutes} 
        {ProblemRequestRoutes}
        {UserRoutes}
        {SubmissionRoutes}


        {/* <Route
          path="/userprofile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        /> */}

        {/* <Route
          path="/addproblemproposal"
          element={
            <PrivateRoute>
              <AddProblemProposal />
            </PrivateRoute>
          }
        /> */}

        {/* <Route
          path="/usersubmissions"
          element={
            <PrivateRoute>
              <UserSubmissions />
            </PrivateRoute>
          }
        />

        <Route
          path="/submission/:id"
          element={
            <PrivateRoute>
              <SubmissionDetail />
            </PrivateRoute>
          }
        /> */}

        {/* <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <h2>Admin Dashboard</h2>
            </AdminRoute>
          }
        /> */}

        {/* <Route
          path="/admin/manageproblems"
          element={
            <AdminRoute>
              <h2>Manage Problems (Admin)</h2>
            </AdminRoute>
          }
        /> */}

        <Route path="/not-authorized" element={<h2>Not Authorized</h2>} />
        <Route path="*" element={<h2>Page Not Found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
