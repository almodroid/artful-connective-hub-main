import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";
type TranslationKey = string;

interface TranslationContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const translations = {
  en: {
    // Navigation
    home: "Home",
    explore: "Explore",
    projects: "Projects",
    notifications: "Notifications",
    noNotifications: "No notifications",
    profile: "Profile",
    settings: "Settings",
    admin: "Admin",
    adminPanel: "Admin Panel",
    login: "Login",
    register: "Register",
    logout: "Logout",
    
    // Common
    search: "Search",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    view: "View",
    loading: "Loading...",
    noResults: "No results found",
    seeAll: "See all",
    spaceArt: "Art Space",
    markAllAsRead: "Mark all as read",
    Report: "Report",
    Block: "Block",
    Unblock: "Unblock",
    Delete_Chat: "Delete Chat",
    view_profile: "View Profile",
    Edit: "Edit",
    Delete: "Delete",
    React: "React",

    //messages
    Messages: "Messages",
    messages: "messages",
    message: "message",
    messagesPlaceholder: "Type your message here...",
    send: "Send",
    newMessage: "New Message",
    noMessages: "No messages",
    Conversations: "Conversations",
    Send_message: "Send a message to start the conversation",
    No_messages: "No messages yet",
    You_cannot_send: "You cannot send messages to this user",
    Type_a_message: "Type a message...",
    You_cannot_send_blocked: "You cannot send messages to this user as they have been blocked",
    You_cannot_send_has_blocked_you:"You cannot send messages as this user has blocked you",
    
    // Home
    forYou: "For You",
    following: "Following",
    trending: "Trending",
    noFollowing: "You're not following anyone yet",
    startFollowingPrompt: "Follow other users to see their posts here",
    
    // Reels
    reels: "Reels",
    createReel: "Create Reel",
    
    // Profile
    displayName: "Display Name",
    displayNameDesc: "This is your public display name.",
    username: "Username",
    usernameDesc: "This is your unique username that appears in your profile URL.",
    bio: "Bio",
    bioDesc: "A brief description about yourself. Maximum 160 characters.",
    website: "Website",
    location: "Location",
    changeAvatar: "Change Avatar",
    uploading: "Uploading...",
    accountScheduledDeletion: "Your account is scheduled for deletion on",
    restoringAccount: "Restoring account...",
    editProfile: "Edit Profile",
    
    // Account
    accountSettings: "Account Settings",
    accountSettingsDesc: "Manage your account settings and preferences.",
    emailAddress: "Email Address",
    changeEmail: "Change Email",
    password: "Password",
    changePassword: "Change Password",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    deleteAccountDesc: "Delete your account and all your data. You have 30 days to restore your account before permanent deletion.",
    restoreAccount: "Restore Account",
    restoring: "Restoring...",
    accountRestored: "Account Restored",
    accountRestoredDesc: "Your account has been restored successfully.",
    restorationFailed: "Restoration Failed",
    restorationFailedDesc: "An error occurred while restoring your account. Please try again.",
    
    // Portfolio/Posts
    title: "Title",
    description: "Description",
    content: "Content",
    category: "Category",
    tags: "Tags",
    createPost: "Create Post",
    editPost: "Edit Post",
    deletePost: "Delete Post",
    createProject: "Create Project",
    editProject: "Edit Project",
    deleteProject: "Delete Project",
    createNewPost: "Create New Post",
    enterTitle: "Enter Post Title",
    enterDescription: "Enter Post Description",
    
    // Project details
    views: "Views",
    like: "Like",
    unlike: "Unlike",
    share: "Share",
    visitProject: "Visit Project",
    projectContent: "Project content",
    backToProjects: "Back to Projects",
    
    // Projects page
    projectsPage: "Projects",
    allProjects: "All Projects",
    searchProjects: "Search projects...",
    noProjectsYet: "No projects yet",
    beFirstToAdd: "Be the first to add a new project",
    addProject: "Add Project",
    tryDifferentSearch: "Try a different search term or filter",
    clearFilters: "Clear Filters",
    addProjectDetails: "Add your project details to share with the community",
    projectTitlePlaceholder: "Enter project title",
    projectDescriptionPlaceholder: "Describe your project",
    tagsPlaceholder: "Add tags (press Enter after each tag)",
    maxTagsInfo: "You can add up to 5 tags",
    externalLink: "External Link (optional)",
    projectImage: "Project Image",
    chooseImage: "Choose Image",
    removeImage: "Remove Image",
    createWithoutImage: "Create Without Image",
    
    // Misc
    error: "An error occurred",
    success: "Success!",

    //custom
    smileys_emotion: "Smileys & Emotion",
    people_body: "People & Body",
    objects: "Objects",
    symbols: "Symbols",
    Search_emojis: "Search emojis...",

    // Arter AI translations
    meetArter: "Meet Arter, your art and design AI assistant",
    arterDescription: "Get creative help with color palettes, design feedback, artistic techniques, and more.",
    askArter: "Ask Arter about design, art, or creative ideas...",
    clearChat: "Clear chat",
    meetSpaceAI: "Learn about Space AI, your smart assistant for art and design",
    spaceAIDescription: "Get creative help in color panels, design notes, technical techniques, and so on.",
    suggestColorPalette: "Suggest a color palette for a minimalist website",
    suggestDesignFeedback: "How can I improve my composition?",
    suggestCreativeSolution: "Creative ways to use negative space",
    suggestComposition: "Tips for better photo composition",
    arterMenuTitle: "Arter AI Menu",
    newChat: "New Chat",
    saveChat: "Save Chat",
    loadChat: "Load Chat",
    shareChat: "Share Chat",
    exportChat: "Export Chat",
    importChat: "Import Chat",
    chatHistory: "Chat History",
    clearHistory: "Clear History",
    savedConversations: "Saved Conversations",
    noSavedConversations: "No saved conversations yet",
    conversationTitle: "Conversation",
    deleteConversation: "Delete Conversation",
    loadConversation: "Load Conversation",
    saveCurrentChat: "Save Current Chat",
    lastSaved: "Last saved",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
    justNow: "just now",
    projectNotFound: "Project not found",
    errorLoadingProject: "Error loading project",
    loginToLikeProjects: "Please login to like projects",
    likeSuccess: "Project liked successfully",
    unlikeSuccess: "Project unliked successfully",
    errorUpdatingLike: "Error updating like status",
    projectUpdatedSuccess: "Project updated successfully",
    errorUpdatingProject: "Error updating project",
    projectDeletedSuccess: "Project deleted successfully",
    errorDeletingProject: "Error deleting project",
    enterProjectTitle: "Please enter a project title",
    saving: "Saving...",
    saveChanges: "Save Changes",
    deleting: "Deleting...",
    areYouSure: "Are you sure?",
    deleteProjectWarning: "This action cannot be undone. This will permanently delete your project.",
    imageSizeLimitError: "Image size should be less than 5MB",
    unsupportedFileType: "File type not supported. Please use JPG, PNG, GIF or WEBP",
    addToGallery: "Add to Gallery",
    projectPreview: "Project Preview",
    projectCoverImage: "Project Cover Image",
    projectGallery: "Project Gallery",
    tagsLimit: "You can add up to 5 tags",
    searchConversations: "Search conversations...",
    sortByNewest: "Sort by newest",
    sortByOldest: "Sort by oldest",
    sortByTitle: "Sort by title",
    noMatchingConversations: "No matching conversations found",
    addTag: "Add tag",
    removeTag: "Remove tag",
    filterByTag: "Filter by tag",
    continuingConversation: "Continuing from a previous conversation...",
    manageNotificationPrefs: "Manage your notification preferences.",
    emailNotifications: "Email Notifications",
    emailNotificationsDesc: "You will receive important updates via email.",
    pushNotifications: "Push Notifications",
    pushNotificationsDesc: "You will receive instant notifications on your device.",
    notificationFrequency: "Notification Frequency",
    notificationFrequencyDesc: "Choose how often you want to receive notifications.",
    instant: "Instant",
    daily: "Daily",
    weekly: "Weekly",
    emailSettings:"Email Settngs",
    emailSettingsDesc: "Manage your email address and how you receive notifications.",
    currentEmail: "Current Email",
    passwordSettings: "Password Settings",
    passwordSettingsDesc: "Change your password to keep your account secure.",
    currentPassword: "Current Password",
    messageSettings: "Message Settings",
    messageSettingsDesc: "Control who can send you direct messages.",
    allowDirectMessages: "Allow Direct Messages",
    allowDirectMessagesDesc: "Allow other users to send you direct messages.",
    dangerZoneDesc: "Delete your account and all your data. This action cannot be undone.",
    footerCopyright: "© 2025 Art Space. All rights reserved.",
    incorrectCurrentPassword: "The current password you entered is incorrect.",
    footerTitle: "Art Space",
    footerDescription: "A social art platform for artists and designers to showcase their work and connect with the art community.",
    footerLinksTitle: "Important Links",
    aboutUs: "About Us",
    contactUs: "Contact Us",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    forQuestions: "For inquiries and support",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    explore: "استكشاف",
    projects: "المشاريع",
    notifications: "الإشعارات",
    noNotifications: "لا توجد إشعارات",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    admin: "المشرف",
    adminPanel: "لوحة التحكم",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    
    // Common
    search: "بحث",
    submit: "إرسال",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    view: "عرض",
    loading: "جاري التحميل...",
    noResults: "لا توجد نتائج",
    seeAll: "عرض الكل",
    spaceArt: " اّرت سبيس",
    markAllAsRead: "تحديد الكل كمقروء",
    all: "الكل",
    new: "جديد",
    popular: "شائع",
    comments: "التعليقات",
    You: "أنت",
    Report: "ابلاغ",
    Block: "حظر",
    Unblock: "إلغاء الحظر",
    Delete_Chat: "حذف المحادثة",
    view_profile: "الملف الشخصي",
    Edit: "تعديل",
    Delete: "حذف",
    React: "تفاعل",
    
    //messages
    Messages: "الرسائل",
    messages: "الرسائل",
    message: "الرسالة",
    messagesPlaceholder: "اكتب رسالتك هنا...",
    send: "ارسال",
    newMessage: "رسالة جديدة",
    noMessages: "لا توجد رسائل",
    Conversations: "المحادثات",
    Send_message: "أرسل رسالة جديدة",
    No_messages: "لا توجد رسائل حتى الآن",
    Follow: "متابعة الفنان",
    Unfollow: "إلغاء المتابعة",
    followBack: "تابعك مرة أخرى",
    followBackDesc: "قم بتبعك مرة أخرى للوصول إلى المحتوى الخاص بك",
    followBackButton: "تابعك مرة أخرى",
    You_cannot_send: "لا يمكنك إرسال رسائل إلى هذا المستخدم",
    Type_a_message: "اكتب رسالة...",
    You_cannot_send_blocked: "لا يمكنك إرسال رسائل إلى هذا المستخدم لأنك قمت بحظره",
    You_cannot_send_has_blocked_you: "لا يمكنك إرسال رسائل إلى هذا المستخدم لأن قام بحظرك",
    
    // Home
    forYou: "مخصص لك",
    following: "المتابَعين",
    trending: "الأكثر رواجاً",
    noFollowing: "أنت لا تتابع أحداً حتى الآن",
    startFollowingPrompt: "تابع مستخدمين آخرين لرؤية منشوراتهم هنا",

    // Explore
    searchPlaceholder: "ابحث عن مشاريع...",
    hashtags: "الوسوم",
    hashtagsPlaceholder: "أضف وسوماً (اضغط على Enter بعد كل وسم)", 
    mentions: "الإشارات",
    createNewPost: "إنشاء منشور جديد",
    enterTitle: "أدخل عنوان المنشور",
    enterDescription: "أدخل وصف المنشور",
    
    // Reels
    reels: "الريلز",
    createReel: "إنشاء ريل",

    // Profile
    displayName: "الاسم المعروض",
    displayNameDesc: "هذا هو اسمك العام الذي سيظهر للآخرين.",
    username: "اسم المستخدم",
    usernameDesc: "هذا هو اسم المستخدم الفريد الخاص بك الذي يظهر في رابط ملفك الشخصي.",
    bio: "نبذة",
    bioDesc: "وصف موجز عن نفسك. الحد الأقصى 160 حرفاً.",
    website: "الموقع الإلكتروني",
    location: "الموقع",
    changeAvatar: "تغيير الصورة الشخصية",
    uploading: "جاري الرفع...",
    accountScheduledDeletion: "تم جدولة حذف حسابك في",
    restoringAccount: "جاري استعادة الحساب...",
    editProfile: "تعديل الملف الشخصي",

    // Account
    accountSettings: "إعدادات الحساب",
    accountSettingsDesc: "إدارة إعدادات وتفضيلات حسابك.",
    emailAddress: "البريد الإلكتروني",
    changeEmail: "تغيير البريد الإلكتروني",
    password: "كلمة المرور",
    changePassword: "تغيير كلمة المرور",
    dangerZone: "منطقة الخطر",
    deleteAccount: "حذف الحساب",
    deleteAccountDesc: "حذف حسابك وجميع بياناتك. لديك 30 يوماً لاستعادة حسابك قبل الحذف النهائي.",
    restoreAccount: "استعادة الحساب",
    restoring: "جاري الاستعادة...",
    accountRestored: "تم استعادة الحساب",
    accountRestoredDesc: "تم استعادة حسابك بنجاح.",
    restorationFailed: "فشلت عملية الاستعادة",
    restorationFailedDesc: "حدث خطأ أثناء استعادة حسابك. يرجى المحاولة مرة أخرى.",

    // Portfolio/Posts
    title: "العنوان",
    description: "الوصف",
    content: "المحتوى",
    category: "الفئة",
    tags: "الوسوم",
    createPost: "إنشاء منشور",
    editPost: "تعديل المنشور",
    deletePost: "حذف المنشور",
    createProject: "إنشاء مشروع",
    editProject: "تعديل المشروع",
    deleteProject: "حذف المشروع",
    
    // Project details
    views: "مشاهدة",
    like: "إعجاب",
    unlike: "إلغاء الإعجاب",
    share: "مشاركة",
    visitProject: "زيارة المشروع",
    projectContent: "محتوى المشروع",
    backToProjects: "العودة إلى المشاريع",
    
    // Projects page
    projectsPage: "المشاريع",
    allProjects: "كل المشاريع",
    searchProjects: "البحث في المشاريع...",
    noProjectsYet: "لا توجد مشاريع بعد",
    beFirstToAdd: "كن أول من يضيف مشروع جديد",
    addProject: "إضافة مشروع",
    tryDifferentSearch: "جرب مصطلح بحث أو تصفية مختلفة",
    clearFilters: "مسح التصفية",
    addProjectDetails: "أضف تفاصيل مشروعك ليراه المستخدمون في المنصة",
    projectTitlePlaceholder: "عنوان المشروع",
    projectDescriptionPlaceholder: "اكتب وصفاً لمشروعك",
    tagsPlaceholder: "أضف وسوماً (اضغط على Enter بعد كل وسم)",
    maxTagsInfo: "يمكنك إضافة حتى 5 وسوم",
    externalLink: "رابط خارجي (اختياري)",
    projectImage: "صورة المشروع",
    chooseImage: "اختر صورة",
    removeImage: "إزالة الصورة",
    createWithoutImage: "إنشاء بدون صورة",
    
    // Misc
    error: "حدث خطأ",
    success: "تم بنجاح!",
    
    // Arter AI translations
    meetArter: "تعرف على سبيس Ai، مساعدك الذكي للفن والتصميم",
    arterDescription: "احصل على مساعدة إبداعية في لوحات الألوان، ملاحظات التصميم، التقنيات الفنية، وغير ذلك.",
    askArter: "أسأل سبيس Ai عن التصميم، الفن أو الأفكار الإبداعية...",
    clearChat: "مسح المحادثة",
    meetSpaceAI:"تعرف على سبيس Ai، مساعدك الذكي للفن والتصميم",
    spaceAIDescription: "احصل على مساعدة إبداعية في لوحات الألوان، ملاحظات التصميم، التقنيات الفنية، وغير ذلك.",
    suggestColorPalette: "اقترح لوحة ألوان لموقعًا بسيطًا",
    suggestDesignFeedback: "كيف يمكنني تحسين تكويني؟",
    suggestCreativeSolution: "حلول إبداعية لاستخدام المساحة السلبية",
    suggestComposition: "نصائح لتحسين تكوين الصورة",
    arterMenuTitle: "قائمة آرتر الذكية",
    newChat: "محادثة جديدة",
    saveChat: "حفظ المحادثة",
    loadChat: "تحميل المحادثة",
    shareChat: "مشاركة المحادثة",
    exportChat: "تصدير المحادثة",
    importChat: "استيراد المحادثة",
    chatHistory: "سجل المحادثات",
    clearHistory: "مسح السجل",
    savedConversations: "المحادثات المحفوظة",
    noSavedConversations: "لا توجد محادثات محفوظة",
    conversationTitle: "المحادثة",
    deleteConversation: "حذف المحادثة",
    loadConversation: "تحميل المحادثة",
    saveCurrentChat: "حفظ المحادثة الحالية",
    lastSaved: "آخر حفظ",
    minutesAgo: "دقائق مضت",
    hoursAgo: "ساعات مضت",
    daysAgo: "أيام مضت",
    justNow: "الآن",
    searchConversations: "البحث في المحادثات...",
    sortByNewest: "ترتيب حسب الأحدث",
    sortByOldest: "ترتيب حسب الأقدم",
    sortByTitle: "ترتيب حسب العنوان",
    noMatchingConversations: "لا توجد محادثات مطابقة",
    addTag: "إضافة وسم",
    removeTag: "إزالة وسم",
    filterByTag: "تصفية حسب الوسم",
    continuingConversation: "متابعة من محادثة سابقة...",

    //custom
    smileys_emotion: "الابتسامات والمشاعر",
    people_body: "الاشخاص",
    objects: "العناصر",
    symbols: "الرموز",
    Search_emojis: "ابحث عن ايموجي",

    // Footer translations
    footerTitle: "سبيس Ai",
    footerDescription: "منصة فنية اجتماعية تتيح للفنانين والمصممين عرض أعمالهم والتواصل مع المجتمع الفني.",
    footerLinksTitle: "روابط هامة",
    aboutUs: "عنا",
    contactUs: "اتصل بنا",
    termsOfService: "شروط الخدمة",
    privacyPolicy: "سياسة الخصوصية",
    forQuestions: "للاستفسارات والدعم",
    projectNotFound: "المشروع غير موجود",
    errorLoadingProject: "خطأ في تحميل المشروع",
    loginToLikeProjects: "يرجى تسجيل الدخول للإعجاب بالمشاريع",
    likeSuccess: "تم الإعجاب بالمشروع بنجاح",
    unlikeSuccess: "تم إلغاء الإعجاب بالمشروع بنجاح",
    errorUpdatingLike: "خطأ في تحديث حالة الإعجاب",
    projectUpdatedSuccess: "تم تحديث المشروع بنجاح",
    errorUpdatingProject: "خطأ في تحديث المشروع",
    projectDeletedSuccess: "تم حذف المشروع بنجاح",
    errorDeletingProject: "خطأ في حذف المشروع",
    enterProjectTitle: "يرجى إدخال عنوان المشروع",
    saving: "جاري الحفظ...",
    saveChanges: "حفظ التغييرات",
    deleting: "جاري الحذف...",
    areYouSure: "هل أنت متأكد؟",
    deleteProjectWarning: "لا يمكن التراجع عن هذا الإجراء. سيتم حذف مشروعك نهائياً.",
    imageSizeLimitError: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
    unsupportedFileType: "نوع الملف غير مدعوم. يرجى استخدام JPG أو PNG أو GIF أو WEBP",
    addToGallery: "إضافة إلى المعرض",
    projectPreview: "معاينة المشروع",
    projectCoverImage: "صورة غلاف المشروع",
    projectGallery: "معرض المشروع",
    tagsLimit: "يمكنك إضافة حتى 5 وسوم",
    manageNotificationPrefs: "إدارة تفضيلات الإشعارات الخاصة بك.",
    emailNotifications: "إشعارات البريد الإلكتروني",
    emailNotificationsDesc: "ستتلقى إشعارات عبر البريد الإلكتروني للأحداث المهمة.",
    pushNotifications: "إشعارات الدفع",
    pushNotificationsDesc: "ستتلقى إشعارات فورية على جهازك.",
    notificationFrequency: "تكرار الإشعارات",
    notificationFrequencyDesc: "اختر عدد مرات تلقي الإشعارات.",
    instant: "فوري",
    daily: "يومي",
    weekly: "أسبوعي",
    emailSettings:"اعدادات البريد",
    emailSettingsDesc: "إدارة عنوان بريدك الإلكتروني وكيفية تلقي الإشعارات.",
    currentEmail: "البريد الإلكتروني الحالي",
    passwordSettings: "إعدادات كلمة المرور",
    passwordSettingsDesc: "قم بتغيير كلمة المرور للحفاظ على أمان حسابك.",
    currentPassword: "كلمة المرور الحالية",
    messageSettings: "إعدادات الرسائل",
    messageSettingsDesc: "تحكم في من يمكنه إرسال رسائل مباشرة إليك.",
    allowDirectMessages: "السماح بالرسائل المباشرة",
    allowDirectMessagesDesc: "السماح للمستخدمين الآخرين بإرسال رسائل مباشرة إليك.",
    dangerZoneDesc: "سيتم حذف حسابك وجميع بياناتك. لا يمكن التراجع عن هذا الإجراء.",
    footerCopyright: "© 2025 آرت سبيس. جميع الحقوق محفوظة.",
    incorrectCurrentPassword: "كلمة المرور الحالية التي أدخلتها غير صحيحة.",
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem("language") as Language;
    return savedLang || "ar"; // Default is Arabic
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    
    // Apply RTL class for styling
    if (language === "ar") {
      document.documentElement.classList.add("rtl");
      document.body.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
      document.body.classList.remove("rtl");
    }
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isRtl: language === "ar",
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
