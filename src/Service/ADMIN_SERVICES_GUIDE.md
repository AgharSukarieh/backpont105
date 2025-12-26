# 📚 دليل Services للأدمن - Admin Services Guide

## 📋 نظرة عامة

هذا الدليل يوضح جميع Services المتاحة وربطها مع مجلدات الأدمن في المشروع.

---

## 🔗 ربط Services مع مجلدات الأدمن

### 1. 💬 Comments Service (`commentService.js`)
**المجلد:** `src/Pages/Posts/User/Post.js`

**الدوال:**
- `createComment()` - إضافة تعليق
- `getCommentReplies()` - جلب ردود تعليق
- `updateComment()` - تحديث تعليق
- `deleteComment()` - حذف تعليق

---

### 2. 📊 General Service (`generalService.js`)
**المجلد:** `src/Pages/Dashboard/DashboardHome.js`

**الدوال:**
- `getCurrentUser()` - جلب معلومات المستخدم الحالي
- `getGeneralStats()` - جلب الإحصائيات العامة (للأدمن)

---

### 3. 👥 User Service (`userService.js`)
**المجلد:** `src/Pages/User/Admin/`

**الدوال:**
- `getAllUsers()` - جلب جميع المستخدمين (للأدمن)
- `getUserById()` - جلب مستخدم محدد
- `addUser()` - إضافة مستخدم جديد (للأدمن)
- `updateUser()` - تحديث مستخدم
- `deleteUser()` - حذف مستخدم (للأدمن)
- `getTopCoders()` - جلب أفضل المبرمجين

**الملفات المرتبطة:**
- `Users.js` - قائمة المستخدمين
- `add-user.js` - إضافة مستخدم
- `EditUser.js` - تعديل مستخدم
- `ViewUser.js` - عرض مستخدم

---

### 4. 📝 Problem Service (`ProblemService.js`)
**المجلد:** `src/Pages/Problems/Admin/`

**الدوال:**
- `getAllProblems()` - جلب جميع المسائل (للأدمن)
- `getProblemById()` - جلب مسألة محددة
- `getProblemDetails()` - جلب تفاصيل مسألة مع التقييمات
- `getAllProblemList()` - جلب قائمة المسائل (للاختيار)
- `addProblem()` - إضافة مسألة جديدة
- `updateProblem()` - تحديث مسألة
- `deleteProblem()` - حذف مسألة
- `searchProblems()` - البحث في المسائل

**الملفات المرتبطة:**
- `AllProblems.js` - قائمة جميع المسائل
- `AddProblem.js` - إضافة مسألة
- `EditeProblem.js` - تعديل مسألة
- `ViewProblem.js` - عرض مسألة
- `AdminProblems.js` - لوحة تحكم المسائل

---

### 5. ⭐ Problem Rating Service (`ProblemRatingService.js`)
**المجلد:** `src/Pages/Problems/Admin/ProblemEvaluationAdmin.js`

**الدوال:**
- `getProblemWithRatings()` - جلب مسألة مع التقييمات
- `addProblemRating()` - إضافة تقييم
- `updateProblemRating()` - تحديث تقييم
- `deleteProblemRating()` - حذف تقييم

**ملاحظة:** للأدمن، استخدم `adminService.js`:
- `getProblemEvaluations()` - جلب تقييمات مسألة (للأدمن)
- `updateEvaluation()` - تحديث تقييم (للأدمن)
- `deleteEvaluation()` - حذف تقييم (للأدمن)

---

### 6. 🏷️ Tag Service (`TagServices.js`)
**المجلد:** `src/Pages/ExplaineTag/Admin/ShowTags.js`

**الدوال:**
- `getAllTags()` - جلب جميع التاغات
- `addTag()` - إضافة تاغ جديد
- `updateTag()` - تحديث تاغ
- `deleteTag()` - حذف تاغ

---

### 7. 🏆 Contest Service (`contestService.js`)
**المجلد:** `src/Pages/Contest/Admin/`

**الدوال:**
- `getAllContests()` - جلب جميع المسابقات
- `getContestById()` - جلب مسابقة محددة
- `addContest()` - إضافة مسابقة جديدة (للأدمن)
- `updateContest()` - تحديث مسابقة (للأدمن)
- `deleteContest()` - حذف مسابقة (للأدمن)
- `getContestStages()` - جلب مراحل المسابقة

**الملفات المرتبطة:**
- `ContestList.js` - قائمة المسابقات
- `AddContest.js` - إضافة مسابقة
- `EditContest.js` - تعديل مسابقة
- `ViewContest.js` - عرض مسابقة

---

### 8. 📮 Post Service (`postService.js`)
**المجلد:** `src/Pages/Posts/Admin/`

**الدوال:**
- `getAllPosts()` - جلب جميع المنشورات
- `getAllPostsAdmin()` - جلب جميع المنشورات (للأدمن)
- `getPostById()` - جلب منشور محدد
- `createPost()` - إنشاء منشور جديد
- `updatePost()` - تحديث منشور
- `deletePost()` - حذف منشور
- `searchPosts()` - البحث في المنشورات
- `getTrendingHashtags()` - جلب الهاشتاغات الشائعة

**الملفات المرتبطة:**
- `AllPostAdmin.js` - قائمة جميع المنشورات
- `AdminPostDetails.js` - تفاصيل منشور
- `EditePost.js` - تعديل منشور

---

### 9. 📬 Problem Request Service (`problemRequestService.js`)
**المجلد:** `src/Pages/ProblemRequest/Admin/`

**الدوال:**
- `getAllProblemRequests()` - جلب جميع طلبات المسائل
- `getProblemRequestById()` - جلب طلب مسألة محدد
- `approveProblemRequest()` - الموافقة على طلب
- `rejectProblemRequest()` - رفض طلب
- `updateProblemRequest()` - تحديث طلب

**الملفات المرتبطة:**
- `AllProblemRequest.js` - قائمة طلبات المسائل
- `EditProblemRequest.js` - تعديل طلب مسألة

---

### 10. 🧠 Algorithm Service (`algorithmService.js`)
**المجلد:** `src/Pages/ExplaineTag/Admin/`

**الدوال:**
- `getAllAlgorithmsWithTags()` - جلب جميع الخوارزميات مع التاغات
- `getAlgorithmById()` - جلب خوارزمية محددة
- `getAlgorithmsByTag()` - جلب الخوارزميات حسب التاغ
- `addAlgorithm()` - إضافة خوارزمية جديدة (للأدمن)
- `updateAlgorithm()` - تحديث خوارزمية (للأدمن)
- `deleteAlgorithm()` - حذف خوارزمية (للأدمن)

**الملفات المرتبطة:**
- `AlgorithmsAdmin.js` - قائمة الخوارزميات
- `AddAlgorithm.js` - إضافة خوارزمية
- `EditAlgorithm.js` - تعديل خوارزمية
- `AlgorithmDetailsShow.js` - عرض تفاصيل خوارزمية
- `ShowTags.js` - عرض التاغات

---

### 11. 🏛️ University Service (`UniversityService.js`)
**المجلد:** `src/Pages/University/Admin/`

**الدوال:**
- `getAllUniversities()` - جلب جميع الجامعات
- `getUniversityById()` - جلب جامعة محددة
- `addUniversity()` - إضافة جامعة جديدة (للأدمن)
- `updateUniversity()` - تحديث جامعة (للأدمن)
- `deleteUniversity()` - حذف جامعة (للأدمن)

**الملفات المرتبطة:**
- `UniversitiesAdmin.js` - قائمة الجامعات
- `AddUniversity.js` - إضافة جامعة
- `EditUniversity.js` - تعديل جامعة
- `UniversityShow.js` - عرض جامعة

---

### 12. 🌍 Country Service (`CountryService.js`)
**المجلد:** `src/Pages/Country/Admin/` (إن وجد)

**الدوال:**
- `getAllCountries()` - جلب جميع الدول
- `addCountry()` - إضافة دولة جديدة (للأدمن)
- `updateCountry()` - تحديث دولة (للأدمن)
- `deleteCountry()` - حذف دولة (للأدمن)

---

### 13. 👨‍💼 Admin Service (`adminService.js`)
**المجلد:** متعدد (تقييمات، اقتباسات، إشعارات)

**الدوال:**

#### Problem Evaluations (Admin):
- `getProblemEvaluations()` - جلب تقييمات مسألة
- `updateEvaluation()` - تحديث تقييم
- `deleteEvaluation()` - حذف تقييم

#### Motivational Quotes:
- `getQuotesByType()` - جلب الاقتباسات حسب النوع
- `addQuote()` - إضافة اقتباس جديد
- `updateQuote()` - تحديث اقتباس
- `deleteQuote()` - حذف اقتباس

#### Notifications:
- `sendNotification()` - إرسال إشعار
- `getNotificationStats()` - جلب إحصائيات الإشعارات

**الملفات المرتبطة:**
- `src/Pages/Problems/Admin/ProblemEvaluationAdmin.js` - إدارة التقييمات
- `src/Pages/Qoute/` - إدارة الاقتباسات (إن وجد)
- `src/Pages/Notification/` - إدارة الإشعارات (إن وجد)

---

## 📦 كيفية الاستخدام

### مثال: استخدام User Service في صفحة الأدمن

```javascript
import { getAllUsers, addUser, deleteUser } from "../../Service/userService";

// في المكون
const [users, setUsers] = useState([]);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  fetchUsers();
}, []);
```

### مثال: استخدام Problem Service

```javascript
import { getAllProblems, addProblem, updateProblem, deleteProblem } from "../../Service/ProblemService";

// جلب جميع المسائل
const problems = await getAllProblems();

// إضافة مسألة جديدة
const newProblem = await addProblem({
  title: "عنوان المسألة",
  descriptionProblem: "وصف المسألة",
  // ... باقي البيانات
});
```

---

## ⚠️ ملاحظات مهمة

1. **Authentication**: جميع APIs تحتاج إلى Token في Headers (يتم إضافتها تلقائياً من `api.js`)

2. **Error Handling**: جميع Services تحتوي على معالجة أخطاء شاملة

3. **Content-Type**: 
   - معظم POST/PUT تحتاج `application/json`
   - رفع الملفات تحتاج `multipart/form-data`

4. **IDs**: تأكد من تحويل IDs إلى Numbers عند الإرسال

5. **Dates**: استخدم ISO format للتواريخ: `new Date().toISOString()`

---

## 🔄 التحديثات المستقبلية

- إضافة المزيد من Services حسب الحاجة
- تحديث التوثيق عند إضافة APIs جديدة
- تحسين معالجة الأخطاء

---

## 📞 الدعم

في حالة وجود مشاكل أو أسئلة، راجع:
- ملفات Services في `src/Service/`
- ملفات الأدمن في `src/Pages/*/Admin/`
- Console logs للتحقق من الأخطاء

