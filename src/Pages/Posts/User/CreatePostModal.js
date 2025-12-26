import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../../store/authSlice";
import { uploadUserImage } from "../../../Service/userService";
import { getAllTags } from "../../../Service/TagServices";
import { createPost, updatePost } from "../../../Service/postService";
import api from "../../../Service/api";

const CreatePostModal = ({ isOpen, onClose, onPostCreated, initialFiles = null, editPostData = null }) => {
  const session = useSelector(selectAuthSession);
  const user = session?.responseUserDTO;
  const userId = user?.id || Number(localStorage.getItem("idUser"));

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState([]); // Array of File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Array of preview URLs
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Tags states
  const [availableTags, setAvailableTags] = useState([]); // جميع الوسوم المتاحة من API
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]); // مصفوفة من IDs للوسوم المختارة: [1, 2, 3]
  const [selectedTagToAdd, setSelectedTagToAdd] = useState(""); // ID الوسم المختار من القائمة المنسدلة
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const tagsDropdownRef = useRef(null);

  // Handle initial files and edit post data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editPostData) {
        // وضع التعديل: تحميل بيانات البوست
        setTitle(editPostData.title || "");
        setContent(editPostData.content || "");
        setSelectedTags(editPostData.tags || []);
        
        // تحميل الصور الموجودة
        if (editPostData.images && editPostData.images.length > 0) {
          setImagePreviews(editPostData.images);
          setSelectedImages([]); // لا توجد ملفات جديدة بعد
        } else {
          setImagePreviews([]);
          setSelectedImages([]);
        }
      } else if (initialFiles && initialFiles.length > 0) {
        // وضع الإنشاء: ملفات جديدة
        setImagePreviews(prev => {
          prev.forEach(url => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          });
          return [];
        });
        const newPreviews = initialFiles.map(file => URL.createObjectURL(file));
        setSelectedImages(initialFiles);
        setImagePreviews(newPreviews);
      } else {
        // Reset when modal opens without initial files or edit data
        setImagePreviews(prev => {
          prev.forEach(url => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          });
          return [];
        });
        setSelectedImages([]);
        setTitle("");
        setContent("");
        setSelectedTags([]);
      }
    }
  }, [isOpen, initialFiles, editPostData]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // جلب الوسوم عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      const loadTags = async () => {
        setTagsLoading(true);
        setTagsError(null);
        try {
          const data = await getAllTags();
          setAvailableTags(data);
        } catch (err) {
          console.error("Failed to load tags:", err);
          setTagsError("فشل جلب الوسوم");
          setAvailableTags([]);
        } finally {
          setTagsLoading(false);
        }
      };
      loadTags();
    } else {
      // Reset tags when modal closes
      setSelectedTags([]);
      setSelectedTagToAdd("");
      setShowTagsDropdown(false);
    }
  }, [isOpen]);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setShowTagsDropdown(false);
      }
    };

    if (showTagsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagsDropdown]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    // في وضع التعديل، الصور قد تكون URLs موجودة أو ملفات جديدة
    if (editPostData && index < imagePreviews.length) {
      // حذف من imagePreviews (الصور الموجودة)
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // حذف من selectedImages (الملفات الجديدة)
      const fileIndex = editPostData ? index - (editPostData.images?.length || 0) : index;
      if (fileIndex >= 0) {
        setSelectedImages(prev => prev.filter((_, i) => i !== fileIndex));
        setImagePreviews(prev => {
          const url = prev[index];
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
          return prev.filter((_, i) => i !== index);
        });
      } else {
        // حذف صورة موجودة في وضع التعديل
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
      }
    }
  };

  // إضافة وسم إلى القائمة المختارة
  const handleAddSelectedTag = () => {
    if (!selectedTagToAdd) return;
    const idNum = Number(selectedTagToAdd);
    if (Number.isNaN(idNum)) return;
    if (selectedTags.includes(idNum)) {
      alert("تم إضافة الوسم من قبل.");
      return;
    }
    setSelectedTags((prev) => [...prev, idNum]);
    setSelectedTagToAdd("");
    setShowTagsDropdown(false);
  };

  // حذف وسم من القائمة المختارة
  const handleRemoveSelectedTag = (id) => {
    setSelectedTags((prev) => prev.filter((tagId) => tagId !== id));
  };

  const handleSubmit = async () => {
    const hasContent = content.trim();
    const hasNewImages = selectedImages.length > 0;
    const hasExistingImages = editPostData?.images?.length > 0;
    
    if (!hasContent && !hasNewImages && !hasExistingImages) {
      alert("يرجى إدخال محتوى أو إضافة صورة");
      return;
    }

    if (!userId) {
      alert("الرجاء تسجيل الدخول");
      return;
    }

    setUploading(true);

    try {
      // جمع الصور الموجودة من editPostData
      const uploadedImageUrls = [];
      if (editPostData?.images && editPostData.images.length > 0) {
        uploadedImageUrls.push(...editPostData.images);
      }
      
      // رفع الصور الجديدة فقط
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        try {
          console.log(`📤 Uploading image ${i + 1}/${selectedImages.length}:`, image.name);
          const url = await uploadUserImage(image);
          console.log(`✅ Image ${i + 1} uploaded successfully:`, url);
          if (url && url !== "") {
            uploadedImageUrls.push(url);
          } else {
            throw new Error("لم يتم الحصول على رابط الصورة من السيرفر");
          }
        } catch (err) {
          console.error(`❌ Failed to upload image ${i + 1}:`, err);
          const errorMsg = err?.message || "فشل رفع إحدى الصور";
          alert(`فشل رفع الصورة "${image.name}": ${errorMsg}`);
          setUploading(false);
          return;
        }
      }
      
      console.log("✅ All images:", uploadedImageUrls);

      if (editPostData) {
        // وضع التعديل: استخدام updatePost
        // معالجة الفيديوهات (إزالة id إذا كان موجوداً)
        const processedVideos = (editPostData.videos || []).map((v) => ({
          title: v.title || "",
          description: v.description || "",
          url: v.url || "",
          thumbnailUrl: v.thumbnailUrl || "",
        })).filter((v) => v.url);
        
        const updateData = {
          title: title.trim() || content.substring(0, 100) || editPostData.title || "منشور جديد",
          content: content || "",
          userId: Number(userId), // إضافة userId كما هو مطلوب
          images: uploadedImageUrls,
          videos: processedVideos,
          tags: selectedTags
        };

        console.log("📤 Updating post with data:", updateData);
        const res = await updatePost(editPostData.id, updateData);
        console.log("✅ Post updated successfully:", res);
        
        alert("تم تحديث المنشور بنجاح!");
      } else {
        // وضع الإنشاء: استخدام createPost
        const postData = {
          title: title.trim() || content.substring(0, 100) || "منشور جديد",
          content: content || "",
          userId: Number(userId),
          images: uploadedImageUrls,
          videos: [],
          tags: selectedTags
        };

        console.log("📤 Creating post with data:", postData);
        const res = await createPost(postData);
        console.log("✅ Post created successfully:", res);
        
        alert("تم نشر المنشور بنجاح!");
      }
      
      // Clean up preview URLs
      setImagePreviews(prev => {
        prev.forEach(url => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
        return [];
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setSelectedImages([]);
      setSelectedTags([]);
      setSelectedTagToAdd("");
      
      onClose();
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      console.error("Failed to save post:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "حدث خطأ أثناء حفظ المنشور";
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] min-h-[600px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{editPostData ? "تعديل المنشور" : "إنشاء منشور"}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {user?.imageURL ? (
              <img src={user.imageURL} alt={user.userName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-700 font-semibold text-sm">{getInitials(user?.userName)}</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user?.userName || "مستخدم"}</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="العنوان (اختياري)"
              className="w-full border-b-2 border-gray-200 outline-none pb-2 text-xl font-semibold placeholder-gray-400 focus:border-blue-500 transition"
              dir="rtl"
            />
          </div>

          {/* Text Input */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${user?.userName || "مستخدم"}, ما الذي يدور في ذهنك؟`}
              className="w-full border-none outline-none resize-none text-lg min-h-[180px] placeholder-gray-400"
              dir="rtl"
            />
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-4 space-y-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full max-h-96 object-contain bg-gray-100"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 left-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">الوسوم المختارة:</div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tagId) => {
                  const tag = availableTags.find((t) => t.id === tagId);
                  return (
                    <div
                      key={tagId}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <span className="text-sm font-semibold">
                        #{tag ? (tag.tagName ?? tag.name) : tagId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedTag(tagId)}
                        className="text-xs w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-all duration-200 font-bold"
                        title="إزالة الوسم"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add to Post Section */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">إضافة إلى المنشور</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white transition-all duration-200 text-gray-700 border border-gray-200 bg-white shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">صور/فيديو</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Tags Button */}
            <div className="relative" ref={tagsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 border shadow-sm ${
                  showTagsDropdown 
                    ? "bg-blue-50 text-blue-700 border-blue-300 shadow-md" 
                    : "hover:bg-white text-gray-700 border-gray-200 bg-white hover:shadow-md"
                }`}
              >
                <svg className={`w-5 h-5 ${showTagsDropdown ? "text-blue-600" : "text-blue-500"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">الوسوم</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showTagsDropdown ? "rotate-180" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Tags Dropdown */}
              {showTagsDropdown && (
                <div className="absolute bottom-full right-0 mb-2 w-[420px] bg-white border-2 border-gray-200 rounded-2xl shadow-2xl p-5 z-50" dir="rtl" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-800 mb-3">اختر وسمًا لإضافته</label>
                    <div className="flex gap-3">
                      <select
                        value={selectedTagToAdd}
                        onChange={(e) => setSelectedTagToAdd(e.target.value)}
                        className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                        disabled={tagsLoading}
                      >
                        <option value="">اختر وسمًا...</option>
                        {availableTags
                          .filter(tag => !selectedTags.includes(tag.id))
                          .map((tag) => (
                            <option key={tag.id} value={tag.id}>
                              #{tag.tagName ?? tag.name ?? tag.id}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSelectedTag}
                        disabled={!selectedTagToAdd || tagsLoading}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none min-w-[80px]"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                  
                  {tagsLoading && (
                    <div className="text-sm text-gray-600 text-center py-4 flex items-center justify-center gap-3 bg-gray-50 rounded-xl">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">جاري تحميل الوسوم...</span>
                    </div>
                  )}
                  {tagsError && (
                    <div className="text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-center font-medium">
                      {tagsError}
                    </div>
                  )}
                  {!tagsLoading && !tagsError && availableTags.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl font-medium">
                      لا توجد وسوم متاحة
                    </div>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <div className="text-sm text-gray-700 mb-3 font-bold">الوسوم المضافة ({selectedTags.length}):</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tagId) => {
                          const tag = availableTags.find((t) => t.id === tagId);
                          return (
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200 shadow-sm"
                            >
                              #{tag ? (tag.tagName ?? tag.name) : tagId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Button */}
        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && selectedImages.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {uploading ? (editPostData ? "جاري التحديث..." : "جاري النشر...") : (editPostData ? "تحديث" : "نشر")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;

