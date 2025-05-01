
import { supabase } from "@/integrations/supabase/client";

// Fetch system statistics from the database
export async function fetchSystemStats() {
  try {
    // Get users count
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (userError) throw userError;

    // Get posts count
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (postsError) throw postsError;

    // Get projects count
    const { count: projectsCount, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (projectsError) throw projectsError;

    // Get reports count
    const { count: reportsCount, error: reportsError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'report');
    
    if (reportsError) throw reportsError;

    // Get active users (created in last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString());
    
    if (activeUsersError) throw activeUsersError;

    // Get new posts today
    const { count: postsToday, error: postsTodayError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString());
    
    if (postsTodayError) throw postsTodayError;

    return {
      totalUsers: userCount || 0,
      totalPosts: postsCount || 0,
      totalProjects: projectsCount || 0,
      reportedContent: reportsCount || 0,
      activeUsers: activeUsers || 0,
      postsToday: postsToday || 0,
      newUsersToday: activeUsers || 0,
      engagement: calculateEngagement(postsCount || 0, userCount || 0)
    };
    
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
}

// Calculate engagement rate
function calculateEngagement(postsCount: number, userCount: number): number {
  if (userCount === 0) return 0;
  // Simple calculation - can be enhanced later
  return parseFloat(((postsCount / userCount) * 100).toFixed(1));
}

// Fetch activity data for charts
export async function fetchActivityData() {
  try {
    // Get the date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Query users by month
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());
    
    if (userError) throw userError;
    
    // Query posts by month
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());
    
    if (postError) throw postError;
    
    // Process data by month
    const monthlyData = processMonthlyData(userData || [], postData || []);
    
    return monthlyData;
  } catch (error) {
    console.error('Error fetching activity data:', error);
    throw error;
  }
}

// Process data into monthly counts
function processMonthlyData(users: any[], posts: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthData: Record<string, { users: number, posts: number }> = {};
  
  // Initialize all months with zero values
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 7; i++) {
    const monthIndex = (currentMonth - i + 12) % 12; // Go back i months, wrap around to previous year if needed
    monthData[months[monthIndex]] = { users: 0, posts: 0 };
  }
  
  // Count users by month
  users.forEach(user => {
    const date = new Date(user.created_at);
    const monthName = months[date.getMonth()];
    if (monthData[monthName]) {
      monthData[monthName].users += 1;
    }
  });
  
  // Count posts by month
  posts.forEach(post => {
    const date = new Date(post.created_at);
    const monthName = months[date.getMonth()];
    if (monthData[monthName]) {
      monthData[monthName].posts += 1;
    }
  });
  
  // Convert to array format for charts
  return Object.entries(monthData).reverse().map(([name, data]) => ({
    name,
    users: data.users,
    posts: data.posts
  }));
}

// Fetch recent reports
export async function fetchReports() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        user_id,
        sender_id,
        action_type,
        action_link,
        created_at,
        read
      `)
      .eq('action_type', 'report')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    return data.map(report => ({
      id: report.id,
      userId: report.sender_id || 'anonymous',
      reason: report.title,
      content: report.message,
      status: report.read ? 'reviewed' : 'pending',
      createdAt: new Date(report.created_at)
    }));
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

// Fetch content distribution data
export async function fetchContentDistribution() {
  try {
    // For demonstration - in a real app, you would have a content_type field
    // This is a simplified version that simulates content distribution
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, tags')
      .not('tags', 'is', null);
    
    if (projectsError) throw projectsError;
    
    const distribution: Record<string, number> = {
      'صور': 0,
      'نصوص': 0,
      'فيديو': 0,
      'تصاميم': 0,
      'رسومات': 0
    };
    
    // Count by tags
    projects?.forEach(project => {
      if (project.tags) {
        project.tags.forEach((tag: string) => {
          if (tag.includes('صور') || tag.includes('photo')) distribution['صور']++;
          else if (tag.includes('نص') || tag.includes('text')) distribution['نصوص']++;
          else if (tag.includes('فيديو') || tag.includes('video')) distribution['فيديو']++;
          else if (tag.includes('تصميم') || tag.includes('design')) distribution['تصاميم']++;
          else if (tag.includes('رسم') || tag.includes('drawing')) distribution['رسومات']++;
        });
      }
    });
    
    // Ensure we have some data for demonstration
    const hasData = Object.values(distribution).some(val => val > 0);
    if (!hasData) {
      distribution['صور'] = 400;
      distribution['نصوص'] = 300;
      distribution['فيديو'] = 120;
      distribution['تصاميم'] = 270;
      distribution['رسومات'] = 200;
    }
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    
  } catch (error) {
    console.error('Error fetching content distribution:', error);
    throw error;
  }
}
