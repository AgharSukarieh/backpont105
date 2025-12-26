/**
 * Service Index - تجميع جميع Services
 * استيراد جميع Services من مكان واحد
 */

// Comments
export * from "./commentService";

// General
export * from "./generalService";

// Users
export * from "./userService";

// Problems
export * from "./ProblemService";
export * from "./ProblemRatingService";

// Admin
export * from "./adminService";

// Tags
export * from "./TagServices";

// Contests
export * from "./contestService";

// Posts
export * from "./postService";

// Problem Requests
export * from "./problemRequestService";

// Algorithms
export * from "./algorithmService";

// Universities
export * from "./UniversityService";

// Countries
export * from "./CountryService";

// Auth
export * from "./authService";

// Uploads
export * from "./uploadService";

// Likes
export * from "./likeService";

// Follows
export * from "./followService";

// Messages
export * from "./messageService";

// Notifications
export * from "./NotificationServices";

// Submissions
export * from "./submissionServices";

// Events
export * from "./eventService";

// Search
export * from "./searchService";

// API instance
export { default as api } from "./api";
