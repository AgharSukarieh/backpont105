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
      path="/react-app/addProblemProposal"
      element={
        <PrivateRoute>
          <AddProblemProposal />
        </PrivateRoute>
      }
    />
  
    <Route
      path="/react-app/UpdateProblemProposals"
      element={
        <PrivateRoute>
          <UpdateProblemRequest />
        </PrivateRoute>
      }
    />
    
  
    <Route
      path="/react-app/AllProblemProposals"
      element={
        <PrivateRoute>
          <AllProblemProposals />
        </PrivateRoute>
      }
    />
    
    
  
    <Route
      path="/react-app/ViewProblemRequest"
      element={
        <PrivateRoute>
          <ViewProblemRequest />
        </PrivateRoute>
      }
    />
    
    
    
  </>
);
