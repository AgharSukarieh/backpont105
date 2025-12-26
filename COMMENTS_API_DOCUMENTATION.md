# 💬 توثيق API التعليقات (Comments API Documentation)

## 🔗 Base URL

```
http://arabcodetest.runasp.net
```

---

## 1️⃣ جلب التعليقات (Get Comments)

### **Endpoint:**

```
GET /api/posts/{postId}
```

### **المنطق والخطوات (Logic & Flow):**

1. يتم إرسال طلب GET إلى `/api/posts/{postId}`
2. يتم استبدال `{postId}` برقم المنشور المطلوب
3. يتم إضافة Token تلقائياً في Header
4. الـ API يرجع المنشور مع جميع التعليقات المرفقة به
5. التعليقات تكون في حقل `comments` ضمن الـ response

### **Request Headers:**

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}
```

### **URL Parameters:**

- `postId` (path parameter) - رقم المنشور (مطلوب)
  - نوع: `number`
  - مثال: `1`, `2`, `3`, إلخ

### **Response Structure:**

```typescript
interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  userName: string;
  imageURL: string;
  numberLike: number;
  isLikedIt: boolean | null;
  mostCommonType: number;
  secondCommonType: number;
  thirdCommonType: number;
  videos: string[];
  images: string[];
  postTags: PostTag[];
  numberComment?: number;        // عدد التعليقات
  comments?: Comment[];          // قائمة التعليقات
}

interface Comment {
  id: number;                    // رقم التعليق
  text: string;                  // نص التعليق
  createdAt: string;             // تاريخ الإنشاء (ISO format)
  userId: number;                // رقم المستخدم الذي كتب التعليق
  userName: string;              // اسم المستخدم
  imageURL: string;              // صورة المستخدم
  postId: number;                // رقم المنشور
  parentCommentId?: number;      // رقم التعليق الأب (إذا كان رد)
  replies?: Comment[];           // الردود على هذا التعليق
}
```

### **Response Example:**

```json
{
  "id": 1,
  "title": "عنوان المنشور",
  "content": "محتوى المنشور",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": null,
  "userId": 5,
  "userName": "أحمد محمد",
  "imageURL": "https://example.com/user.png",
  "numberLike": 10,
  "isLikedIt": true,
  "mostCommonType": 1,
  "secondCommonType": 2,
  "thirdCommonType": 3,
  "videos": [],
  "images": ["https://example.com/image.jpg"],
  "postTags": [],
  "numberComment": 3,
  "comments": [
    {
      "id": 1,
      "text": "تعليق رائع!",
      "createdAt": "2024-01-15T11:00:00Z",
      "userId": 2,
      "userName": "محمد علي",
      "imageURL": "https://example.com/user2.png",
      "postId": 1,
      "parentCommentId": null,
      "replies": []
    },
    {
      "id": 2,
      "text": "شكراً لك",
      "createdAt": "2024-01-15T11:05:00Z",
      "userId": 3,
      "userName": "فاطمة",
      "imageURL": "https://example.com/user3.png",
      "postId": 1,
      "parentCommentId": 1,
      "replies": []
    },
    {
      "id": 3,
      "text": "معلومات مفيدة جداً",
      "createdAt": "2024-01-15T11:10:00Z",
      "userId": 4,
      "userName": "خالد",
      "imageURL": "https://example.com/user4.png",
      "postId": 1,
      "parentCommentId": null,
      "replies": []
    }
  ]
}
```

### **كود التطبيق المستخدم:**

```typescript
// في postsService.ts
export const getPostWithComments = async (postId: number): Promise<Post> => {
  try {
    console.log('📤 Fetching post with comments:', postId);
    
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      throw new Error('معرف المنشور غير صحيح');
    }
    
    const response = await api.get(`/api/posts/${numericPostId}`);
    console.log('✅ Post with comments fetched:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching post with comments:', error?.response?.data || error);
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب المنشور والتعليقات');
  }
};

// استخدام في المكون
const loadComments = async (postId: number) => {
  try {
    setLoadingComments(true);
    const postWithComments = await getPostWithComments(postId);
    const fetchedComments = postWithComments.comments || [];
    setComments(fetchedComments);
  } catch (error: any) {
    console.error('❌ Error loading comments:', error);
    Alert.alert('خطأ', error?.message || 'حدث خطأ في جلب التعليقات');
    setComments([]);
  } finally {
    setLoadingComments(false);
  }
};
```

---

## 2️⃣ جلب ردود تعليق محدد (Get Replies for a Comment)

### **Endpoint:**

```
GET /api/comments/{parentCommentId}/replies
```

### **المنطق والخطوات (Logic & Flow):**

1. يتم إرسال طلب GET إلى `/api/comments/{parentCommentId}/replies`
2. يتم استبدال `{parentCommentId}` برقم التعليق الأب
3. يتم إضافة Token تلقائياً في Header
4. الـ API يرجع قائمة بجميع الردود على هذا التعليق

### **Request Headers:**

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}
```

### **URL Parameters:**

- `parentCommentId` (path parameter) - رقم التعليق الأب (مطلوب)
  - نوع: `number`
  - مثال: `1`, `2`, `3`, إلخ

### **Response Structure:**

```typescript
// Response هو array من Comment objects
Comment[]
```

### **Response Example:**

```json
[
  {
    "id": 2,
    "text": "شكراً لك",
    "createdAt": "2024-01-15T11:05:00Z",
    "userId": 3,
    "userName": "فاطمة",
    "imageURL": "https://example.com/user3.png",
    "postId": 1,
    "parentCommentId": 1,
    "replies": []
  },
  {
    "id": 5,
    "text": "أوافقك الرأي",
    "createdAt": "2024-01-15T11:15:00Z",
    "userId": 6,
    "userName": "سارة",
    "imageURL": "https://example.com/user6.png",
    "postId": 1,
    "parentCommentId": 1,
    "replies": []
  }
]
```

### **كود التطبيق المستخدم:**

```typescript
const fetchReplies = async (parentId: number) => {
  setRepliesLoading((prev) => {
    const next = new Set(prev);
    next.add(parentId);
    return next;
  });
  
  try {
    const response = await api.get(`/api/comments/${parentId}/replies`);
    const data = Array.isArray(response.data) ? response.data : [];
    setRepliesByParent((prev) => ({ ...prev, [parentId]: data }));
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
  } catch (error) {
    console.error('❌ Error fetching replies:', error);
  } finally {
    setRepliesLoading((prev) => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  }
};
```

---

## 3️⃣ إرسال تعليق جديد (Create/Comment Comment)

### **Endpoint:**

```
POST /api/comments
```

### **المنطق والخطوات (Logic & Flow):**

1. يتم إرسال طلب POST إلى `/api/comments`
2. يتم إرسال البيانات في Body (JSON format)
3. يتم إضافة Token تلقائياً في Header
4. إذا كان `parentCommentId` = `null`، يكون تعليق جديد على المنشور
5. إذا كان `parentCommentId` له قيمة، يكون رداً على تعليق موجود
6. بعد الإرسال الناجح، يتم إعادة تحميل التعليقات

### **Request Headers:**

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

### **Request Body:**

```typescript
interface CreateCommentPayload {
  text: string;                  // نص التعليق (مطلوب)
  postId: number;                // رقم المنشور (مطلوب)
  userId: number;                // رقم المستخدم (مطلوب)
  parentCommentId?: number | null; // رقم التعليق الأب (اختياري - null للتعليق الرئيسي)
  createdAt: string;             // تاريخ الإنشاء (ISO format - مطلوب)
}
```

### **Request Example:**

```json
{
  "text": "هذا تعليق رائع!",
  "postId": 1,
  "userId": 5,
  "parentCommentId": null,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

**لإرسال رد على تعليق:**

```json
{
  "text": "شكراً لك على التعليق",
  "postId": 1,
  "userId": 5,
  "parentCommentId": 1,
  "createdAt": "2024-01-15T12:05:00Z"
}
```

### **Response Structure:**

```typescript
// Response هو Comment object الذي تم إنشاؤه
Comment
```

### **Response Example:**

```json
{
  "id": 10,
  "text": "هذا تعليق رائع!",
  "createdAt": "2024-01-15T12:00:00Z",
  "userId": 5,
  "userName": "أحمد محمد",
  "imageURL": "https://example.com/user.png",
  "postId": 1,
  "parentCommentId": null,
  "replies": []
}
```

### **كود التطبيق المستخدم:**

```typescript
const sendComment = async () => {
  if (!newCommentText.trim() || !selectedPostForComments) return;
  try {
    setSendingComment(true);
    
    const numericPostId = parseInt(String(selectedPostForComments.id), 10);
    if (isNaN(numericPostId) || numericPostId <= 0) {
      throw new Error('معرف المنشور غير صحيح');
    }
    // الحصول على معلومات المستخدم
    const user = await getStoredUser();
    if (!user) {
      Alert.alert('خطأ', 'لم يتم العثور على معلومات المستخدم. يرجى تسجيل الدخول مرة أخرى');
      setSendingComment(false);
      return;
    }
    // استخدام userId من المستخدم
    const userIdValue = user.id || user.userId || user.uid || user.Id || user.user_id;
    let userId: number;
    
    if (typeof userIdValue === 'number') {
      userId = userIdValue;
    } else if (typeof userIdValue === 'string') {
      userId = parseInt(userIdValue, 10);
    } else {
      userId = 0;
    }
    const payload = {
      text: newCommentText.trim(),
      postId: numericPostId,
      userId: userId,
      parentCommentId: replyTarget?.id ?? null, // null للتعليق الرئيسي، أو id التعليق للرد
      createdAt: new Date().toISOString(),
    };
    console.log('📤 Sending comment...', payload);
    const response = await api.post('/api/comments', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    });
    console.log('✅ Comment sent successfully:', response.data);
    // Clear input and reply target
    setNewCommentText('');
    setReplyTarget(null);
    
    // إعادة تحميل التعليقات من الـ API
    await loadComments(numericPostId);
    
    // تحديث عدد التعليقات في المنشور
    if (selectedPostForComments) {
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === selectedPostForComments.id) {
            return {
              ...p,
              numberComment: (p.numberComment || 0) + 1,
            };
          }
          return p;
        })
      );
    }
  } catch (error: any) {
    console.error('❌ Error sending comment:', error);
    
    let errorMessage = 'حدث خطأ في إرسال التعليق';
    
    if (error?.response) {
      if (error.response.status === 500) {
        errorMessage = 'خطأ في الخادم (500). يرجى المحاولة مرة أخرى لاحقاً';
      } else if (error.response.data) {
        if (typeof error.response.data === 'string' && error.response.data.trim()) {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          errorMessage = JSON.stringify(error.response.data.errors);
        }
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('خطأ', errorMessage);
  } finally {
    setSendingComment(false);
  }
};
```

---

## 📝 ملاحظات مهمة (Important Notes):

1. **Authentication (التوثيق):**
   - جميع الطلبات تحتاج إلى Token في Header
   - يتم إضافة Token تلقائياً عبر axios interceptor
   - إذا انتهت صلاحية Token، يتم تجديده تلقائياً

2. **Comment Types (أنواع التعليقات):**
   - **تعليق رئيسي**: `parentCommentId` = `null` - يتم إضافته مباشرة على المنشور
   - **رد**: `parentCommentId` = رقم التعليق الأب - يكون رداً على تعليق موجود

3. **Data Validation (التحقق من البيانات):**
   - يجب أن يكون `text` غير فارغ (يتم trim)
   - يجب أن يكون `postId` رقم صحيح وموجب
   - يجب أن يكون `userId` رقم صحيح
   - `parentCommentId` يمكن أن يكون `null` أو رقم

4. **Error Handling (معالجة الأخطاء):**
   - خطأ 500: خطأ في الخادم
   - خطأ 401: غير مصرح - يتم محاولة تجديد Token تلقائياً
   - خطأ 400: بيانات غير صحيحة

5. **After Sending Comment (بعد إرسال التعليق):**
   - يتم إعادة تحميل التعليقات من الـ API
   - يتم تحديث عدد التعليقات في المنشور محلياً
   - يتم مسح حقل الإدخال و`replyTarget`

---

## 🔄 ملخص سريع (Quick Summary):

| العملية | Endpoint | Method | Parameters | Request Body | Response |
|---------|----------|--------|------------|--------------|----------|
| جلب التعليقات | `/api/posts/{postId}` | GET | `postId` (path) | لا يوجد | `Post` (مع `comments`) |
| جلب الردود | `/api/comments/{parentId}/replies` | GET | `parentId` (path) | لا يوجد | `Comment[]` |
| إرسال تعليق | `/api/comments` | POST | لا يوجد | `CreateCommentPayload` | `Comment` |

---

## 💻 مثال استخدام كامل (Full Usage Example):

```typescript
import api from '@/services/api';

// 1. جلب تعليقات منشور
const fetchComments = async (postId: number) => {
  try {
    const response = await api.get(`/api/posts/${postId}`);
    const post: Post = response.data;
    const comments: Comment[] = post.comments || [];
    
    console.log(`Post: ${post.title}`);
    console.log(`Comments count: ${comments.length}`);
    
    comments.forEach(comment => {
      console.log(`  - ${comment.userName}: ${comment.text}`);
      if (comment.replies && comment.replies.length > 0) {
        console.log(`    Replies: ${comment.replies.length}`);
      }
    });
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// 2. جلب ردود تعليق محدد
const fetchCommentReplies = async (parentCommentId: number) => {
  try {
    const response = await api.get(`/api/comments/${parentCommentId}/replies`);
    const replies: Comment[] = Array.isArray(response.data) ? response.data : [];
    
    console.log(`Replies for comment ${parentCommentId}: ${replies.length}`);
    
    return replies;
  } catch (error) {
    console.error('Error fetching replies:', error);
    throw error;
  }
};

// 3. إرسال تعليق جديد
const createComment = async (
  postId: number, 
  userId: number, 
  text: string, 
  parentCommentId: number | null = null
) => {
  try {
    const payload = {
      text: text.trim(),
      postId: postId,
      userId: userId,
      parentCommentId: parentCommentId,
      createdAt: new Date().toISOString(),
    };
    const response = await api.post('/api/comments', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    });
    const newComment: Comment = response.data;
    console.log('Comment created:', newComment.id);
    
    return newComment;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// استخدام
const example = async () => {
  const postId = 1;
  const userId = 5;
  
  // جلب التعليقات
  const comments = await fetchComments(postId);
  
  // إرسال تعليق رئيسي
  const newComment = await createComment(postId, userId, "تعليق رائع!", null);
  
  // إرسال رد على تعليق
  if (comments.length > 0) {
    const firstCommentId = comments[0].id;
    const reply = await createComment(postId, userId, "شكراً لك!", firstCommentId);
    
    // جلب الردود
    const replies = await fetchCommentReplies(firstCommentId);
  }
};
```

---

## 🎯 حالات الاستخدام الشائعة (Common Use Cases):

### 1. عرض التعليقات عند فتح منشور:

```typescript
const openComments = async (postId: number) => {
  setShowCommentsModal(true);
  await loadComments(postId);
};
```

### 2. إرسال تعليق جديد:

```typescript
const handleSendComment = async () => {
  if (!commentText.trim()) return;
  await sendComment();
};
```

### 3. إرسال رد على تعليق:

```typescript
const handleReply = (comment: Comment) => {
  setReplyTarget(comment);
  // سيتم استخدام replyTarget.id كـ parentCommentId عند الإرسال
};
```

### 4. عرض/إخفاء الردود:

```typescript
const handleToggleReplies = async (commentId: number) => {
  if (!expandedComments.has(commentId)) {
    // إذا لم تكن مفتوحة، جلب الردود
    await fetchReplies(commentId);
  } else {
    // إغلاق الردود
    toggleReplies(commentId);
  }
};
```

---

## 🔧 Implementation في المشروع الحالي:

### **الملفات المستخدمة:**

1. **`src/Service/commentService.js`** (إن وجد):
   - `getPostWithComments(postId)` - جلب المنشور مع التعليقات
   - `getCommentReplies(parentCommentId)` - جلب ردود تعليق
   - `createComment(payload)` - إرسال تعليق جديد

2. **`src/Pages/Posts/Post.js`** أو ملفات مشابهة:
   - عرض التعليقات
   - إرسال تعليقات جديدة
   - إرسال ردود

### **ميزات التطبيق:**

✅ معالجة تلقائية للـ Token  
✅ تجديد Token تلقائياً عند انتهاء الصلاحية  
✅ التحقق من صحة البيانات (validation)  
✅ معالجة الأخطاء بشكل شامل  
✅ دعم التعليقات الرئيسية والردود  
✅ تحديث تلقائي بعد إرسال التعليق  

---

**آخر تحديث:** 2024

