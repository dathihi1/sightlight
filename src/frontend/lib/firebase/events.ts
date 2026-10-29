export const FCM_MESSAGE_EVENT = "signlight:fcm-message";

export interface SignLightPushMessage {
  notificationId?: string;
  title: string;
  body: string;
  type?: string;
  targetUrl: string;
}
