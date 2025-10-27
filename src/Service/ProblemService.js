import api from "./api";

import axios from "axios";

const BASE_URL = "http://arabcodetest.runasp.net/Problem";


export const getProblemsPaging = async (page = 1, perPage = 10, userId = 1) => {
  const response = await axios.get(`${BASE_URL}/GetPagingProblemList`, {
    params: {
      numberPage: page,
      perPage: perPage,
      idUser: userId,
    },
  });
  return response.data;
};




export const getProblemById = async (id) => {
  const response = await api.get(`/problems/${id}`);
  return response.data;
};

export const addProblem = async (data) => {
  const response = await api.post("/problems", data);
  return response.data;
};
