import api from "./api";

/**
 * Upload Video Service - خدمة رفع الفيديو
 * خدمة مخصصة لرفع الفيديو وإرجاع URL مباشرة
 */

/**
 * رفع فيديو وإرجاع URL
 * @param {File} file - ملف الفيديو
 * @returns {Promise<string>} رابط الفيديو
 */
export const uploadUserVideo = async (file) => {
  try {
    if (!file) {
      throw new Error("لم يتم تحديد ملف للرفع");
    }

    console.log("📤 Uploading video:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/uploads/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Video upload response:", response.data);

    // معالجة الاستجابة - قد تكون URL مباشرة أو في property
    let videoUrl = null;
    if (typeof response.data === "string") {
      videoUrl = response.data;
    } else if (response.data?.url) {
      videoUrl = response.data.url;
    } else if (response.data?.videoUrl) {
      videoUrl = response.data.videoUrl;
    } else if (response.data?.data?.url) {
      videoUrl = response.data.data.url;
    } else if (response.data?.data) {
      videoUrl = response.data.data;
    }

    if (!videoUrl) {
      console.warn("⚠️ Unexpected response structure:", response.data);
      // محاولة استخدام البيانات كما هي
      videoUrl = response.data;
    }

    console.log("✅ Video URL:", videoUrl);
    return videoUrl;
  } catch (error) {
    console.error("❌ Error uploading video:", error);
    console.error("❌ Error response:", error?.response?.data);
    console.error("❌ Error status:", error?.response?.status);
    
    let errorMessage = "خطأ في رفع الفيديو";
    
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

