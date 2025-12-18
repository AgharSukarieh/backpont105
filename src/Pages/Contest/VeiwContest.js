import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Service/api.js";
import {
  Container,
  Typography,
  Box,
  Card,
  Button,
  Chip,
  CircularProgress,
  Avatar
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./VeiwContest.css";

// Ensure boxicons is loaded
const ensureBoxicons = () => {
  if (typeof document === "undefined") return;
  const BOXICON_LINK_ID = "contest-detail-boxicons-link";
  if (!document.getElementById(BOXICON_LINK_ID)) {
    const link = document.createElement("link");
    link.id = BOXICON_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
    document.head.appendChild(link);
  }
};

export default function ContestProblems() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ensureBoxicons();
  }, []);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `/Contest/Contest/${id}`;
        console.log("Fetching contest from:", url);
        
        const response = await api.get(url);
        console.log("Contest response:", response);
        console.log("Contest data:", response.data);
        
        if (response.data) {
          setContest(response.data);
        } else {
          setError("لم يتم العثور على بيانات المسابقة");
        }
      } catch (err) {
        console.error("Error fetching contest:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });
        
        if (err.response) {
          // Server responded with error status
          const status = err.response.status;
          if (status === 404) {
            setError("المسابقة غير موجودة");
          } else if (status === 500) {
            setError("خطأ في الخادم. يرجى المحاولة لاحقاً");
          } else {
            setError(`خطأ ${status}: ${err.response.data?.message || err.message}`);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError("لا يمكن الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت");
        } else {
          // Something else happened
          setError(err.message || "حدث خطأ غير متوقع");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError("معرف المسابقة غير موجود");
      setLoading(false);
      return;
    }

    fetchContest();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, textAlign: "center", direction: "rtl" }}>
        <Typography color="error" variant="h6" sx={{ mb: 1 }}>
          {error}
        </Typography>
        {id && (
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            معرف المسابقة: {id}
          </Typography>
        )}
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2, bgcolor: "#005A65" }}
        >
          العودة
        </Button>
      </Container>
    );
  }

  if (!contest) {
    return (
      <Container sx={{ mt: 4, textAlign: "center", direction: "rtl" }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          لم يتم العثور على بيانات المسابقة
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2, bgcolor: "#005A65" }}
        >
          العودة
        </Button>
      </Container>
    );
  }

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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "hard":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "سهل";
      case "medium":
        return "متوسط";
      case "hard":
        return "صعب";
      default:
        return difficulty || "غير محدد";
    }
  };

  const getStatusLabel = (statueProblem) => {
    // statueProblem: 1 = Solved, 0 = Not Solved
    return statueProblem === 1 ? "محلول" : "غير محلول";
  };

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="contest-detail-header">
        <button
          onClick={() => navigate(-1)}
          className="contest-detail-back-btn"
          aria-label="العودة"
        >
          <i className="bx bx-arrow-back"></i>
        </button>
        <div className="contest-detail-header-content">
          <h1 className="contest-detail-title">{contest.name}</h1>
          <span className="contest-detail-date">{formatDate(contest.startTime)}</span>
        </div>
      </div>

      <Container maxWidth="lg" className="contest-detail-content" sx={{ py: 4 }}>

      {/* Problems List */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3, color: "#7B1FA2", textAlign: "center" }}>
          المسائل في هذه المسابقة
        </Typography>

        {!contest.problems || contest.problems.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: "#999", mt: 4 }}>
            لا توجد مسائل في هذه المسابقة
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {contest.problems.map((problem, index) => (
              <Card
                key={problem.id}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }
            }}
          >
                <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                  {/* Right side - Problem Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "#7B1FA2",
                          width: 40,
                          height: 40,
                          fontSize: "1.2rem",
                          fontWeight: "bold"
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: "bold", flex: 1 }}>
                        {problem.title}
                      </Typography>
                    </Box>

                    {/* Tags and Author */}
                    <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                      {problem.tags && problem.tags.length > 0 && (
                        <Chip
                          label={problem.tags[0].tagName}
                          size="small"
                          sx={{
                            bgcolor: "#E1BEE7",
                            color: "#7B1FA2",
                            fontWeight: "bold"
                          }}
                        />
                      )}
                      {problem.userName && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#7B1FA2",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                      >
                          {problem.userName}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Left side - Status and Stats */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "flex-end", minWidth: "150px" }}>
                    {/* Difficulty */}
                    <Chip
                      label={getDifficultyLabel(problem.difficulty)}
                      size="small"
                      sx={{
                        bgcolor: "#F5F5F5",
                        color: "#333",
                        fontWeight: "bold",
                        fontSize: "0.75rem"
                      }}
                    />

                    {/* Status */}
                    {problem.statueProblem === 1 && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ color: "#4CAF50 !important", fontSize: "16px !important" }} />}
                        label={getStatusLabel(problem.statueProblem)}
                        size="small"
                        sx={{
                          bgcolor: "#E8F5E9",
                          color: "#4CAF50",
                          fontWeight: "bold",
                          fontSize: "0.75rem"
                      }}
                      />
                    )}

                    {/* Stats */}
                    <Box sx={{ mt: 0.5, textAlign: "right" }}>
                      <Typography variant="caption" sx={{ color: "#666", display: "block", fontSize: "0.7rem" }}>
                        نسبة القبول: {problem.acceptanceRate?.toFixed(2) || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block", fontSize: "0.7rem" }}>
                        حلها: {problem.numberOfUsersSolved || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
                  ))}
          </Box>
        )}
      </Box>
      </Container>
    </div>
  );
}
