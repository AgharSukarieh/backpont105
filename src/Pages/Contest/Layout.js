import { Container, Typography, Box } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import AvailableCompetitions from "./AvailableCompetitions.js";
import Leaderboard from "./Leaderboard.js";
import PastCompetitions from "./PastCompetitions.js";
import { API_BASE_URL } from "../../Database/URL.js";



export default function Layout() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [availableCompetitions, setAvailableCompetitions] = useState([]);
    const [pastCompetitions, setPastCompetitions] = useState([]);

useEffect(() => {
  axios.get(`${API_BASE_URL}/Contest/GetAllContest`)
    .then(res => {
      const data = res.data;

      const available = data.filter(c => new Date(c.endTime) >= new Date());
      const past = data.filter(c => new Date(c.endTime) < new Date());
      
      setAvailableCompetitions(available);
      setPastCompetitions(past);

      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);


  
  if (loading) return <Typography style={{color:"red"}}>جاري التحميل...</Typography>;
  if (error) return <Typography color="error">حدث خطأ: {error}</Typography>;

return (
  <>
  <Container maxWidth={false} sx={{ mt: 2, minHeight: "100vh", height: "auto", overflow: "visible", width: "100%", px: 2, pb: 4 }}>
  
        {/* إعادة ترتيب المحتوى هنا */}
        <AvailableCompetitions available={availableCompetitions} />
        
        {/* Leaderboard على اليمين و PastCompetitions على يسارها */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", justifyContent: "flex-end", direction: "rtl", mt: 3 }}>
          <Leaderboard />
          <Box sx={{ flex: 3, minWidth: 0 }}>
            <PastCompetitions past={pastCompetitions} />
          </Box>
        </Box>

      </Container>

  </>
);
}

