import React from "react";
import { Route } from "react-router-dom";
import PrivateRoute from "./Auth/PrivateRoute";
import AddProblemProposal from "../Pages/ProblemRequest/addProblemRequest";
import AllProblemProposals from "../Pages/ProblemRequest/AllProblemProposals";
import UpdateProblemRequest from "../Pages/ProblemRequest/UpdateProblemProposals";
import ViewProblemRequest from "../Pages/ProblemRequest/ViewProblemRequest";
import AdminRoute from "./Auth/AdminRoute";


export const ProblemRequestRoutes = (
  <>
  
    <Route
      path="/addProblemProposal"
      element={
        <AdminRoute>
          <AddProblemProposal />
        </AdminRoute>
      }
    />
  
    <Route
      path="/UpdateProblemProposals"
      element={
        <PrivateRoute>
          <UpdateProblemRequest />
        </PrivateRoute>
      }
    />
    
  
    <Route
      path="/AllProblemProposals"
      element={
        <PrivateRoute>
          <AllProblemProposals />
        </PrivateRoute>
      }
    />
    
    
  
    <Route
      path="/ViewProblemRequest"
      element={
        <PrivateRoute>
          <ViewProblemRequest />
        </PrivateRoute>
      }
    />
    
    
    
  </>
);
