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
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("site");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isRtl } = useTranslation();
  
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
      });
    }
  }, [settings, isLoading, form]);
  
  // Handle form submission
  const onSubmit = (values: SettingsFormValues) => {
    updateSettingsMutation.mutate(values);
  };
  
  return (
          <Card>
            <CardHeader>
        <CardTitle>{isRtl ? "إعدادات النظام" : "System Settings"}</CardTitle>
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
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 md:grid-cols-6">
                  <TabsTrigger value="site">
                    {isRtl ? "إعدادات الموقع" : "Site Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="seo">
                    {isRtl ? "إعدادات SEO" : "SEO Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="social">
                    {isRtl ? "وسائل التواصل الاجتماعي" : "Social Media"}
                  </TabsTrigger>
                  <TabsTrigger value="smtp">
                    {isRtl ? "إعدادات البريد الإلكتروني" : "Email Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    {isRtl ? "إعدادات الإشعارات" : "Notification Settings"}
                  </TabsTrigger>
                  <TabsTrigger value="optimization">
                    {isRtl ? "تحسين الأداء" : "Optimization"}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="site" className="space-y-4 pt-4">
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
                
                <TabsContent value="seo" className="space-y-4 pt-4">
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
                
                <TabsContent value="social" className="space-y-4 pt-4">
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
                
                <TabsContent value="smtp" className="space-y-4 pt-4">
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
                
                <TabsContent value="notifications" className="space-y-4 pt-4">
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
                          <input
                            type="checkbox"
                              checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
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
                          <input
                            type="checkbox"
                              checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
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
                    
                <TabsContent value="optimization" className="space-y-4 pt-4">
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
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
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
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
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
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
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
              </Tabs>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending
                    ? (isRtl ? "جاري الحفظ..." : "Saving...")
                    : (isRtl ? "حفظ الإعدادات" : "Save Settings")}
                  </Button>
              </div>
                </form>
              </Form>
        )}
            </CardContent>
          </Card>
  );
}
