import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../store/authSlice";
import api from "../../Service/api";
import { getAllTags } from "../../Service/TagServices";
import { uploadUserImage } from "../../Service/userService";
import { addProblemRequest } from "../../Service/problemRequestService";
import Swal from "sweetalert2";
import "./addProblemRequest.css";

// Ensure boxicons is loaded
const ensureBoxicons = () => {
  if (typeof document === "undefined") return;
  const BOXICON_LINK_ID = "add-problem-request-boxicons-link";
  if (!document.getElementById(BOXICON_LINK_ID)) {
    const link = document.createElement("link");
    link.id = BOXICON_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
    link.crossOrigin = "anonymous";
    link.onerror = () => {
      console.warn("Failed to load Boxicons from CDN, using fallback");
    };
    document.head.appendChild(link);
  }
};

const AddProblemProposal = () => {
  const navigate = useNavigate();
  const session = useSelector(selectAuthSession);
  const currentUserId = session?.responseUserDTO?.id || localStorage.getItem("idUser");

  const [title, setTitle] = useState("");
  const [descriptionProblem, setDescriptionProblem] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [descriptionOutput, setDescriptionOutput] = useState("");
  const [authorNotes, setAuthorNotes] = useState("");
  const [difficulty, setDifficulty] = useState("سهل");
  const [memory, setMemory] = useState(128);
  const [time, setTime] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "", isSample: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    ensureBoxicons();
  }, []);

  // جلب الوسوم المتاحة
  useEffect(() => {
    const loadTags = async () => {
      try {
        setTagsLoading(true);
        const tags = await getAllTags();
        setAvailableTags(tags || []);
      } catch (error) {
        console.error("Error loading tags:", error);
        setAvailableTags([]);
        Swal.fire("خطأ", "حدث خطأ أثناء تحميل التاقات.", "error");
      } finally {
        setTagsLoading(false);
      }
    };
    loadTags();
  }, []);

  // معالجة اختيار الوسوم
  const handleTagChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions).map((option) =>
      Number(option.value)
    );
    setSelectedTagIds(selectedIds);
  };

  // رفع صورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // إضافة test case جديدة
  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "", isSample: false }]);
  };

  // حذف test case
  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      const newCases = [...testCases];
      newCases.splice(index, 1);
      setTestCases(newCases);
    } else {
      Swal.fire("تنبيه", "يجب أن يكون هناك Test Case واحد على الأقل.", "warning");
    }
  };

  // تحديث test case
  const updateTestCase = (index, field, value) => {
    const newCases = [...testCases];
    newCases[index][field] = value;
    setTestCases(newCases);
  };

  // التحقق من البيانات قبل الإرسال
  const validateForm = () => {
    if (!title || !descriptionProblem || !descriptionInput || !descriptionOutput) {
      Swal.fire("تنبيه", "الرجاء تعبئة كل الحقول الأساسية.", "warning");
      return false;
    }
    if (selectedTagIds.length === 0) {
      Swal.fire("تنبيه", "يجب اختيار Tag واحد على الأقل.", "warning");
      return false;
    }
    for (let tc of testCases) {
      if (!tc.input || !tc.expectedOutput) {
        Swal.fire("تنبيه", "يجب تعبئة كل Test Case بشكل كامل.", "warning");
        return false;
      }
    }
    return true;
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setTitle("");
    setDescriptionProblem("");
    setDescriptionInput("");
    setDescriptionOutput("");
    setAuthorNotes("");
    setDifficulty("سهل");
    setMemory(128);
    setTime(1);
    setSelectedTagIds([]);
    setTestCases([{ input: "", expectedOutput: "", isSample: true }]);
    setImageFile(null);
    setImagePreview(null);
  };

  // إرسال البيانات
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUserId) {
      Swal.fire("خطأ", "يجب تسجيل الدخول أولاً.", "error");
      return;
    }

    setLoading(true);
    try {
      // رفع الصورة أولاً إن وجدت
      let uploadedUrl = "";
      if (imageFile) {
        try {
          uploadedUrl = await uploadUserImage(imageFile, "");
        } catch (error) {
          console.error("Error uploading image:", error);
          // يمكن المتابعة بدون صورة إذا فشل الرفع
          uploadedUrl = "";
        }
      }

      // بناء payload حسب Swagger API
      const payload = {
        title: title.trim(),
        descriptionProblem: descriptionProblem.trim(),
        imageUrl: uploadedUrl || "",
        descriptionInput: descriptionInput.trim(),
        descriptionOutput: descriptionOutput.trim(),
        authorNotes: authorNotes.trim() || "",
        difficulty: difficulty,
        memory: Number(memory),
        time: Number(time),
        status: 1, // 1 = قيد المراجعة
        createdAt: new Date().toISOString(),
        userId: Number(currentUserId),
        requestTestCases: testCases.map((tc) => ({
          problemId: 0, // 0 للاقتراحات الجديدة
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isSample: tc.isSample,
        })),
        requestproblemTags: selectedTagIds, // array of numbers (IDs)
      };

      // إرسال الطلب
      console.log("📤 Sending payload:", payload);
      console.log("📤 Endpoint: /api/problem-requests");
      const response = await addProblemRequest(payload);
      console.log("✅ Response:", response);

      // عرض رسالة النجاح
      Swal.fire({
        icon: "success",
        title: "تم الإرسال بنجاح!",
        text: "تم إرسال اقتراح المشكلة بنجاح 🎉",
        confirmButtonColor: "#007C89",
      }).then(() => {
        // إعادة تعيين الحقول
        resetForm();
        navigate("/dashboard?tab=influencer");
      });
    } catch (error) {
      console.error("❌ Error submitting problem request:", error);
      console.error("❌ Error details:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        headers: error?.config?.headers,
      });
      
      let errorMessage = "حدث خطأ أثناء إرسال الاقتراح. الرجاء المحاولة مرة أخرى.";
      
      if (error?.response?.status === 405) {
        errorMessage = "خطأ 405: الطريقة غير مسموحة. يرجى التحقق من الـ endpoint.";
      } else if (error?.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          errorMessage = errors.join(", ");
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: errorMessage,
        confirmButtonColor: "#007C89",
        footer: error?.response?.status ? `رمز الخطأ: ${error.response.status}` : "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-problem-request-page" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="add-problem-request-header">
        <button
          onClick={() => navigate(-1)}
          className="add-problem-request-back-btn"
          aria-label="العودة"
        >
          <i className="bx bx-arrow-back back-icon"></i>
        </button>
        <div className="add-problem-request-header-content">
          <h1 className="add-problem-request-title-header">إضافة اقتراح مشكلة</h1>
        </div>
      </div>

      <div className="add-problem-request-main">
        <div className="add-problem-request-container">

        <form className="add-problem-request-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* العنوان */}
          <div className="form-group">
            <label className="form-label">
              العنوان <span className="required-star">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان المشكلة"
              required
            />
          </div>

          {/* وصف المشكلة */}
          <div className="form-group">
            <label className="form-label">
              وصف المشكلة <span className="required-star">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows="6"
              value={descriptionProblem}
              onChange={(e) => setDescriptionProblem(e.target.value)}
              placeholder="اكتب وصفاً واضحاً للمشكلة..."
              required
            />
          </div>

          {/* وصف المدخلات والمخرجات */}
          <div className="form-row">
            <div className="form-group form-group-half">
              <label className="form-label">
                وصف المخرجات <span className="required-star">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows="5"
                value={descriptionOutput}
                onChange={(e) => setDescriptionOutput(e.target.value)}
                placeholder="وصف المخرجات المتوقعة..."
                required
              />
            </div>
            <div className="form-group form-group-half">
              <label className="form-label">
                وصف المدخلات <span className="required-star">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows="5"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="وصف المدخلات المطلوبة..."
                required
              />
            </div>
          </div>

          {/* ملاحظات المؤلف */}
          <div className="form-group">
            <label className="form-label">ملاحظات المؤلف</label>
            <textarea
              className="form-textarea"
              rows="4"
              value={authorNotes}
              onChange={(e) => setAuthorNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية (اختياري)..."
            />
          </div>

          {/* Constraints */}
          <div className="form-row">
            <div className="form-group form-group-third">
              <label className="form-label">Time (s) <span className="required-star">*</span></label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group form-group-third">
              <label className="form-label">Memory (MB) <span className="required-star">*</span></label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={memory}
                onChange={(e) => setMemory(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group form-group-third">
              <label className="form-label">الصعوبة <span className="required-star">*</span></label>
              <select
                className="form-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
              >
                <option value="سهل">سهل</option>
                <option value="متوسط">متوسط</option>
                <option value="صعب">صعب</option>
              </select>
            </div>
          </div>

          {/* صورة المشكلة */}
          <div className="form-group">
            <label className="form-label">صورة المشكلة</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="file-input-label">
                <svg className="file-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{imageFile ? imageFile.name : "اختر صورة"}</span>
              </label>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">
              Tags <span className="required-star">*</span>
            </label>
            <select
              multiple
              className="form-tags-select"
              value={selectedTagIds.map(String)}
              onChange={handleTagChange}
              disabled={tagsLoading}
              size={5}
            >
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.tagName || tag.name || `#${tag.id}`}
                </option>
              ))}
            </select>
            <p className="form-hint">
              اضغط Ctrl (أو Cmd على Mac) لاختيار أكثر من وسم
            </p>
            {selectedTagIds.length > 0 && (
              <div className="selected-tags">
                {selectedTagIds.map((tagId) => {
                  const tag = availableTags.find((t) => t.id === tagId);
                  return (
                    <span key={tagId} className="selected-tag">
                      {tag ? tag.tagName || tag.name : `#${tagId}`}
                      <button
                        type="button"
                        className="remove-tag-btn"
                        onClick={() => setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test Cases */}
          <div className="form-group test-cases-section">
            <h2 className="section-title">
              Test Cases <span className="required-star">*</span>
            </h2>
            {testCases.map((tc, index) => (
              <div key={index} className="test-case-card">
                <div className="test-case-header">
                  <h3 className="test-case-number">Test Case #{index + 1}</h3>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      className="delete-test-case-btn"
                      onClick={() => removeTestCase(index)}
                    >
                      حذف
                    </button>
                  )}
                </div>
                <div className="test-case-row">
                  <div className="test-case-group">
                    <label className="test-case-label">Input <span className="required-star">*</span></label>
                    <textarea
                      className="test-case-textarea"
                      rows="4"
                      value={tc.input}
                      onChange={(e) => updateTestCase(index, "input", e.target.value)}
                      placeholder="أدخل المدخلات..."
                      required
                    />
                  </div>
                  <div className="test-case-group">
                    <label className="test-case-label">Expected Output <span className="required-star">*</span></label>
                    <textarea
                      className="test-case-textarea"
                      rows="4"
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                      placeholder="أدخل المخرجات المتوقعة..."
                      required
                    />
                  </div>
                </div>
                <div className="test-case-actions">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={tc.isSample}
                      onChange={(e) => updateTestCase(index, "isSample", e.target.checked)}
                    />
                    <span>Sample Test Case</span>
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="add-test-case-btn"
              onClick={addTestCase}
            >
              <svg className="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة Test Case
            </button>
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="submit-spinner"></div>
                جاري الإرسال...
              </>
            ) : (
              <>
                <svg className="submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                إرسال الاقتراح
              </>
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddProblemProposal;