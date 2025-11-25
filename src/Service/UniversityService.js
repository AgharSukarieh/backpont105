import api from "./api";

export const getAllUniversities = async () => {
  const res = await api.get("/University/GetAll");
  return res.data;
};

export const getUniversityById = async (id) => {
  const res = await api.get(`/University/GetById/${id}`);
  return res.data;
};

export const updateUniversity = async (university) => {
  const res = await api.put("/University/Update", university);
  return res.data;
};

export const deleteUniversity = async (id) => {
  const res = await api.delete(`/University/Delete/${id}`);
  return res.data;
};

