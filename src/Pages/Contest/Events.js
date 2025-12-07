import { Card, Box, Typography, CardMedia, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../Service/api.js";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get("/Event/GetAll");
        setEvents(response.data || []);
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
        <CircularProgress />
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
      maxWidth: "350px"
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "right" }}>
        الأحداث
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {events.map((event) => (
          <Box
            key={event.id}
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              direction: "rtl"
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
    </Card>
  );
}

