import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";
import { ContestUserProvider } from "./Hook/UserContext";
import UserProfile from "./User/UserProfile";
import Problems from "./Problem/AllProblem";
import Problem from "./Problem/Porblem";

import AlgorithmDetail from "./algorithm/AlgorithmDetail";
import AlgorithmsList from "./algorithm/AlgorithmsList";
import ContestPage from "./Contest/Contests";
import AddProblemProposal from "./ProblemRequest/addProblemRequest";
import UserSubmissions from "./Submission/Submissions";
import SubmissionDetail from "./Submission/SubmissionDetail";



function App() {
  return (
    <Router>
      <ContestUserProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/Userprofile" element={<UserProfile />} />
          <Route path="/Problems" element={<Problems />} />
          <Route path="/Problem" element={<Problem />} />
          <Route path="/contests" element={<ContestPage />} />
          <Route path="/AddProblemProposal" element={<AddProblemProposal/>} />
        
          <Route path="/UserSubmissions" element={<UserSubmissions/>} />
          <Route path="/submission/:id" element={<SubmissionDetail />} />


          <Route path="/Algorithm/:id" element={<AlgorithmDetail />} />
          <Route path="/Algorithms" element={<AlgorithmsList/>} />
      
      </Routes>
      {/* <Footer/> */}
      </ContestUserProvider>
    </Router>
  );
}

export default App;
