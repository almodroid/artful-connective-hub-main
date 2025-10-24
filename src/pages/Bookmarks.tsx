import { Layout } from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookmarkService } from "@/services/bookmark.service";
import { PostCard } from "@/components/ui-custom/PostCard";
import { Post } from "@/types/post.types";

export default function Bookmarks() {
  const { user } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      if (!user) {
        setLoading(false);
        setError("User not logged in.");
        return;
      }
      try {
        setLoading(true);
        const data = await bookmarkService.getBookmarkedPosts(user.id);
        setBookmarkedPosts(data);
      } catch (err) {
        setError("Failed to fetch bookmarked posts.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedPosts();
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Bookmarked Posts</h1>
        {loading && <p>Loading bookmarked posts...</p>}
        {!loading && bookmarkedPosts.length === 0 && !error && (
          <p>No bookmarked posts found.</p>
        )}
        <div className="flex flex-col gap-4">
          {bookmarkedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </Layout>
  );
}