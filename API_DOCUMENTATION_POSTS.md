# 📚 توثيق APIs لنشر المنشورات ورفع الصور

## 🔗 Base URL
```
http://arabcodetest.runasp.net
```

## 🔐 Authentication
جميع الطلبات تحتاج إلى Bearer Token في Header:
```javascript
Authorization: Bearer {token}
```
الـ Token يتم الحصول عليه من `localStorage.getItem("token")`

---

## 1️⃣ رفع الصور - Upload Images

### Endpoint
```
POST /Upload/UploadImage
```

### Headers
```javascript
{
  "Content-Type": "multipart/form-data",
  "Authorization": "Bearer {token}"
}
```

### Request Body (FormData)
```javascript
const formData = new FormData();
formData.append("image", imageFile); // File object
```

### Response
```javascript
// Success Response (200)
"https://example.com/uploads/image123.jpg" // String URL للصورة المرفوعة
```

### مثال على الاستخدام
```javascript
import api from "./Service/api";

export const uploadUserImage = async (imageFile) => {
  if (!imageFile) return null;

  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await api.post("/Upload/UploadImage", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  
  return res.data; // URL الصورة
};
```

### ملاحظات
- ✅ يقبل ملفات الصور فقط (`image/*`)
- ✅ يمكن رفع صورة واحدة في كل طلب
- ✅ لرفع عدة صور، يجب عمل عدة طلبات منفصلة
- ✅ الـ Response هو String يحتوي على URL الصورة

---

## 2️⃣ رفع الفيديوهات - Upload Videos

### Endpoint
```
POST /upload/UploadVideo
```

### Headers
```javascript
{
  "Content-Type": "multipart/form-data",
  "Authorization": "Bearer {token}"
}
```

### Request Body (FormData)
```javascript
const formData = new FormData();
formData.append("video", videoFile); // File object
```

### Response
```javascript
// Success Response (200)
"https://example.com/uploads/video123.mp4" // String URL للفيديو المرفوع
```

### مثال على الاستخدام
```javascript
import api from "./Service/api";

export const uploadUserVideo = async (videoFile) => {
  if (!videoFile) return null;

  const formData = new FormData();
  formData.append("video", videoFile);

  const res = await api.post("/upload/UploadVideo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  
  return res.data; // URL الفيديو
};
```

### ملاحظات
- ✅ يقبل ملفات الفيديو فقط (`video/*`)
- ✅ يمكن رفع فيديو واحد في كل طلب
- ✅ لرفع عدة فيديوهات، يجب عمل عدة طلبات منفصلة

---

## 3️⃣ إنشاء منشور جديد - Create Post

### Endpoint
```
POST /Post/Add
```

### Headers
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

### Request Body (JSON)
```javascript
{
  "title": "عنوان المنشور",              // String (مطلوب)
  "content": "محتوى المنشور",            // String (مطلوب - يمكن أن يكون HTML)
  "userId": 123,                         // Number (مطلوب)
  "images": [                            // Array<String> (اختياري)
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "videos": [                            // Array<Object> (اختياري)
    {
      "title": "عنوان الفيديو",          // String (اختياري)
      "description": "وصف الفيديو",      // String (اختياري)
      "url": "https://example.com/video.mp4",        // String (مطلوب)
      "thumbnailUrl": "https://example.com/thumb.jpg" // String (اختياري)
    }
  ],
  "tags": [1, 2, 3]                      // Array<Number> (اختياري) - IDs للوسوم
}
```

### Response
```javascript
// Success Response (200)
{
  "id": 456,                    // Number - ID المنشور الجديد
  "postId": 456,                // Number - (أحياناً)
  "title": "عنوان المنشور",
  "content": "محتوى المنشور",
  "userId": 123,
  "createdAt": "2024-01-01T00:00:00Z",
  // ... باقي البيانات
}
```

### مثال على الاستخدام الكامل
```javascript
import api from "./Service/api";
import { uploadUserImage } from "./Service/userService";

const createPost = async (postData) => {
  try {
    // 1. رفع الصور أولاً
    const uploadedImageUrls = [];
    for (const imageFile of postData.imageFiles) {
      const url = await uploadUserImage(imageFile);
      uploadedImageUrls.push(url);
    }

    // 2. إعداد بيانات المنشور
    const body = {
      title: postData.title,
      content: postData.content,
      userId: Number(postData.userId),
      images: uploadedImageUrls,
      videos: postData.videos || [],
      tags: postData.tags || []
    };

    // 3. إنشاء المنشور
    const res = await api.post("/Post/Add", body);
    
    return res.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};
```

### ملاحظات
- ✅ يجب رفع الصور/الفيديوهات **قبل** إنشاء المنشور
- ✅ `images` يجب أن تكون مصفوفة من URLs (Strings) وليس File objects
- ✅ `videos` يجب أن تحتوي على `url` على الأقل
- ✅ `tags` هي مصفوفة من IDs (Numbers) وليس أسماء الوسوم
- ✅ `userId` يجب أن يكون Number

---

## 4️⃣ جلب الوسوم المتاحة - Get All Tags

### Endpoint
```
GET /AllTags
```

### Headers
```javascript
{
  "Authorization": "Bearer {token}" // (اختياري)
}
```

### Response
```javascript
// Success Response (200)
[
  {
    "id": 1,
    "tagName": "JavaScript"
  },
  {
    "id": 2,
    "tagName": "React"
  }
]
```

### مثال على الاستخدام
```javascript
import api from "./Service/api";

export const getAllTags = async () => {
  const response = await api.get("/AllTags");
  return response.data; // Array of tags
};
```

---

## 📋 سير العمل الكامل (Workflow)

### خطوات نشر منشور مع صور:

1. **جلب الوسوم المتاحة** (اختياري)
   ```javascript
   const tags = await getAllTags();
   ```

2. **رفع الصور واحدة تلو الأخرى**
   ```javascript
   const imageUrls = [];
   for (const imageFile of selectedImages) {
     const url = await uploadUserImage(imageFile);
     imageUrls.push(url);
   }
   ```

3. **رفع الفيديوهات** (إن وجدت)
   ```javascript
   const videoUrls = [];
   for (const videoFile of selectedVideos) {
     const url = await uploadUserVideo(videoFile);
     videoUrls.push(url);
   }
   ```

4. **إنشاء المنشور**
   ```javascript
   const postData = {
     title: "عنوان المنشور",
     content: "محتوى المنشور",
     userId: 123,
     images: imageUrls,
     videos: videoUrls.map(url => ({ url })),
     tags: [1, 2, 3]
   };
   
   const response = await api.post("/Post/Add", postData);
   ```

---

## ⚠️ أخطاء شائعة

### 1. رفع File object مباشرة في Post/Add
```javascript
// ❌ خطأ
images: [imageFile1, imageFile2]

// ✅ صحيح
images: ["https://...", "https://..."]
```

### 2. إرسال أسماء الوسوم بدلاً من IDs
```javascript
// ❌ خطأ
tags: ["JavaScript", "React"]

// ✅ صحيح
tags: [1, 2]
```

### 3. نسيان رفع الصور قبل إنشاء المنشور
```javascript
// ❌ خطأ - سيفشل
const postData = {
  images: [imageFile] // File object
};

// ✅ صحيح
const url = await uploadUserImage(imageFile);
const postData = {
  images: [url] // URL string
};
```

---

## 🔍 أمثلة كاملة

### مثال 1: منشور بسيط مع نص فقط
```javascript
const createSimplePost = async () => {
  const postData = {
    title: "منشور بسيط",
    content: "هذا محتوى المنشور",
    userId: Number(localStorage.getItem("idUser")),
    images: [],
    videos: [],
    tags: []
  };
  
  const res = await api.post("/Post/Add", postData);
  return res.data;
};
```

### مثال 2: منشور مع صور متعددة
```javascript
const createPostWithImages = async (content, imageFiles) => {
  // رفع الصور
  const imageUrls = [];
  for (const file of imageFiles) {
    const url = await uploadUserImage(file);
    imageUrls.push(url);
  }
  
  // إنشاء المنشور
  const postData = {
    title: content.substring(0, 100) || "منشور جديد",
    content: content,
    userId: Number(localStorage.getItem("idUser")),
    images: imageUrls,
    videos: [],
    tags: []
  };
  
  const res = await api.post("/Post/Add", postData);
  return res.data;
};
```

### مثال 3: منشور كامل مع صور وفيديوهات ووسوم
```javascript
const createFullPost = async (data) => {
  const { title, content, imageFiles, videoFiles, selectedTagIds } = data;
  
  // رفع الصور
  const imageUrls = [];
  for (const file of imageFiles) {
    const url = await uploadUserImage(file);
    imageUrls.push(url);
  }
  
  // رفع الفيديوهات
  const videos = [];
  for (const file of videoFiles) {
    const videoUrl = await uploadUserVideo(file);
    const thumbUrl = await uploadUserImage(file.thumbnail); // إذا كان هناك thumbnail
    
    videos.push({
      title: file.title || "",
      description: file.description || "",
      url: videoUrl,
      thumbnailUrl: thumbUrl || null
    });
  }
  
  // إنشاء المنشور
  const postData = {
    title: title,
    content: content,
    userId: Number(localStorage.getItem("idUser")),
    images: imageUrls,
    videos: videos,
    tags: selectedTagIds
  };
  
  const res = await api.post("/Post/Add", postData);
  return res.data;
};
```

---

## 📝 ملخص سريع

| API | Method | Purpose | Input | Output |
|-----|--------|---------|-------|--------|
| `/Upload/UploadImage` | POST | رفع صورة | FormData (image) | String URL |
| `/upload/UploadVideo` | POST | رفع فيديو | FormData (video) | String URL |
| `/Post/Add` | POST | إنشاء منشور | JSON (title, content, userId, images[], videos[], tags[]) | Object (Post data) |
| `/AllTags` | GET | جلب الوسوم | - | Array<Tag> |

---

## 🔗 الملفات المرجعية في المشروع

- `src/Service/api.js` - إعدادات Axios و Base URL
- `src/Service/userService.js` - دالة `uploadUserImage`
- `src/Pages/Posts/User/CreatePostModal.js` - مثال على استخدام APIs
- `src/Pages/Posts/User/AddPost.js` - مثال متقدم مع TinyMCE
- `src/Service/TagServices.js` - دالة `getAllTags`

