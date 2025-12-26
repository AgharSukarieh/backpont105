import api from "./api";

/**
 * Tag Service - خدمة التاغات
 * استخدام API الجديد: GET /api/tags
 */

/**
 * جلب جميع الوسوم المتاحة من السيرفر
 * @returns {Promise<Array>} مصفوفة من الوسوم
 */
export const getAllTags = async () => {
  try {
    console.log("📋 Fetching tags from /api/tags");
    const response = await api.get("/api/tags", {
      headers: {
        accept: "text/plain",
      },
    });
    
    console.log("✅ Tags response:", response.data);
    
    // معالجة الاستجابة - قد تكون البيانات في response.data مباشرة أو في property معينة
    const data = response.data;
    
    if (Array.isArray(data)) {
      console.log(`📊 Returning ${data.length} tags`);
      return data;
    }
    
    if (data?.data && Array.isArray(data.data)) {
      console.log(`📊 Returning ${data.data.length} tags (nested)`);
      return data.data;
    }
    
    if (data?.items && Array.isArray(data.items)) {
      console.log(`📊 Returning ${data.items.length} tags (items)`);
      return data.items;
    }
    
    console.warn("⚠️ Unexpected tags response structure:", data);
    return [];
  } catch (error) {
    console.error("❌ Error fetching tags:", error.response?.data || error.message);
    return [];
  }
};

/**
 * جلب تفاصيل خوارزمية/شرح معين بواسطة ID
 * @param {number|string} id - معرف الخوارزمية/الشرح
 * @returns {Promise<Object>} بيانات الخوارزمية/الشرح
 */
export const getExplaineTagById = async (id) => {
  try {
    // استخدام API الجديد
    const { getAlgorithmById } = await import("./algorithmService");
    return await getAlgorithmById(Number(id));
  } catch (error) {
    console.error("خطأ أثناء جلب تفاصيل الخوارزمية:", error);
    throw error;
  }
};

// Cache للخوارزميات لتجنب جلبها عدة مرات
let algorithmsCache = null;
let algorithmsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

/**
 * جلب جميع الشروحات/الخوارزميات المرتبطة بوسم معين
 * @param {number|string} tagId - معرف الوسم
 * @returns {Promise<Array>} مصفوفة من الشروحات/الخوارزميات
 */
export const getExplaineTagsByTagId = async (tagId) => {
  try {
    console.log(`🔍 Fetching algorithms for tagId: ${tagId}`);
    
    // محاولة استخدام API القديم أولاً (لأنه قد يكون أكثر دقة)
    try {
      const response = await api.get(`/ExplaineTag/GetExplaineTagByTagId?id=${tagId}`, {
        headers: {
          accept: "*/*",
        },
      });
      
      console.log(`✅ Old API response for tagId ${tagId}:`, response.data);
      
      // معالجة البيانات حسب شكل الاستجابة
      let data = response.data;
      if (Array.isArray(data)) {
        console.log(`✅ Returning ${data.length} algorithms from old API`);
        return data;
      } else if (Array.isArray(data?.data)) {
        console.log(`✅ Returning ${data.data.length} algorithms from old API (nested)`);
        return data.data;
      } else if (data?.result && Array.isArray(data.result)) {
        console.log(`✅ Returning ${data.result.length} algorithms from old API (result)`);
        return data.result;
      }
      
      // إذا لم تكن مصفوفة، نعيد مصفوفة فارغة
      console.warn("⚠️ getExplaineTagsByTagId returned unexpected shape:", data);
      return [];
    } catch (oldApiError) {
      console.warn(`⚠️ Old API failed for tagId ${tagId}, trying new API:`, oldApiError?.response?.status || oldApiError?.message);
      
      // Fallback إلى API الجديد
      const { getAllAlgorithmsWithTags } = await import("./algorithmService");
      
      // التحقق من الـ cache
      const now = Date.now();
      if (!algorithmsCache || !algorithmsCacheTime || (now - algorithmsCacheTime) > CACHE_DURATION) {
        console.log("📦 Fetching all algorithms with tags from new API...");
        algorithmsCache = await getAllAlgorithmsWithTags();
        algorithmsCacheTime = now;
        console.log("📦 Cached algorithms:", algorithmsCache?.length, algorithmsCache);
      }
      
      // فلترة الخوارزميات حسب tagId
      const filteredAlgorithms = (algorithmsCache || []).filter((algo) => {
        // محاولة عدة طرق للفلترة
        if (algo.tags && Array.isArray(algo.tags)) {
          return algo.tags.some((tag) => {
            const tagIdNum = typeof tag === 'object' ? tag.id : tag;
            return tagIdNum === Number(tagId);
          });
        }
        
        // محاولة طرق أخرى
        if (algo.tagId === Number(tagId)) return true;
        if (algo.tag?.id === Number(tagId)) return true;
        if (algo.tagId === tagId) return true;
        
        return false;
      });
      
      console.log(`🔍 Filtered ${filteredAlgorithms.length} algorithms for tag ${tagId} from ${algorithmsCache?.length || 0} total`);
      return filteredAlgorithms || [];
    }
  } catch (error) {
    console.error("خطأ أثناء جلب الخوارزميات للوسم:", error);
    return [];
  }
};
