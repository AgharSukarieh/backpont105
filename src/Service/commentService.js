import api from "./api";

/**
 * Comment Service - خدمة التعليقات
 * جميع endpoints التعليقات حسب التوثيق
 */

/**
 * جلب المنشور مع التعليقات
 * @param {number} postId - معرف المنشور
 * @returns {Promise<Object>} بيانات المنشور مع التعليقات
 */
export const getPostWithComments = async (postId) => {
  try {
    console.log("📤 Fetching post with comments:", postId);
    
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      throw new Error("معرف المنشور غير صحيح");
    }
    
    const response = await api.get(`/api/posts/${numericPostId}`);
    console.log("✅ Post with comments response:", response);
    console.log("✅ Response data:", response.data);
    
    // معالجة الاستجابة - قد تكون البيانات في response.data مباشرة
    const post = response.data || {};
    
    // محاولة العثور على التعليقات في أماكن مختلفة
    let comments = [];
    
    if (Array.isArray(post.comments)) {
      comments = post.comments;
    } else if (Array.isArray(post.data?.comments)) {
      comments = post.data.comments;
    } else if (Array.isArray(response.data?.data?.comments)) {
      comments = response.data.data.comments;
    }
    
    console.log(`📊 Found ${comments.length} comments`);
    
    // إضافة التعليقات للمنشور
    post.comments = comments;
    
    return post;
  } catch (error) {
    console.error("❌ Error fetching post with comments:", error?.response?.data || error?.message);
    console.error("❌ Full error:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب المنشور والتعليقات";
    throw new Error(errorMessage);
  }
};

/**
 * إنشاء تعليق جديد
 * @param {Object} data - بيانات التعليق
 * @param {string} data.text - نص التعليق
 * @param {number} data.postId - معرف المنشور
 * @param {number} data.userId - معرف المستخدم
 * @param {number|null} data.parentCommentId - معرف التعليق الأب (null للتعليق الأساسي)
 * @param {string} data.createdAt - تاريخ الإنشاء ISO format
 * @returns {Promise<Object>} بيانات التعليق المنشأ
 */
export const createComment = async (data) => {
  try {
    console.log("📤 Creating comment:", {
      postId: data.postId,
      userId: data.userId,
      hasParent: !!data.parentCommentId,
      textLength: data.text?.length,
    });
    
    const payload = {
      text: data.text?.trim() || "",
      postId: data.postId,
      userId: data.userId,
      parentCommentId: data.parentCommentId || 0,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    // التحقق من البيانات
    if (!payload.text) {
      throw new Error("نص التعليق مطلوب");
    }
    if (!payload.postId || payload.postId <= 0) {
      throw new Error("معرف المنشور غير صحيح");
    }
    if (!payload.userId || payload.userId <= 0) {
      throw new Error("معرف المستخدم غير صحيح");
    }
    
    const response = await api.post("/api/comments", payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });
    
    console.log("✅ Comment created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating comment:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إنشاء التعليق";
    throw new Error(errorMessage);
  }
};

/**
 * جلب ردود تعليق معين
 * @param {number} parentId - معرف التعليق الأب
 * @returns {Promise<Array>} قائمة الردود
 */
export const getCommentReplies = async (parentId) => {
  try {
    console.log("📤 Fetching replies for comment:", parentId);
    
    const numericParentId = parseInt(String(parentId), 10);
    if (isNaN(numericParentId) || numericParentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    const response = await api.get(`/api/comments/${numericParentId}/replies`, {
      headers: {
        accept: "*/*",
      },
    });
    
    const replies = Array.isArray(response.data) ? response.data : [];
    console.log(`✅ Fetched ${replies.length} replies for comment ${parentId}`);
    
    return replies;
  } catch (error) {
    console.error("❌ Error fetching comment replies:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب ردود التعليق";
    throw new Error(errorMessage);
  }
};

/**
 * تحديث تعليق
 * @param {number} commentId - معرف التعليق
 * @param {string} newText - النص الجديد
 * @returns {Promise<void>}
 */
export const updateComment = async (commentId, newText) => {
  try {
    console.log("📤 Updating comment:", commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    if (!newText || !newText.trim()) {
      throw new Error("نص التعليق مطلوب");
    }
    
    await api.put(`/api/comments/${numericCommentId}`, null, {
      params: {
        Text: newText.trim(),
      },
      headers: {
        accept: "*/*",
      },
    });
    
    console.log("✅ Comment updated successfully");
  } catch (error) {
    console.error("❌ Error updating comment:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في تحديث التعليق";
    throw new Error(errorMessage);
  }
};

/**
 * حذف تعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<void>}
 */
export const deleteComment = async (commentId) => {
  try {
    console.log("📤 Deleting comment:", commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    await api.delete(`/api/comments/${numericCommentId}`, {
      headers: {
        accept: "*/*",
      },
    });
    
    console.log("✅ Comment deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting comment:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في حذف التعليق";
    throw new Error(errorMessage);
  }
};

/**
 * Comment Likes Service - خدمة إعجابات التعليقات
 */

/**
 * التحقق من حالة الإعجاب لتعليق معين
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<boolean>} true إذا كان المستخدم قد أعجب بالتعليق
 */
export const checkCommentLikeStatus = async (commentId) => {
  try {
    console.log("📤 Checking comment like status:", commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    const response = await api.get(`/api/comment-likes/${numericCommentId}/status`, {
      headers: {
        accept: "*/*",
      },
    });
    
    // API قد ترجع boolean أو object يحتوي على isLiked
    const isLiked = response.data === true || response.data?.isLiked === true || response.data === "true";
    console.log(`✅ Comment ${commentId} like status:`, isLiked);
    
    return isLiked;
  } catch (error) {
    console.error("❌ Error checking comment like status:", error?.response?.data || error?.message);
    // إذا كان الخطأ 404، يعني المستخدم لم يعجب بالتعليق بعد
    if (error?.response?.status === 404) {
      return false;
    }
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في التحقق من حالة الإعجاب";
    throw new Error(errorMessage);
  }
};

/**
 * إضافة إعجاب لتعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<number>} معرف الإعجاب (قد يكون نفس الـ ID إذا كان موجوداً)
 */
export const likeComment = async (commentId) => {
  try {
    console.log("📤 Liking comment:", commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    const response = await api.post(`/api/comment-likes?commentId=${numericCommentId}`, "", {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    });
    
    // API قد ترجع ID أو object يحتوي على id
    const likeId = response.data?.id || response.data || numericCommentId;
    console.log(`✅ Comment ${commentId} liked successfully, like ID:`, likeId);
    
    return likeId;
  } catch (error) {
    console.error("❌ Error liking comment:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إضافة الإعجاب";
    throw new Error(errorMessage);
  }
};

/**
 * حذف إعجاب من تعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<void>}
 */
export const unlikeComment = async (commentId) => {
  try {
    console.log("📤 Unliking comment:", commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    await api.delete(`/api/comment-likes/${numericCommentId}`, {
      headers: {
        accept: "*/*",
      },
    });
    
    console.log(`✅ Comment ${commentId} unliked successfully`);
  } catch (error) {
    console.error("❌ Error unliking comment:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في حذف الإعجاب";
    throw new Error(errorMessage);
  }
};

/**
 * جلب قائمة المستخدمين الذين أعجبوا بتعليق معين
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<Array>} قائمة المستخدمين [{ userId, userName, imageURL }]
 */
export const getCommentLikedUsers = async (commentId) => {
  try {
    console.log("📤 Fetching comment liked users:", commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) {
      throw new Error("معرف التعليق غير صحيح");
    }
    
    const response = await api.get(`/api/comment-likes/${numericCommentId}/users`, {
      headers: {
        accept: "*/*",
      },
    });
    
    const users = Array.isArray(response.data) ? response.data : [];
    console.log(`✅ Fetched ${users.length} users who liked comment ${commentId}`);
    
    return users;
  } catch (error) {
    console.error("❌ Error fetching comment liked users:", error?.response?.data || error?.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب قائمة المعجبين";
    throw new Error(errorMessage);
  }
};
