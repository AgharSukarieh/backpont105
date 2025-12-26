import api from "./api";

/**
 * Follow Service - خدمة المتابعات
 * جميع endpoints المتابعات حسب التوثيق
 */

/**
 * التحقق من حالة المتابعة
 * @param {number} followerId - معرف المتابع (المستخدم الحالي)
 * @param {number} followId - معرف المتابوع (صاحب Profile)
 * @returns {Promise<boolean>} true إذا كان يتابعه
 */
export const checkFollowStatus = async (followerId, followId) => {
  try {
    const response = await api.get(
      `/api/follows/status?followerId=${followerId}&followId=${followId}`,
      {
        headers: {
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error) {
    // في حالة الخطأ، نعيد false
    return false;
  }
};

/**
 * متابعة مستخدم
 * @param {number} followerId - معرف المتابع
 * @param {number} followId - معرف المتابوع
 * @returns {Promise<Object>} بيانات المتابعة
 */
export const doFollow = async (followerId, followId) => {
  try {
    const payload = {
      follower: Number(followerId),
      follow: Number(followId),
    };
    
    console.log("📤 Following user:", payload);
    console.log("📤 Request URL:", "/api/follows");
    console.log("📤 Request payload:", JSON.stringify(payload));
    
    const response = await api.post(
      "/api/follows",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    
    console.log("✅ Follow successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error following user:", error);
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
      request: error?.request,
    });
    
    // إذا كان Network Error، قد تكون المشكلة في CORS أو الاتصال
    if (error?.message === "Network Error" || !error?.response) {
      console.error("⚠️ Network Error detected. Possible causes:");
      console.error("1. CORS issue");
      console.error("2. Server is down");
      console.error("3. Network connectivity issue");
      console.error("4. Request blocked by browser");
    }
    
    let errorMessage = "خطأ في متابعة المستخدم";
    
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
 * إلغاء متابعة مستخدم
 * @param {number} followerId - معرف المتابع
 * @param {number} followId - معرف المتابوع
 * @returns {Promise<string>} رسالة نجاح
 */
export const doUnfollow = async (followerId, followId) => {
  try {
    const follower = Number(followerId);
    const follow = Number(followId);
    
    console.log("📤 Unfollowing user:", { follower, follow });
    
    // محاولة استخدام DELETE مع body أولاً
    let response;
    try {
      response = await api.delete("/api/follows", {
        data: {
          follower: follower,
          follow: follow,
        },
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      });
      console.log("✅ Unfollow successful (with body):", response.data);
      return response.data;
    } catch (bodyError) {
      // إذا فشل مع body، جرب query parameters
      console.log("⚠️ DELETE with body failed, trying query parameters...");
      response = await api.delete(`/api/follows?follower=${follower}&follow=${follow}`, {
        headers: {
          accept: "*/*",
        },
      });
      console.log("✅ Unfollow successful (with query params):", response.data);
      return response.data;
    }
  } catch (error) {
    console.error("❌ Error unfollowing user:", error);
    console.error("Error details:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        data: error?.config?.data,
      },
    });
    
    let errorMessage = "خطأ في إلغاء متابعة المستخدم";
    
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
 * جلب قائمة المتابعين (Followers)
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Array>} قائمة المتابعين
 */
export const getFollowers = async (userId) => {
  try {
    if (!userId) {
      throw new Error("معرف المستخدم مطلوب");
    }
    
    const response = await api.get(`/api/follows/users/${userId}/followers`, {
      headers: {
        accept: "*/*",
      },
    });
    
    // التأكد من أن البيانات مصفوفة
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching followers:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب قائمة المتابعين";
    throw new Error(errorMessage);
  }
};

/**
 * جلب قائمة المتابعين (Following)
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Array>} قائمة المتابعين
 */
export const getFollowing = async (userId) => {
  try {
    if (!userId) {
      throw new Error("معرف المستخدم مطلوب");
    }
    
    const response = await api.get(`/api/follows/users/${userId}/following`, {
      headers: {
        accept: "*/*",
      },
    });
    
    // التأكد من أن البيانات مصفوفة
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching following:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "خطأ في جلب قائمة المتابعين";
    throw new Error(errorMessage);
  }
};

/**
 * جلب حالة الجرس (للتوافق مع الكود القديم)
 * @param {number} followerId - معرف المتابع
 * @param {number} followedId - معرف المتابوع
 * @returns {Promise<Object|null>} بيانات الجرس أو null
 */
export const fetchBellStatus = async (followerId, followedId) => {
  try {
    // محاولة استخدام API الجديد
    const { getBellActivationsByUser } = await import("./bellActivationService");
    const activations = await getBellActivationsByUser(followerId);
    
    // البحث عن تفعيل الجرس للمستخدم المتابوع
    // يمكن أن يكون bellType مثل "FOLLOW" أو أي نوع آخر
    const activation = activations.find(
      (act) => act.isActivated === true
    );
    
    if (activation) {
      return {
        isActivatedSendEmail: activation.isActivated || false,
        isActivatedSendAppNotification: activation.isActivated || false,
        isActivated: activation.isActivated || false,
      };
    }
    
    return null;
  } catch (error) {
    console.error("fetchBellStatus error:", error);
    // في حالة الخطأ، نعيد null
    return null;
  }
};

/**
 * تفعيل/تحديث إعدادات الجرس (للتوافق مع الكود القديم)
 * @param {number} followerId - معرف المتابع
 * @param {number} followedId - معرف المتابوع
 * @param {boolean} emailEnabled - تفعيل الإشعارات عبر البريد
 * @param {boolean} appEnabled - تفعيل الإشعارات في التطبيق
 * @returns {Promise<boolean>} true عند النجاح
 */
export const saveBellPreferences = async (followerId, followedId, emailEnabled, appEnabled) => {
  try {
    const { getAllBellActivations, createBellActivation, updateBellActivation } = await import("./bellActivationService");
    
    // جلب التفعيلات الموجودة
    const activations = await getAllBellActivations();
    
    // البحث عن تفعيل موجود
    const existing = activations.find(
      (act) => act.userId === Number(followerId)
    );
    
    if (existing) {
      // تحديث موجود
      await updateBellActivation({
        id: existing.id,
        userId: followerId,
        bellType: existing.bellType || "FOLLOW",
        isActivated: emailEnabled || appEnabled,
      });
    } else {
      // إنشاء جديد
      await createBellActivation({
        userId: followerId,
        bellType: "FOLLOW",
        isActivated: emailEnabled || appEnabled,
      });
    }
    
    return true;
  } catch (error) {
    console.error("saveBellPreferences error:", error);
    throw error;
  }
};

/**
 * إيقاف الجرس (تعطيل جميع الإشعارات) (للتوافق مع الكود القديم)
 * @param {number} followerId - معرف المتابع
 * @param {number} followedId - معرف المتابوع
 * @returns {Promise<boolean>} true عند النجاح
 */
export const disableBellQuick = async (followerId, followedId) => {
  try {
    const { getAllBellActivations, updateBellActivation } = await import("./bellActivationService");
    
    const activations = await getAllBellActivations();
    const existing = activations.find(
      (act) => act.userId === Number(followerId)
    );
    
    if (existing) {
      await updateBellActivation({
        id: existing.id,
        userId: followerId,
        bellType: existing.bellType || "FOLLOW",
        isActivated: false,
      });
    }
    
    return true;
  } catch (error) {
    console.error("disableBellQuick error:", error);
    throw error;
  }
};

