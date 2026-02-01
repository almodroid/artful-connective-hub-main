import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, Settings } from "lucide-react"; // Added imports for User and Settings icons
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../integrations/supabase/client";

interface ProfileData {
  username: string;
  avatar_url: string;
  followers_count: number;
  following_count: number;
  projects_count: number;
}

export function RightSidebar() {
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (user) {
      console.log("User in RightSidebar:", user); // Add this line
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            throw error;
          }

          const { count: projectsCount, error: projectsError } = await supabase
            .from('projects')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id);

          if (projectsError) {
            throw projectsError;
          }

          console.log("Profile data in RightSidebar:", data); // Add this line
          setProfileData({
            username: data.username || "",
            avatar_url: data.avatar_url || "",
            followers_count: data.followers_count || 0,
            following_count: data.following_count || 0,
            projects_count: projectsCount || 0
          });
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfileData(null);
        }
      };
      fetchProfile();
    } else {
      console.log("User is null in RightSidebar"); // Add this line
      setProfileData(null);
    }
  }, [user]);

  return (
    <aside className="hidden md:flex flex-col gap-4 p-4 w-80 border-l rounded-lg">
      {profileData && (
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{profileData.username ? profileData.username[0] : "U"}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{profileData.username}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">@{profileData.username}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex justify-around w-full text-center">
              <div>
                <div className="text-lg font-bold">{profileData.following_count}</div>
                <div className="text-sm text-muted-foreground">{t("Following")}</div>
              </div>
              <div>
                <div className="text-lg font-bold">{profileData.followers_count}</div>
                <div className="text-sm text-muted-foreground">{t("Followers")}</div>
              </div>
              <div>
                <div className="text-lg font-bold">{profileData.projects_count}</div>
                <div className="text-sm text-muted-foreground">{t("Projects")}</div>
              </div>
            </div>
            <div className="flex flex-col space-y-2 items-start">
              <Link to={`/profile/${profileData.username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" />
                {t("Visit_Profile")}
              </Link>
              <Link to="/edit-profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
                {t("Edit_Profile")}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative overflow-hidden rounded-lg p-8 pb-32 spaceai">
        <div className="justify-center flex m-4">
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 0C4.69831 0 0 4.69831 0 10.5C0 16.3017 4.69831 21 10.5 21C16.3017 21 21 16.3017 21 10.5C21 4.69831 16.3017 0 10.5 0ZM13.1339 19.3912C13.9098 13.7176 5.60949 10.1939 1.73695 12.2583C6.27153 8.81288 11.4112 2.31356 9.21864 0.405763C10.5214 1.34542 11.6959 2.44881 12.9986 3.38847C14.7712 4.66983 16.679 5.75186 18.4302 7.05458C20.4803 8.57797 20.5231 8.63492 20.7651 8.97661C20.6868 8.91254 20.5871 8.81288 20.4946 8.79153C20.4447 8.77729 15.2054 9.49627 13.1268 19.3983L13.1339 19.3912Z" fill="white" />
          </svg>

        </div>
        <CardHeader className="relative z-10 p-0">
          <CardTitle className="text-sm font-bold">{t("spaceCard")}</CardTitle>{t("spaceCardDesc")}
        </CardHeader>
        <CardContent className="relative z-10 mt-4 p-0">
          <Button asChild className="w-full bg-white text-purple-800 hover:bg-gray-100 hover:no-underline">
            <Link to="/space-ai">{t("spaceCardBtn")}</Link>
          </Button>


        </CardContent>
        <svg width="303" height="135" viewBox="0 0 303 135" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 w-full translate-y-[80px]">
          <g filter="url(#filter0_f_277_113)">
            <path d="M88.5 100.129C44.1899 102.785 -15.1451 151.678 -29.6829 164.218C-31.8219 166.063 -33 168.741 -33 171.565V190.507C-33 196.077 -28.4483 200.574 -22.8782 200.506L328.763 196.223C333.319 196.168 337.261 193.04 338.351 188.616L348.615 146.957C350.604 138.881 342.362 131.856 334.602 134.848C308.93 144.748 262.202 160.652 227 160.629C170.592 160.593 144.807 96.754 88.5 100.129Z" fill="#D9D9D9" />
          </g>
          <defs>
            <filter id="filter0_f_277_113" x="-133" y="0" width="581.916" height="300.507" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_277_113" />
            </filter>
          </defs>
        </svg>
        <svg width="303" height="217" viewBox="0 0 303 217" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 w-full h-full translate-y-[70px]">
          <g filter="url(#filter0_f_2_39)">
            <path d="M157 138.733C66.934 140.502 -4.26656 20.4287 -63 88.7325C-109.375 142.664 -63 279.733 -63 279.733L361 268.233C361 268.233 422.562 186.814 376.5 138.733C320.286 80.0544 238.244 137.136 157 138.733Z" fill="#6805AF" />
          </g>
          <g filter="url(#filter1_f_2_39)">
            <path d="M88.5 182.232C44.1899 184.889 -15.1451 233.781 -29.6829 246.321C-31.8219 248.166 -33 250.844 -33 253.669V272.61C-33 278.18 -28.4483 282.677 -22.8782 282.609L328.763 278.326C333.319 278.271 337.261 275.143 338.351 270.719L348.615 229.06C350.604 220.985 342.362 213.959 334.602 216.951C308.93 226.851 262.202 242.755 227 242.732C170.592 242.696 144.807 178.857 88.5 182.232Z" fill="#D9D9D9" />
          </g>
          <defs>
            <filter id="filter0_f_2_39" x="-151.311" y="1.52588e-05" width="612.615" height="347.433" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="11.9" result="effect1_foregroundBlur_2_39" />
            </filter>
            <filter id="filter1_f_2_39" x="-133" y="82.1031" width="581.916" height="300.507" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_2_39" />
            </filter>
          </defs>
        </svg>
      </Card>
    </aside>
  );
}