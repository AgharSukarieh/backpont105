import api from "./api";

export const getAllCountries = async () => {
  const res = await api.get("/Country/GetAllCountries");
  return res.data;
};

export const deleteCountry = async (id) => {
  return await api.delete("/Country/DeleteCountry", { params: { id } });
};

export const updateCountry = async (country, imageFile) => {
  const formData = new FormData();

  if (imageFile) {
    formData.append("imageCountry", imageFile);
  }

  return await api.put("/Country/UpdateCountry", formData, {
    params: {
      Id: country.id,
      nameCountry: country.nameCountry,
    },
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const addCountry = async (country, imageFile) => {
  const formData = new FormData();
  formData.append("nameCountry", country.nameCountry);
  formData.append("imageCountry", imageFile);

  return await api.post("/Country/AddCountry", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

