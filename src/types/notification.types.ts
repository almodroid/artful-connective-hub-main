export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  message: string;
  read: boolean;
  // Add other fields as necessary based on your database schema
}