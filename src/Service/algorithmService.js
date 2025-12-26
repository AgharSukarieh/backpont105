import api from "./api";

/**
 * Algorithm Service - خدمة الخوارزميات
 * جميع endpoints الخوارزميات حسب التوثيق
 */

/**
 * جلب جميع الخوارزميات مع التاغات
 * @returns {Promise<Array>} قائمة الخوارزميات مع التاغات
 */
export const getAllAlgorithmsWithTags = async () => {
  try {
    console.log("📚 Fetching all algorithms with tags from /api/explained-tags/with-tags");
    const response = await api.get("/api/explained-tags/with-tags", {
      headers: {
        accept: "*/*",
      },
    });
    
    console.log("✅ Algorithms with tags response:", response.data);
    
    // معالجة الاستجابة - قد تكون البيانات في response.data مباشرة أو في property معينة
    const data = response.data;
    
    if (Array.isArray(data)) {
      console.log(`📊 Returning ${data.length} algorithms with tags`);
      return data;
    }
    
    if (data?.data && Array.isArray(data.data)) {
      console.log(`📊 Returning ${data.data.length} algorithms with tags (nested)`);
      return data.data;
    }
    
    if (data?.items && Array.isArray(data.items)) {
      console.log(`📊 Returning ${data.items.length} algorithms with tags (items)`);
      return data.items;
    }
    
    console.warn("⚠️ Unexpected algorithms response structure:", data);
    return [];
  } catch (error) {
    console.error("❌ Error fetching algorithms with tags:", error.response?.data || error.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب الخوارزميات";
    throw new Error(errorMessage);
  }
};

/**
 * جلب خوارزمية معينة
 * @param {number} algorithmId - معرف الخوارزمية
 * @returns {Promise<Object>} بيانات الخوارزمية
 */
export const getAlgorithmById = async (algorithmId) => {
  try {
    console.log(`📚 Fetching algorithm details for ID: ${algorithmId}`);
    const response = await api.get(`/api/explained-tags/${algorithmId}`, {
      headers: {
        accept: "*/*",
      },
    });
    
    console.log(`✅ Algorithm details response for ID ${algorithmId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching algorithm ${algorithmId}:`, error.response?.data || error.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب الخوارزمية";
    throw new Error(errorMessage);
  }
};

/**
 * جلب الخوارزميات حسب التاغ
 * @param {number} tagId - معرف التاغ
 * @returns {Promise<Array>} قائمة الخوارزميات
 */
export const getAlgorithmsByTag = async (tagId) => {
  try {
    const response = await api.get(`/api/explained-tags/by-tag/${tagId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching algorithms by tag:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * إضافة خوارزمية جديدة (للأدمن)
 * @param {Object} algorithmData - بيانات الخوارزمية
 * @returns {Promise<Object>} بيانات الخوارزمية المُنشأة
 */
export const addAlgorithm = async (algorithmData) => {
  try {
    const payload = {
      ...algorithmData,
      videos: algorithmData.videosWithUrl || [],
      exampleTags: algorithmData.exampleVideos || [],
    };

    const response = await api.post("/api/explained-tags", payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error adding algorithm:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * تحديث خوارزمية (للأدمن)
 * @param {number} algorithmId - معرف الخوارزمية
 * @param {Object} algorithmData - بيانات التحديث
 * @returns {Promise<Object>} بيانات الخوارزمية المحدثة
 */
export const updateAlgorithm = async (algorithmId, algorithmData) => {
  try {
    const response = await api.put(`/api/explained-tags/${algorithmId}`, algorithmData, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating algorithm:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * حذف خوارزمية (للأدمن)
 * @param {number} algorithmId - معرف الخوارزمية
 * @returns {Promise<void>}
 */
export const deleteAlgorithm = async (algorithmId) => {
  try {
    await api.delete(`/api/explained-tags/${algorithmId}`, {
      headers: {
        accept: "*/*",
      },
    });
  } catch (error) {
    console.error("❌ Error deleting algorithm:", error?.response?.data || error?.message);
    throw error;
  }
};

// Functions for backward compatibility
export const getExplaineTagById = getAlgorithmById;

