import React from "react";
import { Route } from "react-router-dom";
import Problem from "../Pages/Problem/ListPorblems";
import ProblemSolver from "../Pages/Problem/ProblemSolver";

export const ProblemRoutes = (
  <>
    <Route path="/react-app/problems" element={<Problem />} />
    <Route path="/react-app/Problem/:id" element={<ProblemSolver />} />
    <Route path="/react-app/problem/:id" element={<ProblemSolver />} />
  </>
);
