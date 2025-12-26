import api from "./api";

/**
 * Post Service - خدمة المنشورات
 * جميع endpoints المنشورات حسب التوثيق
 */

/**
 * جلب جميع المنشورات
 * @returns {Promise<Array>} قائمة المنشورات
 * 
 * كل منشور يحتوي على:
 * - mostCommonType: معرف التاغ الأكثر شيوعاً
 * - secondCommonType: معرف التاغ الثاني الأكثر شيوعاً
 * - thirdCommonType: معرف التاغ الثالث الأكثر شيوعاً
 * 
 * يمكن ربط هذه المعرفات بـ GET /api/posts/tags للحصول على أسماء التاغات
 */
export const getAllPosts = async () => {
  try {
    console.log("📤 Fetching posts from /api/posts...");
    const response = await api.get("/api/posts", {
      headers: {
        accept: "*/*",
      },
    });
    
    const posts = Array.isArray(response.data) ? response.data : [];
    console.log(`✅ Fetched ${posts.length} posts`);
    
    // Log sample post data for debugging (including numberLike)
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log("📊 Sample post data:", {
        postId: firstPost.id,
        numberLike: firstPost.numberLike,
        isLikedIt: firstPost.isLikedIt,
        numberComment: firstPost.numberComment,
        mostCommonType: firstPost.mostCommonType,
        secondCommonType: firstPost.secondCommonType,
        thirdCommonType: firstPost.thirdCommonType,
        allKeys: Object.keys(firstPost), // عرض جميع المفاتيح المتاحة
      });
      
      // التحقق من أن numberLike موجود
      if (firstPost.numberLike === undefined || firstPost.numberLike === null) {
        console.warn("⚠️ Warning: numberLike is missing in post data!");
      }
    }
    
    return posts;
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب المنشورات";
    throw new Error(errorMessage);
  }
};

/**
 * جلب منشور معين مع التعليقات
 * @param {number} postId - معرف المنشور
 * @returns {Promise<Object>} بيانات المنشور مع التعليقات
 */
export const getPostById = async (postId) => {
  try {
    const response = await api.get(`/api/posts/${postId}`, {
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
      "خطأ في جلب المنشور";
    throw new Error(errorMessage);
  }
};

/**
 * إنشاء منشور جديد
 * @param {Object} data - بيانات المنشور
 * @param {string} data.title - عنوان المنشور
 * @param {string} data.content - محتوى المنشور
 * @param {number} data.userId - معرف المستخدم
 * @param {Array} data.videos - مصفوفة الفيديوهات (اختياري)
 * @param {Array} data.images - مصفوفة روابط الصور (اختياري)
 * @param {Array<number>} data.tags - مصفوفة معرفات التاغات (اختياري)
 * @returns {Promise<Object>} بيانات المنشور المنشأ
 */
export const createPost = async (data) => {
  try {
    const response = await api.post(
      "/api/posts",
      {
        title: data.title,
        content: data.content,
        userId: data.userId,
        videos: data.videos || [],
        images: data.images || [],
        tags: data.tags || [],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في إنشاء المنشور";
    throw new Error(errorMessage);
  }
};

/**
 * تحديث منشور
 * @param {number} postId - معرف المنشور
 * @param {Object} data - بيانات التحديث
 * @param {string} data.title - عنوان المنشور
 * @param {string} data.content - محتوى المنشور (HTML)
 * @param {Array} data.videos - مصفوفة الفيديوهات (اختياري)
 *   [{ id: number, title: string|null, description: string|null, url: string|null, thumbnailUrl: string|null }]
 * @param {Array} data.images - مصفوفة روابط الصور (اختياري)
 * @param {Array<number>} data.tags - مصفوفة معرفات التاغات (اختياري)
 * @returns {Promise<Object>} بيانات المنشور المحدث
 */
export const updatePost = async (postId, data) => {
  try {
    console.log("📤 Updating post:", postId, data);
    
    // التحقق من postId
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      throw new Error('معرف المنشور غير صحيح');
    }
    
    // التحقق من userId
    if (!data.userId || data.userId <= 0 || !Number.isInteger(data.userId)) {
      throw new Error(`معرف المستخدم غير صحيح: ${data.userId}. يجب أن يكون رقماً صحيحاً أكبر من 0`);
    }
    
    // معالجة الفيديوهات حسب البنية المطلوبة (بدون id)
    const processedVideos = (data.videos || []).map((v) => ({
      title: (v.title?.trim() || ""),
      description: (v.description?.trim() || ""),
      url: (v.url?.trim() || ""),
      thumbnailUrl: (v.thumbnailUrl?.trim() || ""),
    })).filter((v) => v.url); // إزالة الفيديوهات بدون URL
    
    // معالجة الصور - التأكد من أنها URLs
    const processedImages = (data.images || []).map((i) => {
      if (typeof i === "string") return i;
      return i.url || i;
    }).filter(Boolean);
    
    // معالجة التاغات - التأكد من أنها أرقام
    const processedTags = (data.tags || []).map((t) => Number(t)).filter((t) => !isNaN(t) && t > 0);
    
    // إعداد البيانات بالشكل المطلوب من API (id: 0 كما في التوثيق)
    const body = {
      id: 0, // دائماً 0 كما هو مطلوب من API
      title: data.title?.trim() || "",
      content: data.content || "",
      userId: Number(data.userId),
      videos: processedVideos,
      images: processedImages,
      tags: processedTags,
    };
    
    console.log("📤 Update post body:", JSON.stringify(body, null, 2));
    console.log("📤 Post ID (path):", numericPostId);
    console.log("📤 Full URL:", `${api.defaults.baseURL}/api/posts/${numericPostId}`);
    
    // استخدام endpoint الجديد حسب التوثيق: PUT /api/posts/{postId}
    const response = await api.put(`/api/posts/${numericPostId}`, body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      timeout: 30000, // 30 ثانية timeout
    });
    
    console.log("✅ Post updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating post:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        baseURL: error?.config?.baseURL,
        headers: error?.config?.headers,
      },
    });
    
    // Handle 401 Unauthorized
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    // Handle 403 Forbidden
    if (error?.response?.status === 403) {
      throw new Error('ليس لديك صلاحية لتعديل هذا المنشور.');
    }
    
    // Handle 404 Not Found
    if (error?.response?.status === 404) {
      throw new Error('المنشور غير موجود.');
    }
    
    // Handle Network Error
    if (error?.message === "Network Error" || error?.code === "ERR_NETWORK") {
      throw new Error("خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.");
    }
    
    // Handle other errors
    let errorMessage = error?.response?.data?.message || error?.message || "خطأ في تحديث المنشور";
    throw new Error(errorMessage);
  }
};

/**
 * حذف منشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<string>} رسالة نجاح
 */
export const deletePost = async (postId) => {
  try {
    console.log("🗑️ Deleting post:", postId);
    
    // محاولة الطريقة الأولى: DELETE /posts مع params
    let response;
    try {
      response = await api.delete("/api/posts", {
        params: { id: Number(postId) },
        headers: {
          accept: "*/*",
        },
      });
    } catch (error) {
      // إذا فشلت الطريقة الأولى، جرب الطريقة الثانية: DELETE /posts/{id}
      console.warn("⚠️ First delete method failed, trying alternative:", error);
      response = await api.delete(`/api/posts/${postId}`, {
        headers: {
          accept: "*/*",
        },
      });
    }
    
    console.log("✅ Post deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    console.error("❌ Error response:", error?.response?.data);
    
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في حذف المنشور";
    throw new Error(errorMessage);
  }
};

/**
 * البحث عن المنشورات
 * @param {Object} filters - فلاتر البحث
 * @param {string} filters.text - نص البحث (اختياري)
 * @param {string} filters.from - تاريخ البداية ISO format (اختياري)
 * @param {string} filters.to - تاريخ النهاية ISO format (اختياري)
 * @param {number} filters.userId - فلترة حسب المستخدم (اختياري)
 * @returns {Promise<Array>} قائمة المنشورات المطابقة
 */
export const searchPosts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // إضافة text فقط إذا كان موجوداً وليس فارغاً
    if (filters.text && filters.text.trim()) {
      params.append("text", filters.text.trim());
    }
    
    if (filters.from) {
      params.append("from", filters.from);
    }
    if (filters.to) {
      params.append("to", filters.to);
    }
    if (filters.userId) {
      params.append("userId", filters.userId.toString());
    }

    // بناء URL مع التحقق من وجود parameters
    const queryString = params.toString();
    const url = queryString ? `/api/posts/search?${queryString}` : `/api/posts/search`;
    
    console.log("🔍 Searching posts with filters:", { text: filters.text, from: filters.from, to: filters.to, userId: filters.userId });
    
    const response = await api.get(url, {
      headers: {
        accept: "*/*",
      },
    });
    
    console.log("✅ Search results:", response.data);
    
    // التعامل مع مختلف أشكال الـ response
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    } else {
      return [];
    }
  } catch (error) {
    console.error("❌ Error searching posts:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في البحث عن المنشورات";
    throw new Error(errorMessage);
  }
};

/**
 * جلب التاغات (Tags)
 * @returns {Promise<Array>} قائمة التاغات
 */
export const getAllTags = async () => {
  try {
    const response = await api.get("/api/tags", {
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
      "خطأ في جلب التاغات";
    throw new Error(errorMessage);
  }
};

