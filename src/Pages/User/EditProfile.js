import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAuthSession, selectAuthToken, setCredentials } from "../../store/authSlice";
import { getAllCountries } from "../../Service/CountryService";
import { getAllUniversities } from "../../Service/UniversityService";
import { updateUser, uploadUserImage } from "../../Service/userService";
import "./editProfile.css";

const EditProfile = ({ onClose }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectAuthSession);
  const token = useSelector(selectAuthToken);
  const profile = session?.responseUserDTO;

  const [formData, setFormData] = useState({
    id: profile?.id || 0,
    email: profile?.email || "",
    userName: profile?.userName || "",
    imageURL: profile?.imageUrl || "",
    countryId: profile?.country?.id || 0,
    universityId: profile?.universityId || 0,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(profile?.imageUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    if (profile) {
      setFormData({
        id: profile.id || 0,
        email: profile.email || "",
        userName: profile.userName || "",
        imageURL: profile.imageUrl || "",
        countryId: profile.country?.id || 0,
        universityId: profile.universityId || 0,
        image: null,
      });
      setImagePreview(profile.imageUrl || "");
    }
  }, [profile]);

  // Fetch countries and universities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesData, universitiesData] = await Promise.all([
          getAllCountries(),
          getAllUniversities(),
        ]);
        setCountries(countriesData);
        setUniversities(universitiesData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUniversityChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      universityId: value === "" ? 0 : parseInt(value),
    }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validation
      if (!formData.userName || !formData.email || !formData.countryId) {
        setError("الرجاء تعبئة جميع الحقول المطلوبة");
        setLoading(false);
        return;
      }

      // Upload new image if exists
      let imageURL = formData.imageURL;
      if (formData.image) {
        console.log("Uploading new image...");
        imageURL = await uploadUserImage(formData.image, formData.imageURL);
        console.log("Image uploaded:", imageURL);
      }

      // Prepare payload
      const payload = {
        id: formData.id,
        email: formData.email,
        userName: formData.userName,
        imageURL: imageURL || "",
        countryId: parseInt(formData.countryId) || 0,
        universityId: formData.universityId || 0,
      };

      console.log("Updating user with payload:", payload);

      // Update user via service
      await updateUser(payload);

      console.log("User updated successfully");

      // Update Redux state with new data
      const updatedSession = {
        ...session,
        responseUserDTO: {
          ...profile,
          email: payload.email,
          userName: payload.userName,
          imageUrl: imageURL,
          country: {
            ...profile.country,
            id: payload.countryId,
          },
          universityId: payload.universityId,
        },
      };
      
      dispatch(setCredentials({ session: updatedSession }));
      
      // Update localStorage
      localStorage.setItem("auth-session", JSON.stringify(updatedSession));
      
      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "حدث خطأ أثناء تحديث البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile" onClick={handleBackdropClick}>
      <div className="edit-profile__container">
        <div className="edit-profile__header">
          <h2 className="edit-profile__title">تعديل الملف الشخصي</h2>
          {onClose && (
            <button 
              type="button" 
              className="edit-profile__close"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <i className="bx bx-x"></i>
            </button>
          )}
        </div>

        <form className="edit-profile__form" onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="edit-profile__image-section">
            <div className="edit-profile__avatar-wrapper">
              <img 
                src={imagePreview || "/default-avatar.png"} 
                alt="صورة الملف الشخصي" 
                className="edit-profile__avatar"
              />
              <label className="edit-profile__avatar-overlay">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="edit-profile__file-input"
                />
                <i className="bx bx-camera"></i>
                <span>اختر صورة جديدة</span>
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="edit-profile__fields">
            <div className="edit-profile__field">
              <label className="edit-profile__label">
                اسم المستخدم
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                className="edit-profile__input"
                required
              />
            </div>

            <div className="edit-profile__field">
              <label className="edit-profile__label">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="edit-profile__input"
                required
              />
            </div>

            <div className="edit-profile__field">
              <label className="edit-profile__label">
                الدولة
              </label>
              <select
                name="countryId"
                value={formData.countryId}
                onChange={handleInputChange}
                className="edit-profile__select"
              >
                <option value="">اختر الدولة</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.nameCountry}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-profile__field">
              <label className="edit-profile__label">
                الجامعة
              </label>
              <select
                name="universityId"
                value={formData.universityId}
                onChange={handleUniversityChange}
                className="edit-profile__select"
              >
                <option value="">اختر الجامعة</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="edit-profile__message edit-profile__message--error">
              <i className="bx bx-error-circle"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="edit-profile__message edit-profile__message--success">
              <i className="bx bx-check-circle"></i>
              تم تحديث الملف الشخصي بنجاح!
            </div>
          )}

          {/* Actions */}
          <div className="edit-profile__actions">
            {onClose && (
              <button
                type="button"
                className="edit-profile__button edit-profile__button--secondary"
                onClick={onClose}
                disabled={loading}
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              className="edit-profile__button edit-profile__button--primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="edit-profile__spinner"></span>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <i className="bx bx-save"></i>
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

