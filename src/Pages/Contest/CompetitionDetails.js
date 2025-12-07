import { Box, Typography, Button, CardMedia } from "@mui/material";

export default function CompetitionDetails({ competition, onBack }) {
  return (
    <Box sx={{ p: 3, direction: "rtl", color: "black" , width: "100%", 
  height: "100%"}}>

      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: "black", fontWeight: "bold", textAlign: "center" }}
      >
        تفاصيل المسابقة: {competition.name}
      </Typography>

      {/* صورة المسابقة */}
      <CardMedia
        component="img"
        image={
          competition.imageURL && competition.imageURL !== ""
            ? competition.imageURL
            : "https://via.placeholder.com/400x250"
        }
        sx={{
          width: "100%",
          maxHeight: "300px",
          borderRadius: 3,
          objectFit: "cover",
          mb: 3
        }}
      />

      {/* معلومات أساسية من الـ API */}
      <Typography variant="body1" sx={{ fontSize: "18px", mb: 1 }}>
        <b>المنشئ:</b> {competition.createdByUserName}
      </Typography>

      <Typography variant="body1" sx={{ fontSize: "18px", mb: 1 }}>
        <b>تاريخ البداية:</b> {new Date(competition.startTime).toLocaleDateString("ar-JO")}
      </Typography>

      <Typography variant="body1" sx={{ fontSize: "18px", mb: 1 }}>
        <b>وقت البداية:</b> {new Date(competition.startTime).toLocaleTimeString("ar-JO")}
      </Typography>

      <Typography variant="body1" sx={{ fontSize: "18px", mb: 1 }}>
        <b>تاريخ الانتهاء:</b> {new Date(competition.endTime).toLocaleDateString("ar-JO")}
      </Typography>

      <Typography variant="body1" sx={{ fontSize: "18px", mb: 2 }}>
        <b>وقت الانتهاء:</b> {new Date(competition.endTime).toLocaleTimeString("ar-JO")}
      </Typography>

    
      {/* زر الرجوع */}
      <Button
        variant="outlined"
        onClick={onBack}
        sx={{
          marginTop: "3%",
          borderColor: "#00606B",
          color: "black",
          backgroundColor: "white",
          fontWeight: "bold",
          borderRadius: 3
        }}
      >
        العودة للمسابقات
      </Button>

    </Box>
  );
}
