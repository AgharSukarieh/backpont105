import React from "react";
import { Route } from "react-router-dom";
import Problem from "../Pages/Problem/ListPorblems";
import Problems from "../Pages/Problem/Problem";

export const ProblemRoutes = (
  <>

    <Route path="/problems" element={<Problems />} />

    <Route path="/Problem/:id" element={<Problem />} />
    
  </>
);
