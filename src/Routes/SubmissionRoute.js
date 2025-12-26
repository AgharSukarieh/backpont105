import React from "react";
import { Route } from "react-router-dom";
import PrivateRoute from "./Auth/PrivateRoute";
import UserSubmissions from "../Pages/Submission/Submissions";
import SubmissionDetail from "../Pages/Submission/SubmissionDetail";

export const SubmissionRoutes = (
  <>
    
    <Route path="/react-app/submissions/:id" element={ <UserSubmissions /> } />

    <Route
      path="/react-app/submission/:id"
      element={
        <PrivateRoute>
          <SubmissionDetail />
        </PrivateRoute>
      }
    />

    
    

  </>
);
