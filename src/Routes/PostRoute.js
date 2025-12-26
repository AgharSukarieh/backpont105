import React from "react";
import { Route } from "react-router-dom";
import PostDetails from "../Pages/Posts/User/Post";

export const PostRoutes = (
  <>
    <Route path="/react-app/Post/:id" element={<PostDetails />} />
  </>
);

