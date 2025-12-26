import api from "./api";

/**
 * Upload Service - خدمة رفع الملفات
 * جميع endpoints رفع الملفات حسب التوثيق
 */

/**
 * رفع صورة
 * @param {File} file - ملف الصورة
 * @returns {Promise<Object>} { url: string, fileName: string }
 */
export const uploadImage = async (file) => {
  try {
    if (!file) {
      throw new Error("لم يتم تحديد ملف للرفع");
    }

    console.log("📤 Uploading image:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const formData = new FormData();
    // استخدام "image" حسب التوثيق: POST /uploads/images
    formData.append("image", file);

    const response = await api.post("/api/uploads/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Image upload response:", response.data);

    // معالجة الاستجابة - قد تكون URL مباشرة أو في property
    let imageUrl = null;
    if (typeof response.data === "string") {
      imageUrl = response.data;
    } else if (response.data?.url) {
      imageUrl = response.data.url;
    } else if (response.data?.imageUrl) {
      imageUrl = response.data.imageUrl;
    } else if (response.data?.data?.url) {
      imageUrl = response.data.data.url;
    } else if (response.data?.data) {
      imageUrl = response.data.data;
    }

    if (!imageUrl) {
      console.warn("⚠️ Unexpected response structure:", response.data);
      // محاولة استخدام البيانات كما هي
      imageUrl = response.data;
    }

    console.log("✅ Image URL:", imageUrl);
    return { url: imageUrl, fileName: file.name };
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    console.error("❌ Error response:", error?.response?.data);
    console.error("❌ Error status:", error?.response?.status);
    
    let errorMessage = "خطأ في رفع الصورة";
    
    if (error?.response?.data) {
      if (typeof error.response.data === "string") {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.errors) {
        errorMessage = JSON.stringify(error.response.data.errors);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * رفع فيديو
 * @param {File} file - ملف الفيديو
 * @returns {Promise<Object>} { url: string, thumbnailUrl: string, fileName: string }
 */
export const uploadVideo = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/uploads/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في رفع الفيديو";
    throw new Error(errorMessage);
  }
};

