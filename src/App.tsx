import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TranslationProvider } from "./hooks/use-translation";
import { Toaster } from "./components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TagPage from "@/pages/TagPage";
import { AuthDebugger } from "./components/ui-custom/AuthDebugger";
import { ProductionDebugger } from "./components/ui-custom/ProductionDebugger";
import React from 'react';

// Pages
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Post from "./pages/Post";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import AdminNotifications from "./pages/AdminNotifications";
import Reel from "./pages/Reel";
import CreatePost from "./pages/CreatePost";
import Reels from "./pages/Reels";
import Messages from "./pages/Messages";
import SpaceAI from "./pages/SpaceAI";
import About from "@/pages/About";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";

// Create a new query client instance
const queryClient = new QueryClient();

function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TranslationProvider>
            <AuthProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/explore/tag/:tag" element={<TagPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/space-ai" element={<SpaceAI />} />
                  <Route path="/post/:postId" element={<Post />} />
                  <Route path="/reel/:id" element={<Reel />} />
                  <Route path="/reels/:reelId" element={<Reel />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:conversationId" element={<Messages />} />
                  <Route path="/messages/user/:userId" element={<Messages />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                {import.meta.env.DEV && <AuthDebugger />}
                <ProductionDebugger />
              </Router>
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </QueryClientProvider>
  );
}

export default App;
