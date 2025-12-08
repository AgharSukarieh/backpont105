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

export const sendOtp = async (email) => {
  try {
    if (!email) {
      throw new Error("البريد الإلكتروني مطلوب");
    }
    
    const emailValue = email.trim();
    
    console.log("Sending OTP request:", { email: emailValue });
    
    // استخدام POST بدلاً من GET (حسب API documentation - POST /Authantication/Send-otp)
    const response = await api.post(`/Authantication/Send-otp`, null, {
      params: {
        Email: emailValue
      }
    });
    
    console.log("Send OTP response:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error sending OTP:", err?.response?.data || err);
    const errorMessage = err?.response?.data?.message || 
                        err?.message ||
                        "خطأ في إرسال رمز التحقق";
    throw new Error(errorMessage);
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    if (!email || !otp) {
      throw new Error("البريد الإلكتروني ورمز OTP مطلوبان");
    }
    
    const otpValue = otp.toString().trim();
    const emailValue = email.trim();
    
    console.log("Sending OTP verification:", { email: emailValue, otp: otpValue });
    
    const response = await api.post(`/Authantication/verify-otp`, {
      Email: emailValue,
      Otp: otpValue,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("OTP verification response:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error verifying OTP:", err?.response?.data || err);
    const errorMessage = err?.response?.data?.message || 
                        err?.response?.data?.errors?.otp?.[0] ||
                        err?.message ||
                        "خطأ في التحقق من OTP";
    throw new Error(errorMessage);
  }
};

export const sendOtpForRestorePassword = async (email) => {
  try {
    if (!email) {
      throw new Error("البريد الإلكتروني مطلوب");
    }
    
    const emailValue = email.trim();
    
    console.log("Sending OTP for password restoration:", { email: emailValue });
    
    const response = await api.post(`/Authantication/SendOTPForRestorePassword`, null, {
      params: {
        Email: emailValue
      }
    });
    
    console.log("Send OTP for restore password response:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error sending OTP for restore password:", err?.response?.data || err);
    const errorMessage = err?.response?.data?.message || 
                        err?.message ||
                        "خطأ في إرسال رمز التحقق";
    throw new Error(errorMessage);
  }
};

export const restorePassword = async (email, otp, newPassword) => {
  try {
    if (!email || !otp || !newPassword) {
      throw new Error("جميع الحقول مطلوبة");
    }
    
    const emailValue = email.trim();
    const otpValue = otp.toString().trim();
    
    console.log("Restoring password:", { email: emailValue, otp: otpValue });
    
    const response = await api.post(`/Authantication/RestorationPassword`, {
      email: emailValue,
      otp: otpValue,
      password: newPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Restore password response:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error restoring password:", err?.response?.data || err);
    const errorMessage = err?.response?.data?.message || 
                        err?.response?.data?.errors ||
                        err?.message ||
                        "خطأ في استعادة كلمة المرور";
    throw new Error(errorMessage);
  }
};
