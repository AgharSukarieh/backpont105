import api from "./api";

export const getAllTags = async () => {
  try {
    const response = await api.get("/AllTags");
    return response.data;
  } catch (err) {
    console.error("Error fetching tags:", err);
    throw err;
  }
};

export const getTagById = async (id) => {
  try {
    const response = await api.get(`/Tag/${id}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching tag:", err);
    throw err;
  }
};

export const addTag = async (tagData) => {
  try {
    const response = await api.post("/Tag/Add", tagData);
    return response.data;
  } catch (err) {
    console.error("Error adding tag:", err);
    throw err;
  }
};

export const updateTag = async (tagData) => {
  try {
    const response = await api.put("/Tag/Update", tagData);
    return response.data;
  } catch (err) {
    console.error("Error updating tag:", err);
    throw err;
  }
};

export const deleteTag = async (id) => {
  try {
    const response = await api.delete(`/Tag/Delete/${id}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting tag:", err);
    throw err;
  }
};

// جلب الخوارزميات حسب التصنيف
export const getExplaineTagsByTagId = async (tagId) => {
  try {
    const response = await api.get(`/ExplaineTag/GetExplaineTagByTagId?id=${tagId}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching algorithms by tag:", err);
    throw err;
  }
};

// جلب تفاصيل خوارزمية معينة
export const getExplaineTagById = async (id) => {
  try {
    const response = await api.get(`/ExplaineTag/GetExplaineTagById?id=${id}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching algorithm details:", err);
    throw err;
  }
};
