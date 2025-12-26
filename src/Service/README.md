# API Services Documentation

هذا الملف يحتوي على جميع خدمات API المحدثة حسب التوثيق الجديد.

## 📁 الملفات

### ملفات الخدمات الرئيسية:

1. **api.js** - إعدادات axios مع refresh token interceptor
2. **authService.js** - خدمة المصادقة (تسجيل الدخول، التسجيل، OTP، إلخ)
3. **userService.js** - خدمة المستخدمين (جلب، تحديث، أفضل المبرمجين)
4. **postService.js** - خدمة المنشورات (إنشاء، تحديث، حذف، بحث)
5. **commentService.js** - خدمة التعليقات
6. **likeService.js** - خدمة الإعجابات
7. **followService.js** - خدمة المتابعات
8. **messageService.js** - خدمة الرسائل
9. **contestService.js** - خدمة المسابقات
10. **eventService.js** - خدمة الفعاليات
11. **NotificationServices.js** - خدمة الإشعارات
12. **TagServices.js** - خدمة التاغات
13. **algorithmService.js** - خدمة الخوارزميات
14. **uploadService.js** - خدمة رفع الملفات
15. **searchService.js** - خدمة البحث
16. **bellActivationService.js** - خدمة تفعيل الجرس
17. **generalService.js** - خدمة عامة

## 🚀 الاستخدام

### استيراد الخدمات:

```javascript
// استيراد خدمة واحدة
import { login, register } from "./Service/authService";

// استيراد من index
import { login, getAllPosts, createPost } from "./Service";
```

### أمثلة الاستخدام:

#### 1. المصادقة:

```javascript
import { login, register, sendOtpForRegister } from "./Service/authService";

// إرسال OTP
await sendOtpForRegister("user@example.com");

// التسجيل
const userData = await register({
  email: "user@example.com",
  password: "password123",
  userName: "username",
  countryId: 1,
  otp: "123456"
}, imageFile);

// تسجيل الدخول
const loginData = await login("user@example.com", "password123");
localStorage.setItem("token", loginData.token);
```

#### 2. المنشورات:

```javascript
import { getAllPosts, createPost, likePost } from "./Service";

// جلب جميع المنشورات
const posts = await getAllPosts();

// إنشاء منشور جديد
const newPost = await createPost({
  title: "عنوان المنشور",
  content: "محتوى المنشور",
  userId: 1,
  images: ["url1", "url2"],
  tags: [1, 2, 3]
});

// إعجاب بمنشور
await likePost(postId);
```

#### 3. المستخدمين:

```javascript
import { getUserById, getTopCoders, getAllCountries } from "./Service";

// جلب معلومات مستخدم
const user = await getUserById(userId);

// جلب أفضل المبرمجين
const topCoders = await getTopCoders({ CountryId: 1, search: "ahmad" });

// جلب قائمة الدول
const countries = await getAllCountries();
```

## 🔄 Refresh Token

يتم تحديث Token تلقائياً عند انتهاء صلاحيته عبر interceptor في `api.js`.

## 📝 ملاحظات

- جميع الـ endpoints تستخدم Base URL: `http://arabcodetest.runasp.net`
- معظم الـ endpoints تتطلب Bearer Token في Header
- يتم إضافة Token تلقائياً عبر interceptor
- عند فشل تحديث Token، يتم تسجيل الخروج تلقائياً

