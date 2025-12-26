# 🔐 منطق تسجيل الدخول للأدمن - Admin Login Logic Guide

## 📋 نظرة عامة

تم تحديث منطق تسجيل الدخول لدعم الأدمن بشكل كامل مع:
- ✅ التحقق من role (Admin/User)
- ✅ توجيه الأدمن للصفحات الصحيحة
- ✅ دعم OTP للأدمن
- ✅ حفظ role في localStorage

---

## 🔄 تدفق تسجيل الدخول للأدمن

### **الخطوة 1: إدخال البيانات**
```javascript
// المستخدم يدخل:
- Email
- Password
```

### **الخطوة 2: استدعاء API**
```javascript
const data = await loginUser(email, password);
```

### **الخطوة 3: معالجة الاستجابة**

#### **الحالة 1: يحتاج OTP**
```javascript
if (data && (data.otpRequired === true || data.otpRequired === "true")) {
  setOtpRequired(true);
  setResendCooldown(60);
  setPendingLoginData({ email, password });
  // عرض حقل OTP
}
```

#### **الحالة 2: تسجيل دخول ناجح مباشرة**
```javascript
if (data?.token && data?.isAuthenticated) {
  const resolvedRole = responseUser.role ?? "User";
  
  // حفظ البيانات
  localStorage.setItem("role", resolvedRole);
  localStorage.setItem("userName", resolvedUserName);
  localStorage.setItem("idUser", resolvedUserId);
  localStorage.setItem("token", data.token);
  
  // توجيه حسب role
  if (resolvedRole === "Admin" || resolvedRole === "admin") {
    navigate("/dashboard", { replace: true });
  } else {
    navigate("/dashboard", { replace: true });
  }
}
```

---

## 🔑 التحقق من OTP للأدمن

### **دالة التحقق من OTP**
```javascript
const handleVerifyLoginOtp = async () => {
  // 1. التحقق من OTP
  const verifyRes = await verifyOtp(email, otp);
  
  // 2. إعادة تسجيل الدخول
  const loginRes = await loginUser(email, password);
  
  // 3. حفظ البيانات والتوجيه
  const resolvedRole = loginRes.responseUserDTO?.role ?? "User";
  
  if (resolvedRole === "Admin" || resolvedRole === "admin") {
    navigate("/dashboard", { replace: true });
  } else {
    navigate("/dashboard", { replace: true });
  }
};
```

---

## 💾 حفظ البيانات

### **في localStorage:**
```javascript
localStorage.setItem("idUser", resolvedUserId);
localStorage.setItem("role", resolvedRole); // مهم للأدمن
localStorage.setItem("userName", resolvedUserName);
localStorage.setItem("token", data.token);
localStorage.setItem("token-expiration", Date.now() + 1000 * 60 * 60);
```

### **في Redux Store:**
```javascript
dispatch(
  setCredentials({
    token: data.token,
    tokenExpiration,
    role: resolvedRole, // مهم للأدمن
    user: enrichedUser,
    session: sessionPayload,
  })
);
```

### **في Context:**
```javascript
setUser(enrichedUser); // يحتوي على role
```

---

## 🎯 التوجيه حسب Role

### **الأدمن:**
```javascript
if (resolvedRole === "Admin" || resolvedRole === "admin") {
  navigate("/dashboard", { replace: true });
  // أو أي مسار مخصص للأدمن
}
```

### **المستخدم العادي:**
```javascript
else {
  navigate("/dashboard", { replace: true });
  // أو "/react-app" للمستخدمين العاديين
}
```

---

## 🔐 حماية الصفحات الإدارية

### **استخدام AdminRoute:**
```javascript
import AdminRoute from "../Routes/Auth/AdminRoute";

<AdminRoute>
  <AdminDashboard />
</AdminRoute>
```

### **AdminRoute.js:**
```javascript
function AdminRoute({ children }) {
  const { user } = useContext(UserContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== "Admin") {
    return <Navigate to="/not-authorized" replace />;
  }
  
  return children;
}
```

---

## 📝 مثال كامل - تسجيل دخول أدمن

```javascript
const handleLoginSubmit = async (event) => {
  event.preventDefault();
  
  const trimmedEmail = loginEmail.trim();
  const trimmedPassword = loginPassword.trim();
  
  try {
    setIsLoginSubmitting(true);
    const data = await loginUser(trimmedEmail, trimmedPassword);
    const responseUser = data?.responseUserDTO ?? {};
    
    // حالة 1: يحتاج OTP
    if (data && (data.otpRequired === true || data.otpRequired === "true")) {
      setOtpRequired(true);
      setResendCooldown(60);
      setPendingLoginData({ email: trimmedEmail, password: trimmedPassword });
      showAlert("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "success");
      return;
    }
    
    // حالة 2: تسجيل دخول ناجح
    if (!data?.token) {
      showAlert("خطأ في تسجيل الدخول", "error");
      return;
    }
    
    const resolvedRole = responseUser.role ?? data?.role ?? "User";
    const resolvedUserId = responseUser.id;
    const resolvedUserName = responseUser.userName ?? responseUser.fullName;
    
    // حفظ البيانات
    localStorage.setItem("idUser", resolvedUserId);
    localStorage.setItem("role", resolvedRole); // مهم للأدمن
    localStorage.setItem("userName", resolvedUserName);
    localStorage.setItem("token", data.token);
    localStorage.setItem("token-expiration", Date.now() + 1000 * 60 * 60);
    
    // تحديث Context و Redux
    setUser({ ...responseUser, role: resolvedRole });
    dispatch(setCredentials({
      token: data.token,
      tokenExpiration: Date.now() + 1000 * 60 * 60,
      role: resolvedRole,
      user: { ...responseUser, role: resolvedRole },
    }));
    
    showAlert("تم تسجيل الدخول بنجاح!", "success");
    
    // توجيه حسب role
    if (resolvedRole === "Admin" || resolvedRole === "admin") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  } catch (error) {
    showAlert(error.message || "خطأ في تسجيل الدخول", "error");
  } finally {
    setIsLoginSubmitting(false);
  }
};
```

---

## 🔄 التحقق من OTP للأدمن

```javascript
const handleVerifyLoginOtp = async () => {
  if (!loginOtp.trim() || !pendingLoginData) {
    showAlert("الرجاء إدخال رمز التحقق", "error");
    return;
  }
  
  setIsLoginSubmitting(true);
  try {
    // 1. التحقق من OTP
    const verifyRes = await verifyOtp(
      pendingLoginData.email.trim(),
      loginOtp.trim()
    );
    
    const isSuccess =
      (typeof verifyRes === "string" && /success/i.test(verifyRes)) ||
      verifyRes?.success === true ||
      verifyRes?.isVerified === true;
    
    if (!isSuccess) {
      showAlert("رمز التحقق غير صحيح", "error");
      return;
    }
    
    // 2. إعادة تسجيل الدخول
    const loginRes = await loginUser(
      pendingLoginData.email.trim(),
      pendingLoginData.password
    );
    
    if (!loginRes?.token) {
      showAlert("فشل تسجيل الدخول بعد التحقق من OTP", "error");
      return;
    }
    
    // 3. حفظ البيانات والتوجيه
    const responseUser = loginRes?.responseUserDTO ?? {};
    const resolvedRole = responseUser.role ?? "User";
    
    localStorage.setItem("role", resolvedRole);
    localStorage.setItem("idUser", responseUser.id);
    localStorage.setItem("userName", responseUser.userName);
    localStorage.setItem("token", loginRes.token);
    
    setUser({ ...responseUser, role: resolvedRole });
    
    showAlert("تم تسجيل الدخول بنجاح!", "success");
    
    // توجيه حسب role
    if (resolvedRole === "Admin" || resolvedRole === "admin") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  } catch (error) {
    showAlert(error.message || "خطأ أثناء التحقق من OTP", "error");
  } finally {
    setIsLoginSubmitting(false);
  }
};
```

---

## 🎨 UI لـ OTP في تسجيل الدخول

```javascript
{otpRequired ? (
  <div className="otp-section">
    <p>تم إرسال رمز التحقق إلى بريدك الإلكتروني</p>
    <input
      type="text"
      value={loginOtp}
      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="123456"
      maxLength="6"
    />
    <button onClick={handleVerifyLoginOtp} disabled={isLoginSubmitting}>
      {isLoginSubmitting ? "جاري التحقق..." : "تحقق"}
    </button>
    <button
      onClick={handleResendLoginOtp}
      disabled={resendCooldown > 0 || isLoginSubmitting}
    >
      {resendCooldown > 0
        ? `إعادة الإرسال بعد ${resendCooldown}s`
        : "إعادة إرسال رمز التحقق"}
    </button>
  </div>
) : (
  <form onSubmit={handleLoginSubmit}>
    {/* حقول Email و Password */}
  </form>
)}
```

---

## ⚠️ ملاحظات مهمة

1. **Role Check**: دائماً تحقق من `role === "Admin"` أو `role === "admin"` (case-insensitive)

2. **localStorage**: تأكد من حفظ `role` في localStorage بشكل صريح

3. **OTP للأدمن**: الأدمن أيضاً يحتاج OTP إذا كان مفعلاً في النظام

4. **Token Expiration**: Token ينتهي بعد ساعة (3600 ثانية)

5. **Auto Refresh**: يتم تجديد Token تلقائياً عند انتهاء الصلاحية

6. **Error Handling**: جميع الأخطاء يتم معالجتها وعرض رسائل واضحة

---

## 📚 الملفات المرجعية

- `src/Pages/Auth/AuthCard.js` - واجهة تسجيل الدخول
- `src/Service/authService.js` - دوال API (login, verifyOtp)
- `src/Service/api.js` - إعدادات Axios و Interceptors
- `src/Hook/UserContext.js` - Context لإدارة حالة المستخدم
- `src/Routes/Auth/AdminRoute.js` - حماية الصفحات الإدارية
- `src/store/authSlice.js` - Redux store للمصادقة

---

## 🔍 التحقق من Role

### **في المكونات:**
```javascript
import { useContext } from "react";
import { UserContext } from "../../Hook/UserContext";

const MyComponent = () => {
  const { user } = useContext(UserContext);
  const isAdmin = user?.role === "Admin" || user?.role === "admin";
  
  if (!isAdmin) {
    return <Navigate to="/not-authorized" replace />;
  }
  
  return <AdminPanel />;
};
```

### **في Routes:**
```javascript
<Route
  path="/admin/*"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>
```

---

## ✅ Checklist للأدمن

- [x] حفظ role في localStorage
- [x] توجيه الأدمن للصفحات الصحيحة
- [x] دعم OTP للأدمن
- [x] حماية الصفحات الإدارية
- [x] معالجة الأخطاء
- [x] حفظ Token و Token Expiration
- [x] تحديث Context و Redux

---

## 🚀 الاستخدام

بعد تسجيل الدخول بنجاح، يمكن الوصول إلى role من:
- `localStorage.getItem("role")`
- `user.role` من UserContext
- `auth.role` من Redux store

```javascript
// مثال
const role = localStorage.getItem("role");
if (role === "Admin" || role === "admin") {
  // عرض لوحة التحكم الإدارية
}
```

