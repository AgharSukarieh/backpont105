import { Card, Box, Typography, CardMedia } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { keyframes } from "@mui/system";
import { API_BASE_URL } from "../../Database/URL.js";
import crownOne from "../../assets/crown_ one.png";
import crownTwo from "../../assets/crown_tow.png";
import crownThree from "../../assets/crown_three.png";

const pulseAnimation = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
`;

const glowAnimation = keyframes`
  0%, 100% {
    text-shadow: 0 0 10px rgba(255, 192, 29, 0.8), 0 0 20px rgba(255, 192, 29, 0.6);
    filter: brightness(1);
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 192, 29, 1), 0 0 30px rgba(255, 192, 29, 0.8), 0 0 40px rgba(255, 192, 29, 0.6);
    filter: brightness(1.2);
  }
`;

export default function Leaderboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const borderColors = {
    1: "#FFC01D",
    2: "#C0C0C0",
    3: "#CD7F32"
  };

  const getCrownImage = (rank) => {
    switch (rank) {
      case 1:
        return crownOne;
      case 2:
        return crownTwo;
      case 3:
        return crownThree;
      default:
        return null;
    }
  };




  
  useEffect(() => {
    axios.get(`${API_BASE_URL}/User/GetTopCoder`)
      .then(res => {
        setUsers(res.data.slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);


  

  if (loading) return <Typography sx={{color:"black"}}>Loading leaderboard...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  if (!users || users.length === 0) {
  return <Typography sx={{textAlign:"center"}}>لا يوجد مستخدمين مسجلين لهذه المسابقة حتى الآن.</Typography>;
}

  return (
    
<Card className="LeaderBoardComp" sx={{ 
  backgroundColor: "#fff",
  color: "rgba(0, 0, 0, 0.87)",
  transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
  borderRadius: "16px",
  overflow: "hidden",
  padding: "24px",
  direction: "rtl",
  backgroundColor: "#ffffff",
  color: "#000",
  width: "350px",
  maxWidth: "350px",
  marginLeft: "auto",
  flexShrink: 0,
  boxShadow: "0 10px 10px rgba(0,0,0,0.2), 0 12px 12px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.1)",
  background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #ffffff 100%)",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease"
}}>
      <Box sx={{ 
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "12px",
        marginBottom: "44px",
        direction: "rtl"
      }}>
        <EmojiEventsIcon sx={{ fontSize: 28, color: "#FFC01D" }} />
        <Typography variant="h6" sx={{ color: "black", fontWeight: "bold", margin: 0 }}>
        التصنيف على مستوى المملكة
      </Typography>
      </Box>

      {users.map((u, i) => (
        <Box key={i} sx={{ 
          display: "flex",
          alignItems: "center",
          paddingTop: "8px",
          paddingBottom: "8px",
          marginTop: i === 0 ? 0 : "24px"
        }}>
          {/* Rank Number */}
          <Typography sx={{ 
            fontSize: u.rank === 1 ? 36 : u.rank === 2 ? 30 : u.rank === 3 ? 26 : 20,
            mr: 2, 
            ml: "14px", 
            color: borderColors[u.rank] || "#666",
            fontWeight: u.rank <= 3 ? 900 : 400,
            textShadow: u.rank === 1 
              ? `0 0 15px ${borderColors[u.rank]}, 0 0 25px ${borderColors[u.rank]}` 
              : u.rank <= 3 
              ? `0 0 10px ${borderColors[u.rank]}` 
              : "none",
            animation: u.rank === 1 
              ? `${glowAnimation} 2s ease-in-out infinite` 
              : u.rank === 2 || u.rank === 3
              ? `${pulseAnimation} 2s ease-in-out infinite` 
              : "none"
          }}>
            {u.rank}
          </Typography>

          {/* Avatar with border */}
          <Box 
            sx={{ ml: 1, position: "relative", cursor: "pointer" }}
            onClick={() => {
              if (u.id || u.userId) {
                navigate(`/Profile/${u.id || u.userId}`);
              }
            }}
          >
            <CardMedia
              component="img"
              image={u.imageURL || "https://via.placeholder.com/45"}
              sx={{
                display: "block",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                width: "85px",
                height: "85px",
                objectFit: "cover",
                marginLeft: "8px",
                borderRadius: "100%",
                border: "3px solid",
                borderColor: borderColors[u.rank] || "#f0f0f0",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.05)"
                }
              }}
            />
            {getCrownImage(u.rank) && (
              <Box
                component="img"
                src={getCrownImage(u.rank)}
                alt={`Rank ${u.rank} crown`}
                sx={{
                  position: "absolute",
                  top: "-27px",
                  left: "55%",
                  transform: "translateX(-50%)",
                  width: "59px",
                  height: "38px",
                  zIndex: 1,
                  objectFit: "contain"
                }}
              />
            )}
          </Box>

          <Box 
            sx={{ mr: 1, cursor: "pointer" }}
            onClick={() => {
              if (u.id || u.userId) {
                navigate(`/Profile/${u.id || u.userId}`);
              }
            }}
          >
            <Typography sx={{ 
              margin: "0px",
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: "lighter",
              fontSize: "1.4rem",
              lineHeight: 1.5,
              letterSpacing: "0.00938em",
              "&:hover": {
                color: "#6366f1"
              }
            }}>
              {u.userName}
            </Typography>
            <Typography fontSize={14} color="black">
              التقييم: {u.totalSolved}
            </Typography>
          </Box>
        </Box>
      ))}
    </Card>
  );
}
