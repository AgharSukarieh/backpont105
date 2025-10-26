import React from "react";
import { Route } from "react-router-dom";
import Problem from "../Pages/Problem/Porblem";
import Problems from "../Pages/Problem/AllProblem";

export const ProblemRoutes = (
  <>

    <Route path="/problems" element={<Problems />} />

    <Route path="/problem/:id" element={<Problem />} />
    
  </>
);
