import React from "react";
import { Route } from "react-router-dom";
import Problem from "../Pages/Problem/ListPorblems";
import ProblemSolver from "../Pages/Problem/ProblemSolver";

export const ProblemRoutes = (
  <>
    <Route path="/problems" element={<Problem />} />
    <Route path="/Problem/:id" element={<ProblemSolver />} />
    <Route path="/problem/:id" element={<ProblemSolver />} />
  </>
);
