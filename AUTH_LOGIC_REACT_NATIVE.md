# لوجيك التسجيل الدخول والـ Register للتطبيق React Native

هذا الملف يحتوي على جميع الوظائف واللوجيك المطلوبة لتسجيل الدخول والتسجيل (Register) في تطبيق React Native.

---

## 📦 المتطلبات

```bash
npm install axios @react-native-async-storage/async-storage
# أو
yarn add axios @react-native-async-storage/async-storage
```

---

## 🔧 API Configuration

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://arabcodetest.runasp.net';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor لإضافة Token للطلبات
api.interceptors.request.use((config) => {
  const token = getStoredToken(); // سنعرف هذه الدالة لاحقاً
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🔐 AsyncStorage Helper Functions

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys للتخزين
const STORAGE_KEYS = {
  TOKEN: 'token',
  TOKEN_EXPIRATION: 'token-expiration',
  USER: 'auth-user',
  SESSION: 'auth-session',
  ID_USER: 'idUser',
  REMEMBER_EMAIL: 'auth-remember',
};

// حفظ Token
export const saveToken = async (token, expiration) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (expiration) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRATION, expiration.toString());
    }
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

// جلب Token
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// حفظ بيانات المستخدم
export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

// جلب بيانات المستخدم
export const getStoredUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// حفظ Session
export const saveSession = async (session) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// حفظ البريد المحفوظ (Remember Me)
export const saveRememberedEmail = async (email, remember) => {
  try {
    if (remember && email) {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, JSON.stringify({
        email,
        remember: true,
      }));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
    }
  } catch (error) {
    console.error('Error saving remembered email:', error);
  }
};

// جلب البريد المحفوظ
export const getRememberedEmail = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting remembered email:', error);
    return null;
  }
};

// مسح جميع البيانات
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRATION,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.ID_USER,
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
```

---

## 📧 Email Validation

```javascript
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

---

## 🔑 JWT Decode Function

```javascript
export const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};
```

---

## 📤 Send OTP Function

```javascript
import api from './api'; // axios instance

export const sendOtp = async (email) => {
  try {
    if (!email || !email.trim()) {
      throw new Error('البريد الإلكتروني مطلوب');
    }

    const emailValue = email.trim();

    console.log('Sending OTP request:', { email: emailValue });

    // POST request مع Email في query string
    const response = await api.post(
      `/api/auth/otp?Email=${encodeURIComponent(emailValue)}`,
      null,
      {
        headers: {
          accept: '*/*',
        },
      }
    );

    console.log('Send OTP response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'خطأ في إرسال رمز التحقق';
    throw new Error(errorMessage);
  }
};
```

---

## 🔐 Register (Create Account) Function

```javascript
export const register = async (email, password, username, countryId, otp, imageFile = null) => {
  try {
    if (!email || !password || !username || !countryId || !otp) {
      throw new Error('جميع الحقول مطلوبة');
    }

    console.log('Registering user:', { email, username, countryId });

    // بناء query parameters
    const queryParams = new URLSearchParams({
      Email: email.trim(),
      Password: password.trim(),
      UserName: username.trim(),
      CountryId: countryId.toString(),
      otp: otp.trim(),
    });

    // بناء FormData
    const formData = new FormData();
    if (imageFile) {
      formData.append('Image', {
        uri: imageFile.uri, // React Native image picker
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'image.jpg',
      });
    } else {
      formData.append('Image', '');
    }

    const response = await api.post(
      `/api/auth/register?${queryParams.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Register response:', response.data);

    if (!response.data?.isAuthenticated || !response.data?.token) {
      throw new Error(response.data?.message || 'فشل إنشاء الحساب');
    }

    return response.data;
  } catch (error) {
    console.error('Error registering:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'حدث خطأ أثناء إنشاء الحساب';
    throw new Error(errorMessage);
  }
};
```

---

## 🔓 Login Function

```javascript
export const login = async (email, password) => {
  try {
    if (!email || !email.trim()) {
      throw new Error('يرجى إدخال البريد الإلكتروني');
    }
    if (!password || !password.trim()) {
      throw new Error('يرجى إدخال كلمة السر');
    }
    if (!isValidEmail(email.trim())) {
      throw new Error('يرجى إدخال بريد إلكتروني صحيح');
    }

    console.log('Logging in:', { email: email.trim() });

    const response = await api.post(
      '/api/auth/login',
      {
        Email: email.trim(),
        Password: password.trim(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Login response:', response.data);

    if (!response.data?.token) {
      throw new Error(
        response.data?.message || 'خطأ في تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور'
      );
    }

    return response.data;
  } catch (error) {
    console.error('Error logging in:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'خطأ في تسجيل الدخول، حاول مرة أخرى لاحقاً';
    throw new Error(errorMessage);
  }
};
```

---

## 📝 Complete Register Logic (Signup Flow)

```javascript
import { useState } from 'react';
import { Alert } from 'react-native';
import { sendOtp, register } from './authService';
import { saveToken, saveUser, saveSession } from './storage';

const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // إرسال OTP
  const handleSendOtp = async (email, username, password, countryId, imageFile) => {
    try {
      setLoading(true);

      // التحقق من البيانات
      if (!username?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم');
        return;
      }
      if (!email?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
        return;
      }
      if (!isValidEmail(email.trim())) {
        Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
        return;
      }
      if (!password?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال كلمة السر');
        return;
      }
      if (password.trim().length < 6) {
        Alert.alert('خطأ', 'كلمة السر يجب أن تكون 6 أحرف على الأقل');
        return;
      }
      if (!countryId) {
        Alert.alert('خطأ', 'يرجى اختيار الدولة');
        return;
      }

      // إرسال OTP
      await sendOtp(email.trim());

      // حفظ البيانات المؤقتة (يمكن استخدام AsyncStorage أو Context)
      const signupData = {
        email: email.trim(),
        username: username.trim(),
        password: password.trim(),
        countryId,
        imageFile,
      };
      await AsyncStorage.setItem('pendingSignupData', JSON.stringify(signupData));

      setOtpSent(true);
      setResendCooldown(60);
      Alert.alert('نجاح', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  // إعادة إرسال OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      const signupDataStr = await AsyncStorage.getItem('pendingSignupData');
      if (!signupDataStr) {
        Alert.alert('خطأ', 'لا توجد بيانات مؤقتة');
        return;
      }

      const signupData = JSON.parse(signupDataStr);
      await sendOtp(signupData.email);

      setResendCooldown(60);
      Alert.alert('نجاح', 'تم إرسال رمز التحقق مرة أخرى');

      // Start countdown timer
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('خطأ', error.message || 'خطأ في إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  // التحقق من OTP وإنشاء الحساب
  const handleVerifyOtpAndRegister = async (otp) => {
    try {
      setLoading(true);

      if (!otp || !otp.trim()) {
        Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق');
        return;
      }

      // جلب البيانات المؤقتة
      const signupDataStr = await AsyncStorage.getItem('pendingSignupData');
      if (!signupDataStr) {
        Alert.alert('خطأ', 'خطأ في البيانات المؤقتة');
        return;
      }

      const signupData = JSON.parse(signupDataStr);

      // إنشاء الحساب
      const result = await register(
        signupData.email,
        signupData.password,
        signupData.username,
        signupData.countryId,
        otp.trim(),
        signupData.imageFile
      );

      // حفظ بيانات المستخدم
      const tokenExpiration = Date.now() + 1000 * 60 * 60; // 1 hour
      await saveToken(result.token, tokenExpiration);

      const tokenPayload = decodeJwt(result.token);
      const user = {
        id: result.responseUserDTO?.id || tokenPayload?.uid || tokenPayload?.sub || Date.now(),
        name: result.username || signupData.username,
        email: result.email || signupData.email,
        role: result.responseUserDTO?.role || 'User',
      };

      await saveUser(user);
      await saveSession(result);

      // مسح البيانات المؤقتة
      await AsyncStorage.removeItem('pendingSignupData');

      Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');

      return { success: true, user, token: result.token };
    } catch (error) {
      console.error('Error verifying OTP and registering:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إنشاء الحساب');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    otpSent,
    resendCooldown,
    handleSendOtp,
    handleResendOtp,
    handleVerifyOtpAndRegister,
  };
};

export default useRegister;
```

---

## 🔑 Complete Login Logic

```javascript
import { useState } from 'react';
import { Alert } from 'react-native';
import { login } from './authService';
import { saveToken, saveUser, saveSession, saveRememberedEmail, clearAuthData } from './storage';
import { decodeJwt } from './utils';

const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);

      // التحقق من البيانات
      if (!email?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
        return { success: false };
      }
      if (!isValidEmail(email.trim())) {
        Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
        return { success: false };
      }
      if (!password?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال كلمة السر');
        return { success: false };
      }

      // تسجيل الدخول
      const data = await login(email.trim(), password.trim());

      if (!data?.token) {
        Alert.alert(
          'خطأ',
          data?.message || 'خطأ في تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور'
        );
        return { success: false };
      }

      // حفظ Token
      const tokenExpiration = Date.now() + 1000 * 60 * 60; // 1 hour
      await saveToken(data.token, tokenExpiration);

      // استخراج بيانات المستخدم
      const tokenPayload = decodeJwt(data.token);
      const responseUser = data?.responseUserDTO ?? {};

      const resolvedUserId =
        responseUser.id ||
        tokenPayload?.uid ||
        tokenPayload?.sub ||
        null;
      const resolvedUserName =
        responseUser.fullName ||
        responseUser.userName ||
        responseUser.name ||
        email.trim();
      const resolvedUserEmail = responseUser.email || email.trim();
      const resolvedRole = responseUser.role || data?.role || 'User';

      const user = {
        ...responseUser,
        id: resolvedUserId || responseUser.id || Date.now(),
        name: resolvedUserName,
        email: resolvedUserEmail,
        role: resolvedRole,
      };

      const session = {
        ...data,
        username: data?.username || resolvedUserName,
        email: data?.email || resolvedUserEmail,
        role: resolvedRole,
        responseUserDTO: responseUser,
        storedAt: new Date().toISOString(),
      };

      // حفظ بيانات المستخدم
      await saveUser(user);
      await saveSession(session);

      // حفظ Remember Me
      if (rememberMe) {
        await saveRememberedEmail(email.trim(), true);
      } else {
        await AsyncStorage.removeItem('auth-remember');
      }

      Alert.alert('نجاح', 'تم تسجيل الدخول بنجاح!');

      return {
        success: true,
        user,
        token: data.token,
        session,
      };
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('خطأ', error.message || 'خطأ في تسجيل الدخول، حاول مرة أخرى لاحقاً');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
  };
};

export default useLogin;
```

---

## 📱 Example Usage in React Native Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import useRegister from './hooks/useRegister';
import useLogin from './hooks/useLogin';
import { getRememberedEmail } from './storage';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [countryId, setCountryId] = useState('');
  const [otp, setOtp] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const { loading: registerLoading, otpSent, resendCooldown, handleSendOtp, handleResendOtp, handleVerifyOtpAndRegister } = useRegister();
  const { loading: loginLoading, handleLogin } = useLogin();

  useEffect(() => {
    // جلب البريد المحفوظ
    getRememberedEmail().then((data) => {
      if (data?.email) {
        setEmail(data.email);
        setRememberMe(true);
      }
    });
  }, []);

  const onLogin = async () => {
    const result = await handleLogin(email, password, rememberMe);
    if (result.success) {
      // Navigate to home
      navigation.navigate('Home');
    }
  };

  const onRegister = async () => {
    if (!otpSent) {
      // إرسال OTP
      await handleSendOtp(email, username, password, countryId, null);
    } else {
      // التحقق من OTP وإنشاء الحساب
      const result = await handleVerifyOtpAndRegister(otp);
      if (result.success) {
        // Navigate to login or home
        setIsLogin(true);
        setOtpSent(false);
      }
    }
  };

  return (
    <View>
      {isLogin ? (
        // Login Form
        <View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="البريد الإلكتروني"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="كلمة السر"
            secureTextEntry
          />
          <Button title="تسجيل الدخول" onPress={onLogin} disabled={loginLoading} />
        </View>
      ) : (
        // Register Form
        <View>
          {!otpSent ? (
            <>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="اسم المستخدم"
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="البريد الإلكتروني"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="كلمة السر"
                secureTextEntry
              />
              <Button title="إنشاء حساب" onPress={onRegister} disabled={registerLoading} />
            </>
          ) : (
            <>
              <Text>تم إرسال رمز التحقق إلى {email}</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="رمز التحقق (OTP)"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button title="تحقق وإنشاء الحساب" onPress={onRegister} disabled={registerLoading} />
              <Button
                title={resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown}` : 'إعادة إرسال OTP'}
                onPress={handleResendOtp}
                disabled={resendCooldown > 0 || registerLoading}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default AuthScreen;
```

---

## 🌍 Get Countries Function

```javascript
export const getCountries = async () => {
  try {
    const response = await api.get('/Country/GetAllCountries');
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      // تحويل البيانات إلى الصيغة المطلوبة
      return response.data.map((country) => ({
        id: country.id,
        name: country.nameCountry, // API يرجع nameCountry
      }));
    }
    
    // قائمة افتراضية في حالة فشل الطلب
    return [
      { id: 1, name: "الأردن" },
      { id: 2, name: "فلسطين" },
      { id: 3, name: "السعودية" },
      { id: 4, name: "الإمارات" },
      { id: 5, name: "مصر" },
    ];
  } catch (error) {
    console.error('Error fetching countries:', error);
    // إرجاع القائمة الافتراضية في حالة الخطأ
    return [
      { id: 1, name: "الأردن" },
      { id: 2, name: "فلسطين" },
      { id: 3, name: "السعودية" },
      { id: 4, name: "الإمارات" },
      { id: 5, name: "مصر" },
    ];
  }
};
```

## 📱 Usage in Component (React Native)

```javascript
import { useState, useEffect } from 'react';
import { View, Text, Picker } from 'react-native';
import { getCountries } from './authService';

const RegisterScreen = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const data = await getCountries();
        setCountries(data);
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  return (
    <View>
      {loadingCountries ? (
        <Text>جارٍ تحميل الدول...</Text>
      ) : (
        <Picker
          selectedValue={selectedCountryId}
          onValueChange={(itemValue) => setSelectedCountryId(itemValue)}
        >
          <Picker.Item label="اختر الدولة" value="" />
          {countries.map((country) => (
            <Picker.Item
              key={country.id}
              label={country.name}
              value={country.id.toString()}
            />
          ))}
        </Picker>
      )}
    </View>
  );
};
```

## 🔄 API Endpoints Summary

### 1. Send OTP (للتسجيل)
```
POST /api/auth/otp?Email=user@example.com
Headers: { accept: "*/*" }
Body: (empty)
Response: "The Otp Has Sent" (200)
```

### 2. Register (إنشاء الحساب)
```
POST /api/auth/register?Email=...&Password=...&UserName=...&CountryId=...&otp=...
Headers: { Content-Type: multipart/form-data }
Body: FormData { Image: file or "" }
Response: {
  isAuthenticated: true,
  token: "eyJ...",
  email: "...",
  username: "...",
  expires: "...",
  ...
}
```

### 3. Login (تسجيل الدخول)
```
POST /api/auth/login
Headers: { Content-Type: application/json }
Body: { Email: "...", Password: "..." }
Response: {
  token: "eyJ...",
  responseUserDTO: { ... },
  ...
}
```

### 4. Get Countries (جلب الدول/المدن)
```
GET /Country/GetAllCountries
Headers: (none required)
Response: [
  {
    id: 1,
    nameCountry: "الأردن",
    // ... other fields
  },
  {
    id: 2,
    nameCountry: "فلسطين",
    // ... other fields
  },
  ...
]
```

---

## ✅ Checklist للتطبيق

- [ ] تثبيت axios و @react-native-async-storage/async-storage
- [ ] إنشاء ملفات: api.js, storage.js, authService.js, hooks/useLogin.js, hooks/useRegister.js
- [ ] إضافة AsyncStorage permissions في AndroidManifest.xml (إذا لزم)
- [ ] اختبار Send OTP
- [ ] اختبار Register
- [ ] اختبار Login
- [ ] اختبار Remember Me
- [ ] اختبار Logout (clearAuthData)

---

## 📚 ملاحظات مهمة

1. **Image Upload في React Native**: استخدم `react-native-image-picker` أو `expo-image-picker`
2. **Navigation**: استخدم `@react-navigation/native` للتنقل بين الشاشات
3. **Error Handling**: استخدم `Alert` من `react-native` أو `react-native-paper` للرسائل
4. **Loading States**: استخدم `ActivityIndicator` من `react-native`
5. **Form Validation**: أضف validation قبل الإرسال

