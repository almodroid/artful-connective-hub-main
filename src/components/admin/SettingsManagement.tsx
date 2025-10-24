import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/use-translation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Mail, Bell, Zap, Settings as SettingsIcon, Eye, Hash, Link as LinkIcon, Database, Cpu, RefreshCcw } from "lucide-react";
import { setAIEnabled, setAIUnlimited } from "@/services/admin.service";

// Define the settings schema
const settingsSchema = z.object({
  // Site settings
  site_name: z.string().min(1, "Site name is required"),
  site_description: z.string().min(1, "Site description is required"),
  site_logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  site_favicon: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  
  // SEO settings
  meta_title: z.string().min(1, "Meta title is required"),
  meta_description: z.string().min(1, "Meta description is required"),
  meta_keywords: z.string().optional(),
  google_analytics_id: z.string().optional(),
  
  // Social media settings
  facebook_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitter_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  
  // SMTP settings
  smtp_host: z.string().min(1, "SMTP host is required"),
  smtp_port: z.string().min(1, "SMTP port is required"),
  smtp_user: z.string().min(1, "SMTP username is required"),
  smtp_password: z.string().min(1, "SMTP password is required"),
  smtp_from_email: z.string().email("Must be a valid email"),
  smtp_from_name: z.string().min(1, "From name is required"),
  
  // Notification settings
  enable_email_notifications: z.boolean().default(true),
  enable_push_notifications: z.boolean().default(true),
  notification_frequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
  
  // Optimization settings
  enable_caching: z.boolean().default(true),
  enable_compression: z.boolean().default(true),
  enable_lazy_loading: z.boolean().default(true),
  max_upload_size: z.string().min(1, "Max upload size is required"),
  // AI settings
  ai_enabled: z.boolean().default(true),
  ai_daily_limit: z.string().min(1, "AI daily limit is required"),
  // Google Ads settings
  ads_enabled: z.boolean().default(false),
  adsense_publisher_id: z.string().optional(),
  adsense_post_slot: z.string().optional(),
  adsense_reel_slot: z.string().optional(),
  adsense_project_slot: z.string().optional(),
  adsense_script: z.string().optional(),
  homepage_feed: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("site");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isRtl } = useTranslation();
  const [unlimitedAI, setUnlimitedAI] = useState(false);
  
  // Initialize form with default values
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_name: "",
      site_description: "",
      site_logo: "",
      site_favicon: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      google_analytics_id: "",
      facebook_url: "",
      twitter_url: "",
      instagram_url: "",
      linkedin_url: "",
      smtp_host: "",
      smtp_port: "",
      smtp_user: "",
      smtp_password: "",
      smtp_from_email: "",
      smtp_from_name: "",
      enable_email_notifications: true,
      enable_push_notifications: true,
      notification_frequency: "immediate",
      enable_caching: true,
      enable_compression: true,
      enable_lazy_loading: true,
      max_upload_size: "5",
      ai_enabled: true,
      ai_daily_limit: "20",
      // Google Ads
      ads_enabled: false,
      adsense_publisher_id: "",
      adsense_post_slot: "",
      adsense_reel_slot: "",
      adsense_project_slot: "",
      adsense_script: "",
      homepage_feed: "",
    },
  });
  
  // Fetch settings from the database
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      try {
        // First, check if the settings table exists, if not create it
        const { error: tableCheckError } = await supabase
          .from('settings' as any)
          .select('key')
          .limit(1);
        
        if (tableCheckError && tableCheckError.code === '42P01') {
          // Table doesn't exist, create it
          const { error: createTableError } = await supabase.rpc('create_settings_table' as any);
          
          if (createTableError) {
            console.error("Error creating settings table:", createTableError);
            throw createTableError;
          }
          
          // Insert default settings
          const defaultSettings = [
            { key: 'site_name', value: 'Artful Connective Hub', description: 'The name of the site', category: 'site' },
            { key: 'site_description', value: 'A platform for artists to connect and share their work', description: 'The description of the site', category: 'site' },
            { key: 'site_logo', value: '', description: 'The logo of the site', category: 'site' },
            { key: 'site_favicon', value: '', description: 'The favicon of the site', category: 'site' },
            { key: 'meta_title', value: 'Artful Connective Hub - Artist Community', description: 'Meta title for SEO', category: 'seo' },
            { key: 'meta_description', value: 'Join the Artful Connective Hub community to connect with artists, share your work, and discover new art.', description: 'Meta description for SEO', category: 'seo' },
            { key: 'meta_keywords', value: 'art, artists, community, gallery, portfolio', description: 'Meta keywords for SEO', category: 'seo' },
            { key: 'google_analytics_id', value: '', description: 'Google Analytics ID', category: 'seo' },
            { key: 'facebook_url', value: '', description: 'Facebook URL', category: 'social' },
            { key: 'twitter_url', value: '', description: 'Twitter URL', category: 'social' },
            { key: 'instagram_url', value: '', description: 'Instagram URL', category: 'social' },
            { key: 'linkedin_url', value: '', description: 'LinkedIn URL', category: 'social' },
            { key: 'smtp_host', value: '', description: 'SMTP server host', category: 'smtp' },
            { key: 'smtp_port', value: '', description: 'SMTP server port', category: 'smtp' },
            { key: 'smtp_user', value: '', description: 'SMTP username', category: 'smtp' },
            { key: 'smtp_password', value: '', description: 'SMTP password', category: 'smtp' },
            { key: 'smtp_from_email', value: '', description: 'SMTP from email', category: 'smtp' },
            { key: 'smtp_from_name', value: '', description: 'SMTP from name', category: 'smtp' },
            { key: 'enable_email_notifications', value: 'true', description: 'Enable email notifications', category: 'notifications' },
            { key: 'enable_push_notifications', value: 'true', description: 'Enable push notifications', category: 'notifications' },
            { key: 'notification_frequency', value: 'immediate', description: 'Notification frequency', category: 'notifications' },
            { key: 'enable_caching', value: 'true', description: 'Enable caching', category: 'optimization' },
            { key: 'enable_compression', value: 'true', description: 'Enable compression', category: 'optimization' },
            { key: 'enable_lazy_loading', value: 'true', description: 'Enable lazy loading', category: 'optimization' },
            { key: 'max_upload_size', value: '5', description: 'Maximum upload size in MB', category: 'optimization' },
            { key: 'ai_enabled', value: 'true', description: 'Enable Space AI', category: 'ai' },
            { key: 'ai_daily_limit', value: '20', description: 'Daily AI Request Limit', category: 'ai' },
            { key: 'ads_enabled', value: 'false', description: 'Enable Google Ads', category: 'ads' },
            { key: 'adsense_publisher_id', value: '', description: 'AdSense Publisher ID', category: 'ads' },
            { key: 'adsense_post_slot', value: '', description: 'Ad Slot ID for Posts', category: 'ads' },
            { key: 'adsense_reel_slot', value: '', description: 'Ad Slot ID for Reels', category: 'ads' },
            { key: 'adsense_project_slot', value: '', description: 'Ad Slot ID for Project Details', category: 'ads' },
            { key: 'adsense_script', value: '', description: 'Custom AdSense Script', category: 'ads' },
            { key: 'homepage_feed', value: '', description: 'Ad Slot ID for Homepage Feed', category: 'ads' },
          ];
          
          const { error: insertError } = await supabase
            .from('settings' as any)
            .insert(defaultSettings as any);
          
          if (insertError) {
            console.error("Error inserting default settings:", insertError);
            throw insertError;
          }
          
          // Return default settings
          return defaultSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as Record<string, string>);
        }
        
        // Get all settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings' as any)
          .select('*');
        
        if (settingsError) {
          console.error("Error fetching settings:", settingsError);
          toast.error(isRtl ? "حدث خطأ أثناء جلب الإعدادات" : "Error fetching settings");
          throw settingsError;
        }
        
        // Transform settings data into a flat object
        const settingsObject = (settingsData as any[]).reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);
        
        return settingsObject;
      } catch (error) {
        console.error("Error in settings query:", error);
        toast.error(isRtl ? "حدث خطأ أثناء جلب الإعدادات" : "Error fetching settings");
        setError(isRtl ? "حدث خطأ أثناء جلب الإعدادات" : "Error fetching settings");
        throw error;
      }
    },
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      try {
        // Transform form values into settings records
        const settingsRecords = Object.entries(values).map(([key, value]) => ({
          key,
          value: String(value),
          updated_at: new Date().toISOString()
        }));
        
        // Update each setting
        const updatePromises = settingsRecords.map(record => 
          supabase
            .from('settings' as any)
            .update({ value: record.value, updated_at: record.updated_at })
            .eq('key', record.key)
        );
        
        const results = await Promise.all(updatePromises);
        
        // Check for errors
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          console.error("Error updating settings:", errors);
          throw new Error("Failed to update settings");
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error in update settings mutation:", error);
        setError(isRtl ? "حدث خطأ أثناء تحديث الإعدادات" : "Error updating settings");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(isRtl ? "تم تحديث الإعدادات بنجاح" : "Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error(isRtl ? "حدث خطأ أثناء تحديث الإعدادات" : "Error updating settings");
    }
  });
  
  // Set form values when settings are loaded
  useEffect(() => {
    if (settings && !isLoading) {
      const isUnlimited = settings.ai_daily_limit === 'unlimited';
      setUnlimitedAI(isUnlimited);
      form.reset({
        site_name: settings.site_name || "",
        site_description: settings.site_description || "",
        site_logo: settings.site_logo || "",
        site_favicon: settings.site_favicon || "",
        meta_title: settings.meta_title || "",
        meta_description: settings.meta_description || "",
        meta_keywords: settings.meta_keywords || "",
        google_analytics_id: settings.google_analytics_id || "",
        facebook_url: settings.facebook_url || "",
        twitter_url: settings.twitter_url || "",
        instagram_url: settings.instagram_url || "",
        linkedin_url: settings.linkedin_url || "",
        smtp_host: settings.smtp_host || "",
        smtp_port: settings.smtp_port || "",
        smtp_user: settings.smtp_user || "",
        smtp_password: settings.smtp_password || "",
        smtp_from_email: settings.smtp_from_email || "",
        smtp_from_name: settings.smtp_from_name || "",
        enable_email_notifications: settings.enable_email_notifications === "true",
        enable_push_notifications: settings.enable_push_notifications === "true",
        notification_frequency: (settings.notification_frequency as "immediate" | "daily" | "weekly") || "immediate",
        enable_caching: settings.enable_caching === "true",
        enable_compression: settings.enable_compression === "true",
        enable_lazy_loading: settings.enable_lazy_loading === "true",
        max_upload_size: settings.max_upload_size || "5",
        ai_enabled: settings.ai_enabled === "true",
        ai_daily_limit: isUnlimited ? "100" : settings.ai_daily_limit || "20",
        // Google Ads
        ads_enabled: settings.ads_enabled === "true",
        adsense_publisher_id: settings.adsense_publisher_id || "",
        adsense_post_slot: settings.adsense_post_slot || "",
        adsense_reel_slot: settings.adsense_reel_slot || "",
        adsense_project_slot: settings.adsense_project_slot || "",
        adsense_script: settings.adsense_script || "",
        homepage_feed: settings.homepage_feed || "",
      });
    }
  }, [settings, isLoading, form]);
  
  // Handle form submission
  const onSubmit = (values: SettingsFormValues) => {
    const submitValues = { ...values };
    if (unlimitedAI) {
      submitValues.ai_daily_limit = 'unlimited';
    }
    updateSettingsMutation.mutate(submitValues);
  };
  
  // Default values for reset
  const defaultSectionValues = {
    site: {
      site_name: "",
      site_description: "",
      site_logo: "",
      site_favicon: "",
    },
    seo: {
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      google_analytics_id: "",
    },
    social: {
      facebook_url: "",
      twitter_url: "",
      instagram_url: "",
      linkedin_url: "",
    },
    smtp: {
      smtp_host: "",
      smtp_port: "",
      smtp_user: "",
      smtp_password: "",
      smtp_from_email: "",
      smtp_from_name: "",
    },
    notifications: {
      enable_email_notifications: true,
      enable_push_notifications: true,
      notification_frequency: "immediate" as "immediate" | "daily" | "weekly",
    },
    optimization: {
      enable_caching: true,
      enable_compression: true,
      enable_lazy_loading: true,
      max_upload_size: "5",
    },
    ai: {
      ai_enabled: true,
      ai_daily_limit: "20",
    },
    ads: {
      ads_enabled: false,
      adsense_publisher_id: "",
      adsense_post_slot: "",
      adsense_reel_slot: "",
      adsense_project_slot: "",
      adsense_script: "",
    },
  };
  
  return (
          <Card>
            <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <SettingsIcon className="h-6 w-6" />
          {isRtl ? "إعدادات النظام" : "System Settings"}
        </CardTitle>
              <CardDescription>
          {isRtl 
            ? "تكوين إعدادات الموقع وإعدادات البريد الإلكتروني وإعدادات الإشعارات" 
            : "Configure site settings, email settings, and notification settings"}
              </CardDescription>
            </CardHeader>
            <CardContent>
        {error ? (
          <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setError(null);
                queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
              }}
            >
              {isRtl ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        ) :
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-4">
                  <TabsTrigger value="site">
                    <Globe className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "إعدادات الموقع" : "Site Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="seo">
                    <Eye className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "إعدادات SEO" : "SEO Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="social">
                    <Hash className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "وسائل التواصل الاجتماعي" : "Social Media"}
                  </TabsTrigger>
                  <TabsTrigger value="smtp">
                    <Mail className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "إعدادات البريد الإلكتروني" : "Email Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "إعدادات الإشعارات" : "Notification Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="optimization">
                    <Zap className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "تحسين الأداء" : "Optimization"}
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    <Cpu className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "إعدادات الذكاء الاصطناعي" : "AI Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="ads">
                    <SettingsIcon className="h-4 w-4 mr-1 inline" />
                    {isRtl ? "إعلانات Google" : "Google Ads"}
                  </TabsTrigger>
                </TabsList>
                {/* Site Settings Section */}
                <TabsContent value="site" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "إعدادات الموقع" : "Site Settings"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.site })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="site_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "اسم الموقع" : "Site Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "اسم موقعك الذي سيظهر في المتصفح وفي العناوين" : "The name of your site that will appear in the browser and in titles"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="site_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "وصف الموقع" : "Site Description"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "وصف مختصر لموقعك" : "A brief description of your site"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="site_logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "شعار الموقع" : "Site Logo"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "رابط شعار موقعك" : "URL to your site logo"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="site_favicon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "أيقونة الموقع" : "Site Favicon"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "رابط أيقونة موقعك" : "URL to your site favicon"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                {/* SEO Section */}
                <TabsContent value="seo" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "إعدادات SEO" : "SEO Settings"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.seo })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="meta_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "عنوان Meta" : "Meta Title"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "عنوان الصفحة الذي يظهر في نتائج البحث" : "The title that appears in search results"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="meta_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "وصف Meta" : "Meta Description"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "وصف مختصر يظهر في نتائج البحث" : "A brief description that appears in search results"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="meta_keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "كلمات مفتاحية" : "Meta Keywords"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "كلمات مفتاحية مفصولة بفواصل" : "Keywords separated by commas"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="google_analytics_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "معرف Google Analytics" : "Google Analytics ID"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "معرف تتبع Google Analytics (مثال: UA-XXXXXXXXX-X)" : "Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                {/* Social Section */}
                <TabsContent value="social" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "وسائل التواصل الاجتماعي" : "Social Media"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.social })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="facebook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "رابط فيسبوك" : "Facebook URL"}</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://facebook.com/your-page" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "رابط صفحة فيسبوك الرسمية" : "Official Facebook page URL"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="twitter_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "رابط تويتر" : "Twitter URL"}</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://twitter.com/your-handle" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "رابط حساب تويتر الرسمي" : "Official Twitter account URL"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="instagram_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "رابط انستغرام" : "Instagram URL"}</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://instagram.com/your-profile" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "رابط حساب انستغرام الرسمي" : "Official Instagram account URL"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "رابط لينكد إن" : "LinkedIn URL"}</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://linkedin.com/company/your-company" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "رابط صفحة لينكد إن الرسمية" : "Official LinkedIn company page URL"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                {/* SMTP Section */}
                <TabsContent value="smtp" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "إعدادات البريد الإلكتروني" : "Email Settings"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.smtp })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="smtp_host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "خادم SMTP" : "SMTP Host"}</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "عنوان خادم SMTP" : "SMTP server address"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="smtp_port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "منفذ SMTP" : "SMTP Port"}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="587" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "منفذ خادم SMTP" : "SMTP server port"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                    <FormField
                    control={form.control}
                    name="smtp_user"
                      render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "اسم مستخدم SMTP" : "SMTP Username"}</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                            <FormDescription>
                          {isRtl ? "اسم مستخدم خادم SMTP" : "SMTP server username"}
                            </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="smtp_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "كلمة مرور SMTP" : "SMTP Password"}</FormLabel>
                          <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "كلمة مرور خادم SMTP" : "SMTP server password"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="smtp_from_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "البريد الإلكتروني المرسل" : "From Email"}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="noreply@example.com" {...field} />
                          </FormControl>
                        <FormDescription>
                          {isRtl ? "عنوان البريد الإلكتروني المرسل" : "Sender email address"}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="smtp_from_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "اسم المرسل" : "From Name"}</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Site Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "اسم المرسل في رسائل البريد الإلكتروني" : "Sender name in email messages"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                {/* Notifications Section */}
                <TabsContent value="notifications" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "إعدادات الإشعارات" : "Notification Settings"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.notifications })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="enable_email_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            {isRtl ? "تفعيل إشعارات البريد الإلكتروني" : "Enable Email Notifications"}
                            </FormLabel>
                            <FormDescription>
                            {isRtl ? "إرسال إشعارات عبر البريد الإلكتروني" : "Send notifications via email"}
                            </FormDescription>
                          </div>
                          <FormControl>
                          <Switch
                              checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="enable_push_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            {isRtl ? "تفعيل الإشعارات المباشرة" : "Enable Push Notifications"}
                            </FormLabel>
                            <FormDescription>
                            {isRtl ? "إرسال إشعارات مباشرة إلى المتصفح" : "Send push notifications to browser"}
                            </FormDescription>
                          </div>
                          <FormControl>
                          <Switch
                              checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  
                    <FormField
                    control={form.control}
                    name="notification_frequency"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel>{isRtl ? "تكرار الإشعارات" : "Notification Frequency"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isRtl ? "اختر التكرار" : "Select frequency"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="instant">{isRtl ? "فوري" : "Instant"}</SelectItem>
                            <SelectItem value="daily">{isRtl ? "يومي" : "Daily"}</SelectItem>
                            <SelectItem value="weekly">{isRtl ? "أسبوعي" : "Weekly"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isRtl ? "عدد مرات إرسال الإشعارات" : "How often to send notifications"}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                      )}
                    />
                </TabsContent>
                {/* Optimization Section */}
                <TabsContent value="optimization" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "تحسين الأداء" : "Optimization"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.optimization })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                    <FormField
                    control={form.control}
                    name="enable_caching"
                      render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {isRtl ? "تفعيل التخزين المؤقت" : "Enable Caching"}
                          </FormLabel>
                          <FormDescription>
                            {isRtl ? "تحسين الأداء عن طريق تخزين البيانات مؤقتًا" : "Improve performance by caching data"}
                          </FormDescription>
                        </div>
                          <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  
                    <FormField
                    control={form.control}
                    name="enable_compression"
                      render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {isRtl ? "تفعيل ضغط البيانات" : "Enable Compression"}
                          </FormLabel>
                          <FormDescription>
                            {isRtl ? "تقليل حجم البيانات المرسلة" : "Reduce the size of data being sent"}
                          </FormDescription>
                        </div>
                          <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="enable_lazy_loading"
                      render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {isRtl ? "تفعيل التحميل الكسول" : "Enable Lazy Loading"}
                          </FormLabel>
                          <FormDescription>
                            {isRtl ? "تحميل الصور فقط عند الحاجة إليها" : "Load images only when they are needed"}
                          </FormDescription>
                        </div>
                          <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="max_upload_size"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel>{isRtl ? "الحد الأقصى لحجم التحميل" : "Max Upload Size"}</FormLabel>
                          <FormControl>
                          <Input type="number" min="1" max="50" {...field} />
                          </FormControl>
                        <FormDescription>
                          {isRtl ? "الحد الأقصى لحجم الملفات التي يمكن تحميلها (بالميجابايت)" : "Maximum size of files that can be uploaded (in MB)"}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                      )}
                    />
                </TabsContent>
                {/* AI Section */}
                <TabsContent value="ai" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "إعدادات الذكاء الاصطناعي" : "AI Settings"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.ai })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
              <Separator />
                  <FormField
                    control={form.control}
                    name="ai_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {isRtl ? "تفعيل Space AI" : "Enable Space AI"}
                          </FormLabel>
                          <FormDescription>
                            {isRtl ? "تمكين أو تعطيل ميزة الذكاء الاصطناعي للمستخدمين" : "Enable or disable the Space AI feature for users"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={async (checked) => {
                              field.onChange(checked);
                              try {
                                await setAIEnabled(checked);
                                toast.success(isRtl ? "تم تحديث حالة الذكاء الاصطناعي" : "AI feature status updated");
                              } catch (err) {
                                toast.error(isRtl ? "حدث خطأ أثناء تحديث حالة الذكاء الاصطناعي" : "Error updating AI feature status");
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {isRtl ? "طلبات غير محدودة" : "Unlimited AI Requests"}
                      </FormLabel>
                      <FormDescription>
                        {isRtl ? "تعطيل الحد اليومي لطلبات الذكاء الاصطناعي" : "Disable daily AI request limit for all users"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={unlimitedAI}
                        onCheckedChange={async (checked) => {
                          setUnlimitedAI(checked);
                          try {
                            await setAIUnlimited(checked, Number(form.getValues().ai_daily_limit) || 20);
                            toast.success(isRtl ? "تم تحديث حد الذكاء الاصطناعي" : "AI limit updated");
                          } catch (err) {
                            toast.error(isRtl ? "حدث خطأ أثناء تحديث حد الذكاء الاصطناعي" : "Error updating AI limit");
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="ai_daily_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "الحد اليومي لطلبات الذكاء الاصطناعي" : "Daily AI Request Limit"}</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="1000" {...field} disabled={unlimitedAI} />
                        </FormControl>
                        <FormDescription>
                          {isRtl ? "عدد الطلبات المسموح بها لكل مستخدم يومياً" : "Number of AI requests allowed per user per day"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                {/* Ads Section */}
                <TabsContent value="ads" className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{isRtl ? "إعلانات Google" : "Google Ads Settings"}</h2>
                    <Button type="button" size="icon" variant="ghost" className="ml-2" onClick={() => form.reset({ ...form.getValues(), ...defaultSectionValues.ads })} title={isRtl ? "إعادة الافتراضي" : "Reset to default"}><RefreshCcw className="h-4 w-4" /></Button>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="ads_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{isRtl ? "تفعيل الإعلانات" : "Enable Google Ads"}</FormLabel>
                          <FormDescription>{isRtl ? "تفعيل أو تعطيل إعلانات Google AdSense في التطبيق" : "Enable or disable Google AdSense ads in the app"}</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adsense_publisher_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "معرف الناشر (Publisher ID)" : "AdSense Publisher ID"}</FormLabel>
                        <FormControl>
                          <Input placeholder="ca-pub-xxxxxxxxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormDescription>{isRtl ? "معرف الناشر الخاص بحساب AdSense (مثال: ca-pub-xxxxxxxxxxxxxxxx)" : "Your AdSense publisher ID (e.g., ca-pub-xxxxxxxxxxxxxxxx)"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adsense_post_slot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "معرف الوحدة الإعلانية للمنشورات" : "Ad Slot ID for Posts"}</FormLabel>
                        <FormControl>
                          <Input placeholder="xxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormDescription>{isRtl ? "معرف الوحدة الإعلانية لعرض الإعلانات في صفحة المنشورات" : "Ad slot ID for displaying ads in post pages"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adsense_reel_slot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "معرف الوحدة الإعلانية للريلز" : "Ad Slot ID for Reels"}</FormLabel>
                        <FormControl>
                          <Input placeholder="xxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormDescription>{isRtl ? "معرف الوحدة الإعلانية لعرض الإعلانات في الريلز (الفيديوهات)" : "Ad slot ID for displaying ads in reels (videos)"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adsense_project_slot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "معرف الوحدة الإعلانية لصفحة المشروع" : "Ad Slot ID for Project Details"}</FormLabel>
                        <FormControl>
                          <Input placeholder="xxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormDescription>{isRtl ? "معرف الوحدة الإعلانية لعرض الإعلانات في صفحة تفاصيل المشروع" : "Ad slot ID for displaying ads in project details page"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adsense_script"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRtl ? "سكريبت مخصص (اختياري)" : "Custom AdSense Script (optional)"}</FormLabel>
                        <FormControl>
                          <Input placeholder="<script>...</script>" {...field} />
                        </FormControl>
                        <FormDescription>{isRtl ? "يمكنك إضافة سكريبت AdSense مخصص إذا لزم الأمر" : "You can add a custom AdSense script if needed"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              {/* Sticky Save Bar */}
              <div className="sticky bottom-0 left-0 w-full bg-background/80 py-4 px-2 flex justify-end border-t z-10">
                <Button type="submit" disabled={updateSettingsMutation.isPending} className="w-40">
                  {updateSettingsMutation.isPending
                    ? (isRtl ? "جاري الحفظ..." : "Saving...")
                    : (isRtl ? "حفظ الإعدادات" : "Save Settings")}
                  </Button>
              </div>
                </form>
              </Form>
        }
            </CardContent>
          </Card>
  );
}
