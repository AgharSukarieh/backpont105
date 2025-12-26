import React from "react";
import { Box, Skeleton } from "@mui/material";

// Skeleton Loading للصفحات العامة
export const PageSkeleton = () => (
  <Box sx={{ p: 3, direction: "rtl" }}>
    <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2, borderRadius: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={300} sx={{ mb: 2, borderRadius: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: 2 }} />
  </Box>
);

// Skeleton Loading لصفحة المسابقة
export const ContestDetailSkeleton = () => (
  <div className="contest-detail-wrapper" style={{ direction: "rtl" }}>
    {/* Header Skeleton */}
    <div className="contest-detail-header" style={{ padding: "1rem" }}>
      <Skeleton variant="circular" width={40} height={40} sx={{ display: "inline-block", mr: 2 }} />
      <Skeleton variant="text" width={300} height={40} sx={{ display: "inline-block" }} />
    </div>

    <div className="contest-detail-main">
      {/* Hero Image Skeleton */}
      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height={400} 
        sx={{ 
          mb: 3,
          borderRadius: 2
        }} 
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
        {/* Info Card Skeleton */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
        </Box>

        {/* Sections Skeleton */}
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2, mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 2 }} />
          </Box>
        ))}

        {/* Problems Skeleton */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2, mb: 1 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Register Button Skeleton */}
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 2, mt: 3 }} />
      </div>
    </div>
  </div>
);

// Skeleton Loading للقوائم (Problems List, Contests List, etc.)
export const ListSkeleton = ({ count = 5 }) => (
  <Box sx={{ p: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={25} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Box>
);

// Skeleton Loading للكروت (Cards)
export const CardSkeleton = ({ count = 3 }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ flex: "1 1 300px", maxWidth: "400px" }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, mb: 1 }} />
        <Skeleton variant="text" width="80%" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    ))}
  </Box>
);

// Skeleton Loading للجداول (Tables)
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <Box sx={{ p: 2 }}>
    {/* Header */}
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      {Array.from({ length: cols }).map((_, index) => (
        <Skeleton key={index} variant="text" width={`${100 / cols}%`} height={40} />
      ))}
    </Box>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: "flex", gap: 2, mb: 1 }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width={`${100 / cols}%`} height={50} />
        ))}
      </Box>
    ))}
  </Box>
);

// Skeleton Loading للملف الشخصي (Profile)
export const ProfileSkeleton = () => (
  <Box sx={{ p: 3, direction: "rtl" }}>
    <Box sx={{ display: "flex", gap: 3, mb: 3, alignItems: "center" }}>
      <Skeleton variant="circular" width={120} height={120} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={25} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={20} />
      </Box>
    </Box>
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="rectangular" width={200} height={100} sx={{ borderRadius: 2 }} />
      ))}
    </Box>
    <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
  </Box>
);

export default {
  PageSkeleton,
  ContestDetailSkeleton,
  ListSkeleton,
  CardSkeleton,
  TableSkeleton,
  ProfileSkeleton
};

