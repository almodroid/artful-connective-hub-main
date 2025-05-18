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
    forQuestions: "للاستفسارات والدعم"
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
