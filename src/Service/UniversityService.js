import api from "./api";

/**
 * University Service - خدمة الجامعات
 * استخدام API الجديد: GET /api/universities
 */

/**
 * جلب قائمة الجامعات
 * @returns {Promise<Array>} قائمة الجامعات
 */
export const getAllUniversities = async () => {
  try {
    const response = await api.get("/api/universities", {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب قائمة الجامعات";
    throw new Error(errorMessage);
  }
};

// ==================== Admin APIs ====================

/**
 * جلب جامعة محددة
 * @param {number} universityId - معرف الجامعة
 * @returns {Promise<Object>} بيانات الجامعة
 */
export const getUniversityById = async (universityId) => {
  try {
    const numericId = Number(universityId);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error("معرف الجامعة غير صحيح");
    }

    console.log("📤 Fetching university with ID:", numericId);
    
    // محاولة endpoints مختلفة
    const endpoints = [
      `/api/Universities/${numericId}`,
      `/api/universities/${numericId}`,
    ];
    
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await api.get(endpoint, {
          headers: {
            accept: "*/*",
          },
        });
        console.log(`✅ University fetched successfully from: ${endpoint}`);
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with endpoint: ${endpoint}`, error?.response?.status);
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error; // إذا كان خطأ غير 404، أرمي الخطأ مباشرة
        }
      }
    }
    
    // إذا فشلت جميع المحاولات
    if (lastError?.response?.status === 404) {
      throw new Error("الجامعة غير موجودة");
    }
    
    throw lastError || new Error("خطأ في جلب بيانات الجامعة");
  } catch (error) {
    console.error("❌ Error fetching university:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * إضافة جامعة جديدة (للأدمن)
 * @param {Object} universityData - بيانات الجامعة
 * @param {string} universityData.name - اسم الجامعة
 * @param {string} universityData.address - عنوان الجامعة (اختياري)
 * @param {string} universityData.description - وصف الجامعة (اختياري)
 * @param {string} universityData.imageURL - رابط صورة الجامعة (اختياري)
 * @returns {Promise<Object>} بيانات الجامعة المُنشأة
 */
export const addUniversity = async (universityData) => {
  try {
    const payload = {
      name: universityData.name?.trim(),
      address: universityData.address || "",
      description: universityData.description || "",
      imageURL: universityData.imageURL || "",
    };

    const response = await api.post("/api/Universities", payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error adding university:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث جامعة (للأدمن)
 * @param {number} universityId - معرف الجامعة
 * @param {Object} universityData - بيانات التحديث
 * @returns {Promise<Object>} بيانات الجامعة المحدثة
 */
export const updateUniversity = async (universityId, universityData) => {
  try {
    const response = await api.put(`/api/Universities/${universityId}`, universityData, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating university:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * حذف جامعة (للأدمن)
 * @param {number} universityId - معرف الجامعة
 * @returns {Promise<void>}
 */
export const deleteUniversity = async (universityId) => {
  try {
    await api.delete(`/api/Universities/${universityId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    console.error("❌ Error deleting university:", error?.response?.data || error?.message);
    throw error;
  }
};

