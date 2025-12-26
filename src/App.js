import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./Pages/Auth/Login";
import Signup from "./Pages/Auth/Signup";
import LandingPage from "./Pages/Landing/LandingPage";
import DashboardHome from "./Pages/Dashboard/DashboardHome";

import AlgorithmDetail from "./Pages/Algorithms/AlgorithmDetail";

import { ContestRoutes } from "./Routes/ContestRoute";
import { ProblemRoutes } from "./Routes/ProblemRoute";
import { UserRoutes } from "./Routes/UserRoute";
import { PostRoutes } from "./Routes/PostRoute";

import { ProblemRequestRoutes } from "./Routes/ProblemRequestRoute";
import { SubmissionRoutes } from "./Routes/SubmissionRoute";
import AdminRoute from "./Routes/Auth/AdminRoute";
import AdminDashboard from "./Pages/Dashboard/AdminDashboard";
import { ThemeProvider } from "./Hook/ThemeContext";

// Admin Pages
import AllProblems from "./Pages/Problems/Admin/AllProblems";
import AddProblem from "./Pages/Problems/Admin/AddProblem";
import EditeProblem from "./Pages/Problems/Admin/EditeProblem";
import ViewProblem from "./Pages/Problems/Admin/ViewProblem";
import ProblemEvaluationAdmin from "./Pages/Problems/Admin/ProblemEvaluationAdmin";
import Users from "./Pages/User/Admin/Users";
import AddUser from "./Pages/User/Admin/add-user";
import ViewUser from "./Pages/User/Admin/ViewUser";
import EditUser from "./Pages/User/Admin/EditUser";
import ContestList from "./Pages/Contest/Admin/ContestList";
import AddContest from "./Pages/Contest/Admin/AddContest";
import EditContest from "./Pages/Contest/Admin/EditContest";
import AllPostAdmin from "./Pages/Posts/Admin/AllPostAdmin";
import EditePost from "./Pages/Posts/Admin/EditePost";
import AdminPostDetails from "./Pages/Posts/Admin/AdminPostDetails";
import AllProblemRequest from "./Pages/ProblemRequest/Admin/AllProblemRequest";
import EditProblemRequest from "./Pages/ProblemRequest/Admin/EditProblemRequest";
import ShowTags from "./Pages/ExplaineTag/Admin/ShowTags";
import AlgorithmsAdmin from "./Pages/ExplaineTag/Admin/AlgorithmsAdmin";
import AlgorithmDetailsShow from "./Pages/ExplaineTag/Admin/AlgorithmDetailsShow";
import AddAlgorithm from "./Pages/ExplaineTag/Admin/AddAlgorithm";
import EditAlgorithm from "./Pages/ExplaineTag/Admin/EditAlgorithm";
import UniversitiesAdmin from "./Pages/University/Admin/UniversitiesAdmin";
import UniversityShow from "./Pages/University/Admin/UniversityShow";
import AddUniversity from "./Pages/University/Admin/AddUniversity";
import EditUniversity from "./Pages/University/Admin/EditUniversity";
import EventsPage from "./Pages/Event/Admin/EventsPage";
import AddEvent from "./Pages/Event/Admin/AddEvent";
import ShowEvent from "./Pages/Event/Admin/Event";
import UpdateEvent from "./Pages/Event/Admin/UpdateEvent";
import Messages from "./Pages/Chat/Admin/Messages";
import ContestStagging from "./Pages/Contest/Admin/ContestStagging";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/react-app/login" element={<Login />} />
        <Route path="/react-app/signup" element={<Signup />} />
        <Route path="/react-app/dashboard" element={<DashboardHome />} />
        <Route 
          path="/react-app/admin/dashboard" 
          element={
            <AdminRoute>
              <ThemeProvider>
                <AdminDashboard />
              </ThemeProvider>
            </AdminRoute>
          } 
        />
        
        {/* Admin Routes - Nested Layout */}
        <Route 
          path="/react-app/admin/*" 
          element={
            <AdminRoute>
              <ThemeProvider>
                <AdminDashboard />
              </ThemeProvider>
            </AdminRoute>
          }
        >
          <Route index element={<div />} />
          <Route path="dashboard" element={<div />} />
          <Route path="Problem-List" element={<AllProblems />} />
          <Route path="AddProblem" element={<AddProblem />} />
          <Route path="users" element={<Users />} />
          <Route path="add-user" element={<AddUser />} />
          <Route path="contests" element={<ContestList />} />
          <Route path="AddContest" element={<AddContest />} />
          <Route path="posts" element={<AllPostAdmin />} />
          <Route path="problem-requests" element={<AllProblemRequest />} />
          <Route path="Algorithm" element={<ShowTags />} />
          <Route path="Algorithm/:id" element={<AlgorithmsAdmin />} />
          <Route path="Universities" element={<UniversitiesAdmin />} />
          <Route path="university/:id" element={<UniversityShow />} />
          <Route path="AddUniversity" element={<AddUniversity />} />
          <Route path="EventList" element={<EventsPage />} />
          <Route path="AddEvent" element={<AddEvent />} />
          <Route path="event/:id" element={<ShowEvent />} />
          <Route path="event/:id/edit" element={<UpdateEvent />} />
          <Route path="messages" element={<Messages />} />
          <Route path="Edit-problem/:id" element={<EditeProblem />} />
          <Route path="View-problem/:id" element={<ViewProblem />} />
          <Route path="ProblemEvaluation/:id" element={<ProblemEvaluationAdmin />} />
          <Route path="view-user/:id" element={<ViewUser />} />
          <Route path="edit-user/:id" element={<EditUser />} />
          <Route path="EditContest/:id" element={<EditContest />} />
          <Route path="AdminEditPost/:postId" element={<EditePost />} />
          <Route path="AdminPostDetails/:id" element={<AdminPostDetails />} />
          <Route path="EditProblemProposal/:id" element={<EditProblemRequest />} />
          <Route path="AddAlgorithm/:tagId" element={<AddAlgorithm />} />
          <Route path="EditAlgorithm/:id" element={<EditAlgorithm />} />
          <Route path="EditUniversity/:id" element={<EditUniversity />} />
          <Route path="AlgorithmDetails/:id" element={<AlgorithmDetailsShow />} />
        </Route>
        
        {/* Legacy Admin Routes (for backward compatibility) - using nested routes */}
        <Route 
          path="/react-app/Admin/*" 
          element={
            <AdminRoute>
              <ThemeProvider>
                <AdminDashboard />
              </ThemeProvider>
            </AdminRoute>
          }
        >
          <Route path="Edit-problem/:id" element={<EditeProblem />} />
          <Route path="View-problem/:id" element={<ViewProblem />} />
          <Route path="ProblemEvaluation/:id" element={<ProblemEvaluationAdmin />} />
          <Route path="Stagging/:id" element={<ContestStagging />} />
        </Route>
        
        <Route 
          path="/react-app/admin/EditUniversity/:id" 
          element={
            <AdminRoute>
              <ThemeProvider>
                <AdminDashboard />
              </ThemeProvider>
            </AdminRoute>
          } 
        />
        
        <Route path="/react-app/algorithm/:id" element={<AlgorithmDetail />} />

        {ContestRoutes}
        {ProblemRoutes} 
        {ProblemRequestRoutes}
        {UserRoutes}
        {PostRoutes}
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
