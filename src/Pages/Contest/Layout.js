import { Container, Typography, Box } from "@mui/material";
import { useEffect, useState } from "react";
import AvailableCompetitions from "./AvailableCompetitions.js";
import Leaderboard from "./Leaderboard.js";
import PastCompetitions from "./PastCompetitions.js";
import { getSoonContests, getRunningContests } from "../../Service/contestService";
import { CardSkeleton, PageSkeleton } from "../../Components/SkeletonLoading";



export default function Layout() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [availableCompetitions, setAvailableCompetitions] = useState([]);
    const [pastCompetitions, setPastCompetitions] = useState([]);

useEffect(() => {
  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // جلب المسابقات القريبة والشغالة
      const [soonContests, runningContests] = await Promise.all([
        getSoonContests(),
        getRunningContests()
      ]);
      
      console.log("📊 Soon contests:", soonContests.length);
      console.log("📊 Running contests:", runningContests.length);
      
      // دمج المسابقات القريبة والشغالة مع إضافة حالة لكل مسابقة
      const allAvailable = [
        ...soonContests.map(c => ({ ...c, status: "soon" })),
        ...runningContests.map(c => ({ ...c, status: "running" }))
      ];
      
      // إزالة التكرارات بناءً على ID
      const uniqueContests = allAvailable.reduce((acc, current) => {
        const existing = acc.find(item => item.id === current.id);
        if (!existing) {
          acc.push(current);
        } else {
          // إذا كانت المسابقة موجودة، نعطي الأولوية للحالة "running"
          if (current.status === "running" && existing.status === "soon") {
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
        }
        return acc;
      }, []);
      
      console.log("✅ Available competitions:", uniqueContests.length);
      
      setAvailableCompetitions(uniqueContests);
      setPastCompetitions([]); // سنستخدم GetEnd في صفحة Contests.js

      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching contests:", err);
      setError(err.message || "حدث خطأ في جلب المسابقات");
      setLoading(false);
    }
  };
  
  fetchContests();
}, []);


  
  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 2, minHeight: "100vh", height: "auto", overflow: "visible", width: "100%", px: 0, pb: 4, maxWidth: "100% !important" }}>
        <CardSkeleton count={3} />
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", justifyContent: "flex-end", direction: "rtl", mt: 3, width: "100%" }}>
          <Box sx={{ width: "300px" }}>
            <PageSkeleton />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <CardSkeleton count={6} />
          </Box>
        </Box>
      </Container>
    );
  }
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

