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
      console.log("📊 All contests from API:", data);
      console.log("📊 Total contests:", data.length);

      const now = new Date();
      console.log("📅 Current time:", now.toISOString());
      
      const available = data.filter(c => {
        if (!c.endTime) {
          console.warn(`⚠️ Contest ${c.id} has no endTime`);
          return false;
        }
        const endTime = new Date(c.endTime);
        if (isNaN(endTime.getTime())) {
          console.warn(`⚠️ Contest ${c.id} has invalid endTime: ${c.endTime}`);
          return false;
        }
        // إذا كانت startTime و endTime متساويتان، تعتبر المسابقة متاحة (حالة خاصة)
        const startTime = c.startTime ? new Date(c.startTime) : null;
        const isSameTime = startTime && !isNaN(startTime.getTime()) && startTime.getTime() === endTime.getTime();
        // المسابقة متاحة إذا كانت endTime في المستقبل (لم تنته بعد)، أو إذا كانت startTime === endTime (حالة خاصة)
        // نستخدم isSameTime || endTime > now لضمان أن المسابقات التي لم تنته بعد تُعرض
        const isAvailable = isSameTime || endTime > now;
        const diff = endTime - now;
        const diffDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
        console.log(`Contest ${c.id} (${c.name}): startTime=${c.startTime}, endTime=${c.endTime}, isSameTime=${isSameTime}, isAvailable=${isAvailable}, diff=${diff >= 0 ? '+' : '-'}${diffDays} days`);
        return isAvailable;
      });
      const past = data.filter(c => {
        if (!c.endTime) return false;
        const endTime = new Date(c.endTime);
        if (isNaN(endTime.getTime())) return false;
        return endTime < now;
      });
      
      console.log("✅ Available competitions:", available.length, available.map(c => ({ id: c.id, name: c.name })));
      console.log("✅ Past competitions:", past.length, past.map(c => ({ id: c.id, name: c.name })));
      
      setAvailableCompetitions(available);
      setPastCompetitions(past);

      setLoading(false);
    })
    .catch(err => {
      console.error("❌ Error fetching contests:", err);
      setError(err.message);
      setLoading(false);
    });
}, []);


  
  if (loading) return <Typography style={{color:"red"}}>جاري التحميل...</Typography>;
  if (error) return <Typography color="error">حدث خطأ: {error}</Typography>;

return (
  <>
  <Container maxWidth={false} sx={{ mt: 2, minHeight: "100vh", height: "auto", overflow: "visible", width: "100%", px: 0, pb: 4, maxWidth: "100% !important" }}>
  
        {/* إعادة ترتيب المحتوى هنا */}
        <AvailableCompetitions available={availableCompetitions} />
        
        {/* Leaderboard على اليمين و PastCompetitions على يسارها */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", justifyContent: "flex-end", direction: "rtl", mt: 3, width: "100%" }}>
          <Leaderboard />
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <PastCompetitions past={pastCompetitions} />
          </Box>
        </Box>

      </Container>

  </>
);
}

