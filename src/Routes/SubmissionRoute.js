import React from "react";
import { Route } from "react-router-dom";
import PrivateRoute from "./Auth/PrivateRoute";
import UserSubmissions from "../Pages/Submission/Submissions";
import SubmissionDetail from "../Pages/Submission/SubmissionDetail";

export const SubmissionRoutes = (
  <>
    
    <Route path="/submissions/:id" element={ <UserSubmissions /> } />

    <Route
      path="/submission/:id"
      element={
        <PrivateRoute>
          <SubmissionDetail />
        </PrivateRoute>
      }
    />

    
    

  </>
);
