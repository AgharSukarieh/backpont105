import axios from "axios";

const api = axios.create({
  baseURL: "http://arabcodetest.runasp.net",
  timeout: 30000, // 30 ثانية timeout
  withCredentials: false, // لا نرسل credentials مع CORS
  headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json',
  },
});

// Request interceptor - إضافة Token إلى جميع الطلبات
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // إضافة Content-Type للطلبات التي تحتوي على data (فقط إذا لم يكن موجوداً مسبقاً)
  if (config.data && !config.headers["Content-Type"] && !config.headers["content-type"]) {
    // التحقق من نوع البيانات
    if (config.data instanceof FormData) {
      // لا نضيف Content-Type لـ FormData، سيضيفه axios تلقائياً
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }
  
  // إضافة accept header إذا لم يكن موجوداً
  if (!config.headers.accept && !config.headers.Accept) {
    config.headers.accept = "*/*";
  }
  
  return config;
}, (error) => {
  console.error("❌ Request interceptor error:", error);
  return Promise.reject(error);
});

// Response interceptor - تحديث Token تلقائياً عند انتهاء الصلاحية
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // إذا كان الخطأ 401 ولم يتم إعادة المحاولة بعد
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // محاولة تحديث Token
        const refreshResponse = await axios.get(
          `${api.defaults.baseURL}/api/auth/refresh-token`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              accept: "*/*",
            },
          }
        );

        const { token } = refreshResponse.data;
        if (token) {
          localStorage.setItem("token", token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // إذا فشل تحديث Token، تسجيل الخروج
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
