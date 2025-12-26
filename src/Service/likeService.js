import api from "./api";

/**
 * Like Service - خدمة الإعجابات
 * جميع endpoints الإعجابات حسب التوثيق
 */

/**
 * إضافة إعجاب لمنشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<string>} رسالة نجاح
 */
export const likePost = async (postId) => {
  try {
    const response = await api.post(
      `/api/post-likes?postId=${postId}`,
      null,
      {
        headers: {
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إضافة الإعجاب";
    throw new Error(errorMessage);
  }
};

/**
 * إزالة الإعجاب من منشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<string>} رسالة نجاح
 */
export const unlikePost = async (postId) => {
  try {
    const response = await api.delete(`/api/post-likes?postId=${postId}`, {
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
      "خطأ في إزالة الإعجاب";
    throw new Error(errorMessage);
  }
};

/**
 * التحقق من حالة الإعجاب
 * @param {number} postId - معرف المنشور
 * @returns {Promise<boolean>} true إذا كان المستخدم معجب بالمنشور
 */
export const checkLikeStatus = async (postId) => {
  try {
    const response = await api.get(`/api/post-likes/status?postId=${postId}`, {
      headers: {
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error) {
    // في حالة الخطأ، نعيد false
    return false;
  }
};

/**
 * جلب قائمة المعجبين بمنشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<Array>} قائمة المعجبين
 */
export const getPostLikes = async (postId) => {
  try {
    const response = await api.get(`/api/post-likes/posts/${postId}`, {
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
      "خطأ في جلب قائمة المعجبين";
    throw new Error(errorMessage);
  }
};

