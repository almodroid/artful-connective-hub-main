# Supabase Database Setup

This directory contains the database schema for the Artful Connective Hub application. The schema is defined in SQL and can be used to set up your Supabase project.

## Schema Overview

The `schema.sql` file contains all the necessary SQL statements to create:

- Tables for users, projects, posts, comments, likes, notifications, etc.
- Relationships between tables
- Indexes for better query performance
- Functions and triggers for automated operations
- Row Level Security (RLS) policies for data protection

## How to Use with Supabase

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project (or create a new one)
3. Go to the SQL Editor
4. Copy the contents of `schema.sql` and paste it into the SQL Editor
5. Click "Run" to execute the SQL statements

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can use the following commands:

```bash
# Link your project (if not already linked)
supabase link --project-ref jgmwqxkidasfpakbqgjv

# Apply the schema
supabase db push
```

## Database Structure

The database includes the following main tables:

- **profiles**: User profiles with personal information
- **projects**: Creative projects shared by users
- **project_comments**: Comments on projects
- **project_likes**: Likes on projects
- **posts**: Social media style posts
- **post_comments**: Comments on posts
- **post_likes**: Likes on posts
- **tags**: Categories and tags for content
- **portfolio**: Portfolio items for users
- **notifications**: System and user notifications

## Security

The schema includes Row Level Security (RLS) policies that ensure:

- Public data is viewable by everyone
- Users can only create, update, and delete their own content
- Notifications are only visible to their intended recipients

## Customization

You can modify the schema to fit your specific needs before applying it to your Supabase project. Common customizations include:

- Adding additional fields to tables
- Creating new indexes for frequently queried columns
- Adjusting the RLS policies for different security requirements