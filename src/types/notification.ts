export type AppNotificationType = "Warning" | "Suspension" | "ReportDismissed";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: AppNotificationType;
  isRead: boolean;
  createdAt: string;
}
