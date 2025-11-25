import api from "./api";

export const getUnreadNotificationsCount = async (idUser) => {
  try { 
    const response = await api.get(`/Notification/NumberUnRead/${idUser}`);
    console.log("Unread Notifications Count response data:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error fetching unread notifications:", err);
    return 0;
  }
};

export const fetchNotificationsByUser = async (idUser) => {
  if (!idUser) return [];
  try {
    const response = await api.get(`/Notification/GetNotificationByUserId/${idUser}`);
    console.log("Notifications response data:", response.data);
    return response.data || [];
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};
