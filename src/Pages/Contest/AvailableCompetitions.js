import { Card, CardMedia, Box, Typography, Container, Divider } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState, useEffect } from "react";
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";

const pulseAnimation = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

export default function AvailableCompetitions({ available}) {
  const [visibleItems, setVisibleItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (available && available.length > 0) {
      setVisibleItems(
        available.length >= 3
          ? [0, 1, 2]
          : available.map((_, i) => i)
      );
    }
  }, [available]);

  // Animation تلقائي لتقلب الكروت كل 3 ثواني بدون حركة
  useEffect(() => {
    if (!available || available.length < 2) return;
    
    const interval = setInterval(() => {
      // تغيير الكروت مباشرة بدون animation
      setVisibleItems(prev => prev.map(i => (i + 1) % available.length));
    }, 3000); // كل 3 ثواني

    return () => clearInterval(interval);
  }, [available]);

  const handleNext = () => {
    setVisibleItems(prev => prev.map(i => (i + 1) % available.length));
  };

  const handlePrev = () => {
    setVisibleItems(prev => prev.map(i => (i - 1 + available.length) % available.length));
  };


  if (!available || available.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ textAlign: "center", mt: 3 }}>
        <h2>لا توجد مسابقات متاحة</h2>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ position: "relative", width: "100%", px: 2, mb: 4 }}>
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: 2, 
        position: "relative", 
        overflow: "hidden", 
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
         <ArrowForwardIosIcon
          onClick={handleNext}
          sx={{ 
            fontSize: 40, 
            color: "#005A65", 
            cursor: "pointer", 
            zIndex: 10,
            "&:hover": { color: "#00A99D" },
            transition: "color 0.3s ease",
            animation: `${pulseAnimation} 2s ease-in-out infinite`
          }}
        />

        <Box sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: 2,
          justifyContent: "center",
          alignItems: "stretch"
        }}>
          {visibleItems.map((index, pos) => {
            const item = available[index];
            const itemCount = visibleItems.length;
            // حساب العرض: 3 كروت = 33.33%, 2 كروت = 50%, 1 كارت = 100%
            const cardWidth = itemCount === 1 ? "100%" : itemCount === 2 ? "calc(50% - 8px)" : "calc(33.33% - 11px)";
            
            // تحديد حالة المسابقة
            const now = new Date();
            const startTime = new Date(item.startTime);
            const endTime = new Date(item.endTime);
            const isActive = startTime <= now && endTime > now;
            const isUpcoming = startTime > now;
            
            // ألوان مختلفة لكل كارت مع نفس الشفافية
            const overlayColors = [
              { start: "rgba(0,169,157,0.75)", end: "rgba(0,169,157,0.5)" }, // Teal
              { start: "rgba(33,150,243,0.75)", end: "rgba(33,150,243,0.5)" }, // Blue
              { start: "rgba(156,39,176,0.75)", end: "rgba(156,39,176,0.5)" }, // Purple
              { start: "rgba(255,152,0,0.75)", end: "rgba(255,152,0,0.5)" }, // Orange
              { start: "rgba(76,175,80,0.75)", end: "rgba(76,175,80,0.5)" }, // Green
            ];
            const colorIndex = pos % overlayColors.length;
            const selectedColor = overlayColors[colorIndex];
            
            // حساب الوقت المتبقي من البيانات الفعلية
            const getRemainingTime = () => {
              if (isActive && item.endTime) {
                try {
                  const end = new Date(item.endTime);
                  const diff = end - now;
                  if (diff <= 0) return "انتهت المسابقة";
                  
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                  const minutes = Math.floor((diff / (1000 * 60)) % 60);
                  
                  if (days > 0) {
                    return `يوم و ${hours} ساعات ${minutes}`;
                  } else if (hours > 0) {
                    return `${hours} ساعات ${minutes} دقائق`;
                  } else {
                    return `${minutes} دقائق`;
                  }
                } catch (error) {
                  return "خطأ في حساب الوقت";
                }
              }
              return null;
            };
            
            // تنسيق التاريخ من البيانات الفعلية
            const formatDate = (dateString) => {
              if (!dateString) return "غير محدد";
              try {
                const d = new Date(dateString);
                if (isNaN(d.getTime())) return "تاريخ غير صحيح";
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
              } catch (error) {
                return "تاريخ غير صحيح";
              }
            };
            
            return (
              <Card
                key={item.id}
                onClick={() => navigate(`/ViewContest/${item.id}`)}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  position: "relative",
                  width: cardWidth,
                  maxWidth: itemCount === 1 ? "800px" : itemCount === 2 ? "600px" : "450px",
                  height: "300px",
                  flexShrink: 0,
                  transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  willChange: "transform",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
                  }
                }}
              >
                <CardMedia
                  component="img"
                  image={item.imageURL && item.imageURL !== "" ? item.imageURL : "https://via.placeholder.com/150"}
                  alt={item.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                
                {/* Banner في الأعلى */}
                <Box sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: isActive ? "#4CAF50" : "#2196F3",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "14px",
                  zIndex: 2
                }}>
                  {isActive ? "نشط الآن" : "قريبا"}
                </Box>
                
                {/* Overlay في الأسفل */}
                <Box sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  width: "100%",
                  background: `linear-gradient(to top, ${selectedColor.start} 0%, ${selectedColor.end} 50%, transparent 100%)`,
                  color: "#fff",
                  py: 2.5,
                  px: 2,
                  direction: "rtl",
                  textAlign: "right"
                }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1, textAlign: "right" }}>
                    {item.name}
                  </Typography>
                  <Typography fontSize={14} sx={{ textAlign: "right", opacity: 0.95 }}>
                    {isActive 
                      ? `الوقت المتبقي: ${getRemainingTime()}`
                      : `تبدا بتاريخ: ${formatDate(item.startTime)}`
                    }
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Box>

          
       
        <ArrowBackIosNewIcon
          onClick={handlePrev}
          sx={{ 
            fontSize: 40, 
            color: "#005A65", 
            cursor: "pointer", 
            zIndex: 10,
            "&:hover": { color: "#00A99D" },
            transition: "color 0.3s ease",
            animation: `${pulseAnimation} 2s ease-in-out infinite`
          }}
        />

      </Box>
    </Container>
  );
}
