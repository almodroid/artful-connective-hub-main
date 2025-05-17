
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

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "يجب أن يكون اسم العرض حرفين على الأقل.",
  }),
  username: z.string().min(2, {
    message: "يجب أن يكون اسم المستخدم حرفين على الأقل.",
  }).max(30, {
    message: "لا يمكن أن يتجاوز اسم المستخدم 30 حرفًا.",
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
                              <Input placeholder="Dubai, UAE" {...field} className="rtl:text-right" />
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
              <CardContent className="space-y-4 rtl:text-right">
                <div className="space-y-6">
                  {/* Email Change Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t("emailSettings")}</h3>
                    <p className="text-sm text-muted-foreground">{t("emailSettingsDesc")}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">{t("currentEmail")}</p>
                      </div>
                      <Button variant="outline" onClick={() => toast({
                        title: t("comingSoon"),
                        description: t("featureComingSoon"),
                      })}>
                        {t("changeEmail")}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Password Change Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t("passwordSettings")}</h3>
                    <p className="text-sm text-muted-foreground">{t("passwordSettingsDesc")}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">********</p>
                        <p className="text-sm text-muted-foreground">{t("currentPassword")}</p>
                      </div>
                      <Button variant="outline" onClick={() => toast({
                        title: t("comingSoon"),
                        description: t("featureComingSoon"),
                      })}>
                        {t("changePassword")}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Direct Message Settings */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t("messageSettings")}</h3>
                    <p className="text-sm text-muted-foreground">{t("messageSettingsDesc")}</p>
                    <Form {...form}>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <FormField
                          control={form.control}
                          name="allowMessages"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>{t("allowDirectMessages")}</FormLabel>
                                <FormDescription>
                                  {t("allowDirectMessagesDesc")}
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
                      </div>
                    </Form>
                  </div>
                  
                  <Separator />
                  
                  {/* Account Deletion */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t("dangerZone")}</h3>
                    <p className="text-sm text-muted-foreground">{t("dangerZoneDesc")}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">{t("deleteAccount")}</p>
                        <p className="text-sm text-muted-foreground">{t("deleteAccountDesc")}</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsDeleteModalOpen(true)}
                      >
                        {t("deleteAccount")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>الإشعارات</CardTitle>
                <CardDescription>إدارة تفضيلات الإشعارات الخاصة بك.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">إعدادات الإشعارات قريباً.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EditProfile;
