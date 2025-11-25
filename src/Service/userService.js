import api from "./api";

export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/Authantication/login", {
      Email: email,
      Password: password,
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "خطأ في تسجيل الدخول، حاول مرة أخرى لاحقاً";
    throw new Error(errorMessage);
  }
};

export const getUserById = async (id) => {
  const res = await api.get(`/User/${id}`);
  return res.data;
};

export const updateUser = async (payload) => {
  const res = await api.put("/User/UpdateUser", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const getAllUsers = async () => {
  try {
    const res = await api.get("/User/GetAllUsersAsync");
    return res.data;
  } catch (err) {
    console.error("خطأ في جلب المستخدمين:", err);
    throw new Error("فشل تحميل المستخدمين 😢");
  }
};

export const deleteUser = async (userId) => {
  try {
    await api.delete(`/User/delete/${userId}`);
  } catch (err) {
    console.error("خطأ في حذف المستخدم:", err);
    throw new Error("حدث خطأ أثناء الحذف!");
  }
};

export const uploadUserImage = async (imageFile, currentImageURL = "") => {
  if (!imageFile) return currentImageURL;

  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await api.post("/upload/UploadImage", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const GetTopCoder = async () => {
  try {
    const res = await api.get("/User/GetTopCoder");
    return res.data;
  } catch (err) {
    console.error("خطأ في جلب المستخدمين:", err);
    throw new Error("فشل تحميل المستخدمين 😢");
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await api.post(`/Authantication/verify-otp`, {
      email,
      otp,
    });
    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
