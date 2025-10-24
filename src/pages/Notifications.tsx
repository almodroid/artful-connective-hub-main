import { Layout } from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications } from "@/services/notification.service";
import { Notification } from "@/types/notification.types";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        setError("User not logged in.");
        return;
      }
      try {
        setLoading(true);
        const data = await getNotifications(user.id);
        setNotifications(data);
      } catch (err) {
        setError("Failed to fetch notifications.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        {loading && <p>Loading notifications...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && notifications.length === 0 && !error && (
          <p>No notifications found.</p>
        )}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4 border rounded-lg shadow-sm">
              <p className="font-semibold">{notification.message}</p>
              <p className="text-sm text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}