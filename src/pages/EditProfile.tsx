
import React, { useRef, useState, useEffect } from "react";
import { Crop } from 'react-image-crop';
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/use-translation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import DeleteAccountModal from "@/components/ui-custom/DeleteAccountModal";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { getNotificationPreferences, upsertNotificationPreferences, NotificationPreferences } from "@/services/notificationPreferences.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "يجب أن يكون اسم العرض حرفين على الأقل.",
  }),
  username: z.string().min(2, {
    message: "يجب أن يكون اسم المستخدم حرفين على الأقل.",
  }).max(30, {
    message: "لا يمكن أن يتجاوز اسم المستخدم 30 حرفًا.",
  }).regex(/^[a-zA-Z0-9_]+$/, {
    message: "اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط بدون مسافات.",
  }),
  bio: z.string().max(160, {
    message: "لا يمكن أن تتجاوز السيرة الذاتية 160 حرفًا.",
  }).optional(),
  website: z.string().url({ message: "يرجى إدخال رابط صحيح." }).optional().or(z.literal("")),
  location: z.string().optional(),
  allowMessages: z.boolean().default(true),
});


type ProfileFormValues = z.infer<typeof profileFormSchema>;

const EditProfile = () => {
  const { t, isRtl } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState("");

  // Default values from user context
  const defaultValues: ProfileFormValues = {
    displayName: user?.displayName || "",
    username: user?.username || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
    allowMessages: user?.allowMessages !== false, // Default to true if not set
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  useEffect(() => {
    async function fetchPrefs() {
      if (user?.id) {
        setNotifLoading(true);
        const prefs = await getNotificationPreferences(user.id);
        setNotificationPrefs(
          prefs || {
            user_id: user.id,
            email_enabled: true,
            push_enabled: true,
            frequency: 'instant',
          }
        );
        setNotifLoading(false);
      }
    }
    fetchPrefs();
  }, [user?.id]);

  // Update form values when user data is available
  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        allowMessages: user.allowMessages !== false,
      });
    }
  }, [user, form]);

  async function handleNotifChange(changes: Partial<NotificationPreferences>) {
    if (!user?.id) return;
    setNotifSaving(true);
    const updated = { ...notificationPrefs, ...changes };
    setNotificationPrefs(updated as NotificationPreferences);
    await upsertNotificationPreferences(user.id, updated);
    setNotifSaving(false);
  }

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (crop) {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, 1);
      setCrop(newCrop);
    }
  };

  function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
  ) {
    return {
      x: 0,
      y: 0,
      width: mediaWidth,
      height: mediaHeight,
      unit: 'px',
    } as Crop;
  }

  async function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return Promise.reject('Canvas context not available');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }

  const handleAvatarChange = async () => {
    if (!completedCrop || !imgRef.current || !imgSrc || !user?.id) return;

    const file = await getCroppedImg(imgRef.current, completedCrop);
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = 'jpg'; // Default to jpg since we're converting to JPEG in getCroppedImg
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "تم تحديث الصورة الرمزية",
        description: "تم تحديث صورة ملفك الشخصي بنجاح.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل الصورة الرمزية. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    try {
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          display_name: data.displayName,
          bio: data.bio,
          website: data.website,
          location: data.location,
          allow_messages: data.allowMessages
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update user metadata in auth
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: data.displayName }
      });

      if (metadataError) throw metadataError;

      toast({
        title: "تم تحديث الملف الشخصي بنجاح",
        description: "تم تحديث معلومات ملفك الشخصي بنجاح.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "فشل التحديث",
        description: "فشل تحديث الملف الشخصي. يرجى التحقق من المعلومات والمحاولة مرة أخرى.",
        variant: "destructive",
        duration: 5000
      });
    }
  }

  async function handleDeleteAccount() {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      const now = new Date();
      const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const { error } = await supabase
        .from('profiles')
        .update({
          deleted_at: now.toISOString(),
          deletion_deadline: deadline.toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      toast({
        title: t("deleteAccount"),
        description: t("accountScheduledDeletion") + ' ' + deadline.toLocaleDateString(),
        variant: "default",
      });
      // Sign out the user
      await logout();
      // Optionally, redirect to home page
      navigate("/");
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorDeletingAccount") || "حدث خطأ أثناء حذف الحساب.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail) return;
    setIsEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({
        title: t("success"),
        description: t("emailChanged") || "Email updated successfully.",
        variant: "default",
      });
      setIsEmailModalOpen(false);
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorUpdatingEmail") || "Failed to update email.",
        variant: "destructive",
      });
    } finally {
      setIsEmailSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword) return;
    setIsPasswordSaving(true);
    try {
      // Re-authenticate user with old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: oldPassword,
      });
      if (signInError) throw new Error(t("incorrectCurrentPassword") || "Current password is incorrect.");
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({
        title: t("success"),
        description: t("passwordChanged") || "Password updated successfully.",
        variant: "default",
      });
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("errorUpdatingPassword") || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordSaving(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("editProfile")}</h1>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="rtl:flex-row-reverse rtl:space-x-reverse">
            <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
            <TabsTrigger value="account">{t("accountSettings")}</TabsTrigger>
            <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile")}</CardTitle>
                <CardDescription>{t("editProfile")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-8 rtl:flex-row-reverse rtl:space-x-reverse">
                      <div className="flex-shrink-0 flex flex-col items-center justify-center space-y-3">
                        <Avatar className="h-24 w-24">
                          <AvatarImage
                            src={user?.avatar}
                            style={{ objectFit: 'cover' }}
                          />
                          <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={onSelectFile}
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="rtl:w-full"
                        >
                          {isUploading ? t("uploading") : t("changeAvatar")}
                        </Button>
                      </div>

                      <div className="flex-1 space-y-4" dir={isRtl ? "rtl" : "ltr"}>
                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex justify-start">{t("displayName")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("displayName")} {...field} className="rtl:text-right" />
                              </FormControl>
                              <FormDescription className="rtl:text-right">
                                {t("displayNameDesc")}
                              </FormDescription>
                              <FormMessage className="rtl:text-right" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="rtl:text-right">{t("username")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("username")} {...field} className="rtl:text-right" />
                              </FormControl>
                              <FormDescription className="rtl:text-right">
                                {t("usernameDesc")}
                              </FormDescription>
                              <FormMessage className="rtl:text-right" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex align-start">{t("bio")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("bio")}
                              className="resize-none rtl:text-right"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="rtl:text-right">
                            {t("bioDesc")}
                          </FormDescription>
                          <FormMessage className="rtl:text-right" />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="rtl:text-right">{t("website")}</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} className="rtl:text-right" />
                            </FormControl>
                            <FormMessage className="rtl:text-right" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="rtl:text-right">{t("location")}</FormLabel>
                            <FormControl>
                              <Input placeholder="Riyadh, Saudi Arabia" {...field} className="rtl:text-right" />
                            </FormControl>
                            <FormMessage className="rtl:text-right" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end rtl:justify-start">
                      <Button type="submit" className="rtl:w-auto">{t("save")}</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t("accountSettings")}</CardTitle>
                <CardDescription>{t("accountSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 rtl:text-right">
                {/* Email Change Section */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">{t("emailSettings")}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{t("emailSettingsDesc")}</p>
                  <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30 dark:bg-muted/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <p className="font-medium text-foreground dark:text-white">{user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("currentEmail")}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsEmailModalOpen(true)}>
                      {t("changeEmail")}
                    </Button>
                  </div>
                </div>
                <Separator />
                {/* Password Change Section */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">{t("passwordSettings")}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{t("passwordSettingsDesc")}</p>
                  <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30 dark:bg-muted/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <p className="font-medium text-foreground dark:text-white">********</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("currentPassword")}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
                      {t("changePassword")}
                    </Button>
                  </div>
                </div>
                <Separator />
                {/* Direct Message Settings */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">{t("messageSettings")}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{t("messageSettingsDesc")}</p>
                  <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30 dark:bg-muted/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-medium text-foreground dark:text-white">{t("allowDirectMessages")}</span>
                      <div className="text-xs text-muted-foreground mt-1">{t("allowDirectMessagesDesc")}</div>
                    </div>
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="allowMessages"
                        render={({ field }) => (
                          <FormItem className="m-0 p-0 border-0 shadow-none flex flex-row items-center justify-end">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </Form>
                  </div>
                </div>
                <Separator />
                {/* Account Deletion */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-destructive mb-1">{t("dangerZone")}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{t("dangerZoneDesc")}</p>
                  <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border border-destructive/40 bg-destructive/5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="font-medium text-destructive">{t("deleteAccount")}</span>
                      <div className="text-xs text-muted-foreground mt-1">{t("deleteAccountDesc")}</div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      {t("deleteAccount")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications")}</CardTitle>
                <CardDescription>{t("manageNotificationPrefs") || "إدارة تفضيلات الإشعارات الخاصة بك."}</CardDescription>
              </CardHeader>
              <CardContent>
                {notifLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="animate-spin h-5 w-5 border-2 border-t-transparent border-muted rounded-full"></span>
                    {t("loading") || "جاري التحميل..."}
                  </div>
                ) : notificationPrefs && (
                  <form className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className={`flex items-center justify-between p-4 rounded-lg border bg-muted/30 dark:bg-muted/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <span className="font-medium text-foreground dark:text-white">{t("emailNotifications") || "إشعارات البريد الإلكتروني"}</span>
                          <div className="text-xs text-muted-foreground mt-1">{t("emailNotificationsDesc") || "ستتلقى إشعارات عبر البريد الإلكتروني للأحداث المهمة."}</div>
                        </div>
                        <Switch
                          checked={notificationPrefs.email_enabled}
                          onCheckedChange={v => handleNotifChange({ email_enabled: v })}
                          disabled={notifSaving}
                        />
                      </div>
                      <div className={`flex items-center justify-between p-4 rounded-lg border bg-muted/30 dark:bg-muted/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <span className="font-medium text-foreground dark:text-white">{t("pushNotifications") || "إشعارات الدفع"}</span>
                          <div className="text-xs text-muted-foreground mt-1">{t("pushNotificationsDesc") || "ستتلقى إشعارات فورية على جهازك."}</div>
                        </div>
                        <Switch
                          checked={notificationPrefs.push_enabled}
                          onCheckedChange={v => handleNotifChange({ push_enabled: v })}
                          disabled={notifSaving}
                        />
                      </div>
                      <div className={`flex items-center justify-between p-4 rounded-lg border bg-muted/30 dark:bg-muted/60 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <span className="font-medium text-foreground dark:text-white">{t("notificationFrequency") || "تكرار الإشعارات"}</span>
                          <div className="text-xs text-muted-foreground mt-1">{t("notificationFrequencyDesc") || "اختر عدد مرات تلقي الإشعارات."}</div>
                        </div>
                        <select
                          className="border rounded px-3 py-2 bg-background dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                          value={notificationPrefs.frequency}
                          onChange={e => handleNotifChange({ frequency: e.target.value })}
                          disabled={notifSaving}
                        >
                          <option value="instant">{t("instant") || "فوري"}</option>
                          <option value="daily">{t("daily") || "يومي"}</option>
                          <option value="weekly">{t("weekly") || "أسبوعي"}</option>
                        </select>
                      </div>
                    </div>
                    {notifSaving && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-muted rounded-full"></span>
                        {t("saving") || "جاري الحفظ..."}
                      </div>
                    )}
                    <div className={`mt-4 p-3 rounded bg-muted/40 dark:bg-muted/70 text-xs ${isRtl ? 'text-right' : 'text-left'} text-muted-foreground border-l-4 border-primary`}>
                      {isRtl
                        ? "عند إيقاف إشعارات الدفع أو البريد الإلكتروني هنا، لن تصلك هذه الإشعارات من المنصة بعد الآن."
                        : "Turning off push or email notifications here will immediately stop those types of notifications from being sent to you."}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changeEmail")}</DialogTitle>
            <DialogDescription>{t("emailSettingsDesc")}</DialogDescription>
          </DialogHeader>
          <UiInput
            type="email"
            placeholder={t("emailAddress") || "New Email"}
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            disabled={isEmailSaving}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} className="rtl:ml-2">{t("cancel")}</Button>
            <Button onClick={handleChangeEmail} disabled={isEmailSaving || !newEmail}>
              {isEmailSaving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changePassword")}</DialogTitle>
            <DialogDescription>{t("passwordSettingsDesc")}</DialogDescription>
          </DialogHeader>
          <UiInput
            type="password"
            placeholder={t("currentPassword") || "Current Password"}
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            disabled={isPasswordSaving}
            className="mb-2"
          />
          <UiInput
            type="password"
            placeholder={t("password") || "New Password"}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            disabled={isPasswordSaving}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleChangePassword} disabled={isPasswordSaving || !oldPassword || !newPassword}>
              {isPasswordSaving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EditProfile;

