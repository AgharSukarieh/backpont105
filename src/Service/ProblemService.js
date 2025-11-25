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
  const response = await api.get(`/Problem/${id}`);
  return response.data;
};

export const addProblem = async (data) => {
  const response = await api.post("/problems", data);
  return response.data;
};

export const searchProblems = async (params) => {
  try {
    console.log("🌐 API Search Request:", params);
    console.log("📍 Full URL:", `${BASE_URL}/SearchProblem?${new URLSearchParams(params).toString()}`);
    
    const response = await api.get("/Problem/SearchProblem", { params });
    
    console.log("✅ API Response:", response.data);
    console.log("📊 Total results:", Array.isArray(response.data) ? response.data.length : 'Not an array');
    
    return response.data;
  } catch (err) {
    console.error("❌ API Error:", err.response?.data || err.message);
    console.error("❌ Error details:", {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      errors: err.response?.data?.errors
    });
    console.error("❌ Full error:", err);
    throw err;
  }
};

export const getAllGeneralInfoUser = async () => {
  try {
    const response = await api.get("/General/AllGeneralInfoUser");
    return response.data;
  } catch (err) {
    console.error("❌ Error fetching general info:", err);
    throw err;
  }
};
