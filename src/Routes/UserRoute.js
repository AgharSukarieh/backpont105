import React from "react";
import { Route } from "react-router-dom";
import UserProfile from "../Pages/User/UserProfile";
import ContestProblems from "../Pages/Contest/VeiwContest";

export const UserRoutes = (
  <>

    <Route path="/react-app/Profile/:id" element={<UserProfile />}  />
    <Route path="/react-app/ViewContest/:id" element={<ContestProblems />}  />
    
    
    

  </>
);
