import api from "./api";

/**
 * Bell Activation Service - خدمة تفعيل الإشعارات (الجرس)
 * جميع endpoints تفعيل الإشعارات حسب التوثيق
 */

/**
 * جلب عدد المهتمين بالإشعارات
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<number>} عدد المهتمين بالإشعارات
 */
export const getBellFollowersCount = async (userId) => {
  try {
    const response = await api.get(`/api/Users/${userId}/bell-activations`, {
      headers: {
        accept: "*/*",
      },
    });
    return Number(response.data) || 0;
  } catch (error) {
    console.error("❌ Error fetching bell followers count:", error);
    return 0;
  }
};

/**
 * جلب حالة تفعيل الإشعارات
 * @param {number} followerId - معرف المستخدم الذي يريد الإشعارات
 * @param {number} followedId - معرف المستخدم المتابع
 * @returns {Promise<Object|null>} حالة تفعيل الإشعارات أو null إذا لم يكن موجوداً
 */
export const getBellActivationStatus = async (followerId, followedId) => {
  try {
    const response = await api.get("/api/bell-activations", {
      params: {
        followerId: Number(followerId),
        followedId: Number(followedId),
      },
      headers: {
        accept: "*/*",
      },
    });
    
    return {
      isActivatedSendEmail: response.data?.isActivatedSendEmail || false,
      isActivatedSendAppNotification: response.data?.isActivatedSendAppNotification || false,
    };
  } catch (error) {
    // إذا كان الخطأ 404 يعني لا يوجد تفعيل بعد
    if (error?.response?.status === 404) {
      return null;
    }
    console.error("❌ Error fetching bell activation status:", error);
    throw error;
  }
};

/**
 * حفظ/تحديث تفعيل الإشعارات
 * @param {number} followerId - معرف المستخدم الذي يريد الإشعارات
 * @param {number} followedId - معرف المستخدم المتابع
 * @param {boolean} isActivatedSendEmail - تفعيل إشعارات البريد الإلكتروني
 * @param {boolean} isActivatedSendAppNotification - تفعيل إشعارات التطبيق
 * @returns {Promise<Object>} بيانات التفعيل المحفوظة
 */
export const saveBellActivation = async (
  followerId,
  followedId,
  isActivatedSendEmail,
  isActivatedSendAppNotification
) => {
  // 1. التحقق من صحة البيانات
  if (!followerId || !followedId || followerId === 0 || followedId === 0) {
    throw new Error("بيانات غير صحيحة: followerId و followedId مطلوبان");
  }

  if (followerId === followedId) {
    throw new Error("لا يمكنك تفعيل الجرس لنفسك");
  }

  try {
    const data = {
      followerId: Number(followerId),
      followedId: Number(followedId),
      isActivatedSendEmail: Boolean(isActivatedSendEmail),
      isActivatedSendAppNotification: Boolean(isActivatedSendAppNotification),
    };

    console.log("📤 Saving bell activation:", data);
    console.log("📤 Request URL:", "/api/bell-activations");
    console.log("📤 Request method:", "POST/PUT");

    // 2. التحقق من وجود السجل
    let exists = false;
    try {
      const checkResponse = await api.get("/api/bell-activations", {
        params: {
          followerId: Number(followerId),
          followedId: Number(followedId),
        },
        headers: {
          accept: "*/*",
        },
      });
      console.log("✅ Bell activation exists:", checkResponse.data);
      exists = true;
    } catch (getError) {
      if (getError?.response?.status === 404) {
        console.log("ℹ️ Bell activation does not exist (404), will create new");
        exists = false;
      } else if (getError?.response?.status === 400) {
        console.log("⚠️ Bad request (400) when checking, will try to create new");
        exists = false;
      } else {
        console.error("❌ Error checking bell activation:", getError);
        // لا نرمي الخطأ هنا، سنحاول إنشاء جديد
        exists = false;
      }
    }

    // 3. حفظ أو تحديث
    if (exists) {
      // موجود → تحديث (PUT)
      console.log("🔄 Updating existing bell activation (PUT)...");
      try {
        const response = await api.put("/api/bell-activations", data, {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
        });
        console.log("✅ Bell activation updated successfully:", response.data);
        return response.data;
      } catch (putError) {
        console.error("❌ PUT failed, trying POST instead:", putError);
        // إذا فشل PUT، جرب POST
        const response = await api.post("/api/bell-activations", data, {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
        });
        console.log("✅ Bell activation created via POST:", response.data);
        return response.data;
      }
    } else {
      // غير موجود → إنشاء جديد (POST)
      console.log("➕ Creating new bell activation (POST)...");
      const response = await api.post("/api/bell-activations", data, {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      });
      console.log("✅ Bell activation created successfully:", response.data);
      return response.data;
    }
  } catch (error) {
    console.error("❌ Error saving bell activation:", error);
    console.error("Error details:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        data: error?.config?.data,
        headers: error?.config?.headers,
      },
    });
    
    let errorMessage = "خطأ في حفظ تفعيل الإشعارات";
    
    // معالجة رسائل الخطأ المختلفة
    if (error?.response?.data) {
      if (typeof error.response.data === "string") {
        // إذا كانت الرسالة تحتوي على "contest"، قد تكون رسالة خطأ خاطئة من الـ API
        if (error.response.data.toLowerCase().includes("contest")) {
          errorMessage = "خطأ في الـ API: يرجى المحاولة مرة أخرى لاحقاً";
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.title) {
        errorMessage = error.response.data.title;
      } else if (error.response.data.errors) {
        errorMessage = JSON.stringify(error.response.data.errors);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};
