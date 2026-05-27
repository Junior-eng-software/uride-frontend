import axiosClient from "../api/axiosClient";
import type { AppNotification } from "../types/notification";

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await axiosClient.get<AppNotification[]>("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<void> => {
  await axiosClient.put(`/notifications/${notificationId}/read`);
};
