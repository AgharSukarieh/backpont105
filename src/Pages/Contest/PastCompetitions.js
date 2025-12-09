import {
  Box,
  Tabs,
  Tab,
  Grid,
  Button,
  Typography,
  Card,
  CardMedia,
  Chip,
  Avatar,
  CircularProgress
} from "@mui/material";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../store/authSlice";
import CompetitionDetails from './CompetitionDetails';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from "react-router-dom";
import api from "../../Service/api.js";

export default function PastCompetitions({past}) {
  const [tab, setTab] = useState(0);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [myContests, setMyContests] = useState([]);
  const [loadingMyContests, setLoadingMyContests] = useState(false);
  const navigate = useNavigate();
  const session = useSelector(selectAuthSession);
  const userId = session?.responseUserDTO?.id;

  const handleDetailsClick = (competition) => setSelectedCompetition(competition);
  const handleBackClick = () => setSelectedCompetition(null);
  
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

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      return "";
    }
  };

  // تحديد حالة المسابقة
  const getContestStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return { label: "قريباً", color: "#2196F3", bgcolor: "#E3F2FD" };
    } else if (now >= start && now <= end) {
      return { label: "نشط الآن", color: "#4CAF50", bgcolor: "#E8F5E9" };
    } else {
      return { label: "منتهية", color: "#9E9E9E", bgcolor: "#F5F5F5" };
    }
  };

  // جلب مسابقات المستخدم عند اختيار التبويب الثاني
  useEffect(() => {
    const fetchMyContests = async () => {
      if (tab === 1 && userId) {
        setLoadingMyContests(true);
        try {
          const response = await api.get(`/Contest/GetContestByUserId/${userId}`);
          // إذا كانت الاستجابة object واحد وليس array، نحوله إلى array
          const data = Array.isArray(response.data) ? response.data : [response.data];
          setMyContests(data.filter(c => c !== null)); // إزالة null values
        } catch (error) {
          console.error("Error fetching my contests:", error);
          setMyContests([]);
        } finally {
          setLoadingMyContests(false);
        }
      }
    };

    fetchMyContests();
  }, [tab, userId]);

  return (
    <Card sx={{ p: 2, 
    borderRadius: 4, 
    direction: "rtl",
    width: "100%",
    maxWidth: "100%",
    minHeight: 400,
    bgcolor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
    background: "linear-gradient(135deg, #ffffff 0%, #fafafa 50%, #ffffff 100%)",
    border: "1px solid rgba(0,0,0,0.05)",
    transition: "all 0.3s ease"
    }}>
      
      {/* القسم العلوي Tabs */}
      <Box sx={{ 
        display: "flex !important",
        WebkitBoxPack: "start !important",
        WebkitJustifyContent: "flex-start !important",
        msFlexPack: "start !important",
        justifyContent: "flex-start !important",
        direction: "rtl",
        width: "100%"
      }}>
        <Tabs
          value={tab}
          onChange={(e, v) => { setTab(v); setSelectedCompetition(null); }}
          sx={{ 
            mb: 2,
            "& .MuiTabs-scroller": {
              display: "flex !important",
              WebkitBoxPack: "end !important",
              WebkitJustifyContent: "flex-end !important",
              msFlexPack: "end !important",
              justifyContent: "flex-end !important",
              direction: "rtl"
            },
            "& .MuiTabs-flexContainer": { 
              justifyContent: "flex-end !important",
              direction: "rtl"
            },
            direction: "rtl"
          }}
        >
          <Tab label="المسابقات" sx={{ fontWeight: "bold", fontSize: "20px" }} />
          <Tab label="مسابقاتي" sx={{ fontWeight: "bold", fontSize: "20px" }} />
        </Tabs>
      </Box>

      {selectedCompetition ? (

  <Box sx={{ width: "600px", height: "100%" }}>
      <CompetitionDetails 
        competition={selectedCompetition} 
        onBack={handleBackClick} 
      />
  </Box>
      ) : tab === 0 ? (
        
        /* جميع المسابقات */
        <Grid container spacing={3}>
          {past.map((c) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={c.id}>
              <Card 
                sx={{
                  position: "relative",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
                  }
                }}
                onClick={() => navigate(`/ViewContest/${c.id}`)}
              >
                {/* الصورة */}
                <CardMedia
                  component="img"
                  image={c.imageURL && c.imageURL !== "" ? c.imageURL : "https://via.placeholder.com/400x200"}
                  sx={{ 
                    width: "100%", 
                    height: 180,
                    objectFit: "cover"
                  }}
                />

                {/* Badge الحالة */}
                {(() => {
                  const status = getContestStatus(c.startTime, c.endTime);
                  return (
                    <Chip
                      label={status.label}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        bgcolor: status.bgcolor,
                        color: status.color,
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        border: `1px solid ${status.color}`
                      }}
                    />
                  );
                })()}

                {/* المحتوى */}
                <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* اسم المسابقة مع أيقونة */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, direction: "rtl" }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: "bold", 
                        color: "#1f2937",
                        lineHeight: 1.3,
                        flex: 1,
                        minHeight: "3em",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {c.name}
                    </Typography>
                    <CalendarTodayIcon sx={{ fontSize: 20, color: "#6b7280", flexShrink: 0 }} />
                  </Box>

                  {/* معلومات إضافية */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {/* التاريخ */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarTodayIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {formatDate(c.startTime)} - {formatDate(c.endTime)}
                      </Typography>
                    </Box>

                    {/* المنشئ */}
                    {c.createdByUserName && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {c.createdByUserName}
                        </Typography>
                      </Box>
                    )}

                    {/* الجامعة */}
                    {c.universityName && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <SchoolIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {c.universityName}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* زر التفاصيل */}
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      mt: "auto",
                      borderRadius: 3, 
                      bgcolor: "#005A65",
                      textTransform: "none",
                      fontWeight: "bold",
                      py: 1.2,
                      "&:hover": {
                        bgcolor: "#00606B"
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/ViewContest/${c.id}`);
                    }}
                  >
                    عرض التفاصيل
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

      ) : (

        /* مسابقاتي فقط */
        loadingMyContests ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : myContests.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" sx={{ color: "#999", mb: 2 }}>
              لا توجد مسابقات لك
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ width: "100%" }}>
            {myContests.map((item) => (
            <Grid item xs={12} sm={6} md={3} lg={2.4} key={item.id} sx={{ display: "flex" }}>
              <Card 
                sx={{
                  position: "relative",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
                  }
                }}
                onClick={() => navigate(`/ViewContest/${item.id}`)}
              >
                <CardMedia
                  component="img"
                  image={item.imageURL && item.imageURL !== "" ? item.imageURL : "https://via.placeholder.com/400x200"}
                  sx={{ 
                    width: "100%", 
                    height: 180,
                    objectFit: "cover"
                  }}
                />

                {(() => {
                  const status = getContestStatus(item.startTime, item.endTime);
                  return (
                    <Chip
                      label={status.label}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        bgcolor: status.bgcolor,
                        color: status.color,
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        border: `1px solid ${status.color}`
                      }}
                    />
                  );
                })()}

                <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* اسم المسابقة مع أيقونة */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, direction: "rtl" }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: "bold", 
                        color: "#1f2937",
                        lineHeight: 1.3,
                        flex: 1
                      }}
                    >
                      {item.name}
                    </Typography>
                    <CalendarTodayIcon sx={{ fontSize: 20, color: "#6b7280", flexShrink: 0 }} />
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarTodayIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        انتهت: {formatDate(item.endTime)} {formatTime(item.endTime)}
                      </Typography>
                    </Box>

                    {item.createdByUserName && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {item.createdByUserName}
                        </Typography>
                      </Box>
                    )}

                    {item.universityName && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <SchoolIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {item.universityName}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      mt: "auto",
                      borderRadius: 3, 
                      bgcolor: "#005A65",
                      textTransform: "none",
                      fontWeight: "bold",
                      py: 1.2,
                      "&:hover": {
                        bgcolor: "#00606B"
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/ViewContest/${item.id}`);
                    }}
                  >
                    عرض التفاصيل
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
        )
      )}
    </Card>
  );
}
