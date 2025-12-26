import { Card, Box, Typography, CardMedia } from "@mui/material";
import { useState, useEffect } from "react";
import { getAllEvents, getEventById } from "../../Service/eventService";
import { CardSkeleton, PageSkeleton } from "../../Components/SkeletonLoading";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getAllEvents();
        setEvents(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // إخفاء الهيدر عند فتح الـ modal
  useEffect(() => {
    if (selectedEvent) {
      // إضافة class على body لإخفاء الهيدر
      document.body.classList.add('event-modal-open');
      // منع scroll للـ body
      document.body.style.overflow = 'hidden';
    } else {
      // إزالة class عند إغلاق الـ modal
      document.body.classList.remove('event-modal-open');
      document.body.style.overflow = '';
    }

    // تنظيف عند unmount
    return () => {
      document.body.classList.remove('event-modal-open');
      document.body.style.overflow = '';
    };
  }, [selectedEvent]);

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const d = new Date(dateString);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "تاريخ غير صحيح";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const d = new Date(dateString);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch (error) {
      return "تاريخ غير صحيح";
    }
  };

  const handleEventClick = async (eventId) => {
    setSelectedEvent(eventId);
    setEventLoading(true);
    setEventError(null);
    try {
      const event = await getEventById(eventId);
      setEventDetails(event);
    } catch (err) {
      console.error("Error fetching event details:", err);
      setEventError(err.message || "حدث خطأ في جلب تفاصيل الحدث");
    } finally {
      setEventLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setEventDetails(null);
    setEventError(null);
  };

  const handleRegisterClick = () => {
    if (eventDetails?.linkRegistration) {
      window.open(eventDetails.linkRegistration, '_blank');
    }
  };

  if (loading) {
    return (
      <Card sx={{ 
        p: 3, 
        borderRadius: 4, 
        direction: "rtl",
        bgcolor: "transparent",
        boxShadow: "none",
        minHeight: 400,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <CardSkeleton count={6} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ 
        p: 3, 
        borderRadius: 4, 
        direction: "rtl",
        bgcolor: "transparent",
        boxShadow: "none"
      }}>
        <Typography color="error" sx={{ textAlign: "center" }}>
          حدث خطأ في جلب الأحداث
        </Typography>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card sx={{ 
        p: 3, 
        borderRadius: 4, 
        direction: "rtl",
        bgcolor: "transparent",
        boxShadow: "none"
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "right" }}>
          الأحداث
        </Typography>
        <Typography sx={{ textAlign: "center", color: "#999" }}>
          لا توجد أحداث متاحة
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      p: 3, 
      borderRadius: 4, 
      direction: "rtl",
      bgcolor: "transparent",
      boxShadow: "none",
      width: "100%",
      maxWidth: "100%"
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "right" }}>
        الأحداث
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {events.map((event) => (
          <Box
            key={event.id}
            onClick={() => handleEventClick(event.id)}
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              direction: "rtl",
              cursor: "pointer",
              p: 1.5,
              borderRadius: 2,
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
                transform: "translateX(-4px)"
              }
            }}
          >
            {/* الصورة */}
            <CardMedia
              component="img"
              image={event.imageURL || "https://via.placeholder.com/80"}
              alt={event.title}
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                objectFit: "cover",
                flexShrink: 0
              }}
            />

            {/* المعلومات */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  mb: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {event.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  fontSize: "0.875rem"
                }}
              >
                {formatDate(event.createdAt)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            p: 2
          }}
          onClick={handleCloseModal}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            sx={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              direction: "rtl",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            {eventLoading ? (
              <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                <PageSkeleton />
              </Box>
            ) : eventError ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="error" sx={{ mb: 2 }}>
                  {eventError}
                </Typography>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  إغلاق
                </button>
              </Box>
            ) : eventDetails ? (
              <>
                {/* Close Button */}
                <Box sx={{ position: "relative" }}>
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 transition"
                    aria-label="إغلاق"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Event Image */}
                  <CardMedia
                    component="img"
                    image={eventDetails.imageURL || "https://via.placeholder.com/600x300"}
                    alt={eventDetails.title}
                    sx={{
                      width: "100%",
                      height: 300,
                      objectFit: "cover"
                    }}
                  />
                </Box>

                {/* Event Content */}
                <Box sx={{ p: 3 }}>
                  {/* Title */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      textAlign: "right",
                      color: "#111827"
                    }}
                  >
                    {eventDetails.title}
                  </Typography>

                  {/* Description */}
                  {eventDetails.description && (
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        textAlign: "right",
                        color: "#4b5563",
                        lineHeight: 1.7
                      }}
                    >
                      {eventDetails.description}
                    </Typography>
                  )}

                  {/* Event Details Grid */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                    {/* Date */}
                    {eventDetails.createdAt && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <Typography sx={{ color: "#6b7280", fontSize: "0.95rem" }}>
                          {formatDateTime(eventDetails.createdAt)}
                        </Typography>
                      </Box>
                    )}

                    {/* Location */}
                    {eventDetails.location && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <Typography sx={{ color: "#6b7280", fontSize: "0.95rem" }}>
                          {eventDetails.location}
                        </Typography>
                      </Box>
                    )}

                    {/* Keywords */}
                    {eventDetails.keyWord && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, direction: "rtl" }}>
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <Box sx={{ flex: 1, textAlign: "right" }}>
                          <Typography sx={{ color: "#6b7280", fontSize: "0.95rem", mb: 0.5, textAlign: "right" }}>
                            الكلمات المفتاحية:
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                            {eventDetails.keyWord.split(',').map((keyword, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  bgcolor: "#e0e7ff",
                                  borderRadius: 1,
                                  fontSize: "0.85rem",
                                  color: "#4338ca"
                                }}
                              >
                                {keyword.trim()}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Stats */}
                    <Box sx={{ display: "flex", gap: 3, pt: 1 }}>
                      {eventDetails.views !== undefined && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <Typography sx={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                            {eventDetails.views} مشاهدة
                          </Typography>
                        </Box>
                      )}
                      {eventDetails.numberClickedButton !== undefined && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <Typography sx={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                            {eventDetails.numberClickedButton} تسجيل
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Register Button */}
                  {eventDetails.linkRegistration && (
                    <button
                      onClick={handleRegisterClick}
                      className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      سجل الآن
                    </button>
                  )}
                </Box>
              </>
            ) : null}
          </Card>
        </Box>
      )}
    </Card>
  );
}

