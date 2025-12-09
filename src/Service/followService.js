import api from "./api";

const FOLLOW_API_BASE = "http://arabcodetest.runasp.net/Follow";
const BELL_API_BASE = "http://arabcodetest.runasp.net/Bell";

/**
 * التحقق من حالة المتابعة
 * @param {number} followerId - معرف المتابع (المستخدم الحالي)
 * @param {number} followId - معرف المتابوع (صاحب Profile)
 * @returns {Promise<boolean>} true إذا كان يتابعه
 */
export const checkFollowStatus = async (followerId, followId) => {
  try {
    const res = await fetch(
      `${FOLLOW_API_BASE}/DoesHeFollowHimAsync?Follower=${encodeURIComponent(followerId)}&Follow=${encodeURIComponent(followId)}`,
      { headers: { accept: "*/*" } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data);
  } catch (err) {
    console.error("checkFollowStatus error:", err);
    return false;
  }
};

/**
 * متابعة مستخدم
 * @param {number} followerId - معرف المتابع
 * @param {number} followId - معرف المتابوع
 */
export const doFollow = async (followerId, followId) => {
  try {
    const payload = { 
      follower: Number(followerId), 
      follow: Number(followId) 
    };
    const res = await fetch(`${FOLLOW_API_BASE}/Add`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        accept: "*/*" 
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Follow failed (${res.status})`);
    return true;
  } catch (err) {
    console.error("doFollow error:", err);
    throw err;
  }
};

/**
 * إلغاء متابعة مستخدم
 * @param {number} followerId - معرف المتابع
 * @param {number} followId - معرف المتابوع
 */
export const doUnfollow = async (followerId, followId) => {
  try {
    const payload = { 
      follower: Number(followerId), 
      follow: Number(followId) 
    };
    const res = await fetch(`${FOLLOW_API_BASE}/Remove`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        accept: "*/*" 
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Unfollow failed (${res.status})`);
    return true;
  } catch (err) {
    console.error("doUnfollow error:", err);
    throw err;
  }
};

/**
 * جلب حالة الجرس (هل مفعّل أم لا)
 * @param {number} followerId - معرف المتابع
 * @param {number} followedId - معرف المتابوع
 * @returns {Promise<Object|null>} بيانات الجرس أو null
 */
export const fetchBellStatus = async (followerId, followedId) => {
  try {
    const res = await fetch(
      `${BELL_API_BASE}/GetActivateTheBell?followerId=${encodeURIComponent(followerId)}&followedId=${encodeURIComponent(followedId)}`,
      { headers: { accept: "*/*" } }
    );
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // إذا كانت boolean
    if (typeof data === "boolean") {
      return data ? { 
        isActivatedSendEmail: true, 
        isActivatedSendAppNotification: true 
      } : null;
    }
    
    // إذا كانت object
    if (data && typeof data === "object") {
      const active = 
        Boolean(data.isActivatedSendAppNotification) || 
        Boolean(data.isActivatedSendEmail) || 
        Boolean(data.isActivated);
      return active ? data : null;
    }
    
    return null;
  } catch (err) {
    console.error("fetchBellStatus error:", err);
    return null;
  }
};

/**
 * تفعيل/تحديث إعدادات الجرس
 * @param {number} followerId - معرف المتابع
 * @param {number} followedId - معرف المتابوع
 * @param {boolean} emailEnabled - تفعيل الإشعارات عبر البريد
 * @param {boolean} appEnabled - تفعيل الإشعارات في التطبيق
 */
export const saveBellPreferences = async (followerId, followedId, emailEnabled, appEnabled) => {
  try {
    const existing = await fetchBellStatus(followerId, followedId);
    
    const payload = {
      followerId: Number(followerId),
      followedId: Number(followedId),
      isActivatedSendEmail: Boolean(emailEnabled),
      isActivatedSendAppNotification: Boolean(appEnabled),
    };
    if (!existing) {
      // إنشاء جديد
      const res = await fetch(`${BELL_API_BASE}/Add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          accept: "*/*" 
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Bell Add failed (${res.status})`);
    } else {
      // تحديث موجود
      const res = await fetch(`${BELL_API_BASE}/Update`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          accept: "*/*" 
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Bell Update failed (${res.status})`);
    }
    
    return true;
  } catch (err) {
    console.error("saveBellPreferences error:", err);
    throw err;
  }
};

/**
 * إيقاف الجرس (تعطيل جميع الإشعارات)
 * @param {number} followerId - معرف المتابع
 * @param {number} followedId - معرف المتابوع
 */
export const disableBellQuick = async (followerId, followedId) => {
  try {
    const existing = await fetchBellStatus(followerId, followedId);
    if (!existing) return;
    const payload = {
      followerId: Number(followerId),
      followedId: Number(followedId),
      isActivatedSendEmail: false,
      isActivatedSendAppNotification: false,
    };
    const res = await fetch(`${BELL_API_BASE}/Update`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json", 
        accept: "*/*" 
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) throw new Error(`Bell Update failed (${res.status})`);
    return true;
  } catch (err) {
    console.error("disableBellQuick error:", err);
    throw err;
  }
};

