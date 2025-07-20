import React from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/layout/header/Logo";

const cardCircles = [
  // Each entry: { className, gradient }
  {
    className: "absolute -top-4 -left-4 w-16 h-16 blur-2xl opacity-40 z-0",
    gradient: "from-purple-400 via-fuchsia-400 to-indigo-400"
  },
  {
    className: "absolute -bottom-4 -right-4 w-20 h-20 blur-2xl opacity-30 z-0",
    gradient: "from-fuchsia-400 via-purple-300 to-indigo-300"
  },
  {
    className: "absolute top-1/2 -left-6 w-14 h-14 blur-2xl opacity-30 z-0",
    gradient: "from-indigo-400 via-purple-300 to-fuchsia-300"
  },
  {
    className: "absolute -top-4 right-1/2 w-16 h-16 blur-2xl opacity-35 z-0",
    gradient: "from-purple-300 via-fuchsia-400 to-indigo-400"
  },
  {
    className: "absolute bottom-0 left-1/2 w-20 h-20 blur-2xl opacity-25 z-0",
    gradient: "from-fuchsia-300 via-purple-200 to-indigo-300"
  },
  {
    className: "absolute -bottom-4 -left-4 w-16 h-16 blur-2xl opacity-30 z-0",
    gradient: "from-indigo-300 via-purple-300 to-fuchsia-400"
  },
];

const About = () => {
  const { isRtl } = useTranslation();
  const cardsRtl = [
    "تعرض أعمالك بشكل احترافي",
    "تتفاعل مع جمهور مهتم",
    "تبني ملفك الفني",
    "تشارك في تحديات ومسابقات",
    "تستخدم أداة لمساعدتك",
    "مع مجتمع حقيقي يرافق إبداعك",
  ];
  const cardsLtr = [
    "Showcase your work professionally",
    "Engage with an interested audience",
    "Build your artistic profile",
    "Participate in challenges and competitions",
    "Use helpful tools",
    "With a real community supporting your creativity",
  ];
  return (
    <Layout>
      <div className="relative w-full min-h-screen overflow-hidden">
        {/* Abstract blurred purple circles background - full page width, more circles, more blur */}
        <div className="pointer-events-none select-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500 via-purple-700 to-indigo-900 opacity-40 blur-[120px] z-0" />
        <div className="pointer-events-none select-none fixed -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-400 to-indigo-700 opacity-35 blur-[120px] z-0" />
        <div className="pointer-events-none select-none fixed top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-800 opacity-30 blur-[100px] z-0" />
        <div className="pointer-events-none select-none fixed bottom-0 left-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500 via-purple-400 to-fuchsia-700 opacity-25 blur-[100px] z-0" />
        <div className="pointer-events-none select-none fixed bottom-0 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-purple-700 via-fuchsia-600 to-indigo-900 opacity-30 blur-[120px] z-0" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col items-center">
            <div className="mb-6 mt-2">
              <span className="text-5xl text-primary">?</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-center">{isRtl ? "عنّا" : "About Us"}</h1>
            <p className="text-muted-foreground text-center max-w-2xl mb-8">
              {isRtl
                ? "في زمن صار فيه الإبداع كثير لكن المساحات اللي تحتضنه قليل... قررنا نخلق مساحة... الفن له صوت، وأنت صانع بدايته!"
                : "In a time when creativity is abundant but spaces to embrace it are few... we decided to create a space. Art has a voice, and you are the one who starts it!"}
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-center">{isRtl ? "ماذا نقدم؟" : "What Do We Offer?"}</h2>
            <p className="text-center max-w-2xl mb-8">
              {isRtl
                ? "آرت سبيس هي منصة تواصل اجتماعي عربية مخصصة للمحتوى الفني البصري. من خلال تجربة فريدة وبسيطة ومنهج مشروع، تتيح لك المنصة استعراض أعمالك، التفاعل مع جمهور مهتم، وبناء ملف فني واحد يجمع كل ما أنجزته. هنا تلتقي المواهب، وتُصنع الفرص."
                : "Art Space is an Arabic social platform dedicated to visual art content. Through a unique, simple, and project-driven experience, the platform allows you to showcase your work, interact with an interested audience, and build a single artistic profile that brings together all your achievements. Here, talents meet and opportunities are created."}
            </p>

            <h2 className="text-2xl font-semibold mb-6 text-center">{isRtl ? "في آرت سبيس تقدر:" : "In Art Space You Can:"}</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl ${isRtl ? 'rtl' : ''}`}>
              {(isRtl ? cardsRtl : cardsLtr).map((text, i) => (
                <div key={i} className="relative rounded-xl border border-primary/30 bg-background/60 p-6 text-center shadow-lg overflow-hidden">
                  {/* Unique blurred circle for each card */}
                  <div className={`rounded-full bg-gradient-to-br ${cardCircles[i].gradient} ${cardCircles[i].className}`} />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-2xl font-bold text-primary mb-3">{i + 1}</div>
                    <div className="text-lg font-semibold mb-2">{text}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center max-w-2xl mb-8 text-muted-foreground">
              {isRtl
                ? "مو بس كذا... إحنا نقول أن \"الفن ما يكفي إنه يُرى، لازم عندما يُعرض يُقدر ويُوصل، وتكتمل تجربتك بوصولك كما يجب."
                : "Not only that... We believe that 'art is not enough to be seen; it must be appreciated and reach its audience, and your experience is complete when you reach as you should.'"}
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-center">{isRtl ? "رؤيتنا؟" : "Our Vision"}</h2>
            <p className="text-center max-w-2xl mb-10">
              {isRtl
                ? "تكون المنصة الأرقى عربياً في دعم المبدعين وإدارة الحقوق الإبداعية، ورفع المحتوى الصحيح، وفي نفس الوقت كل شخص يعتز بكل شخص ينتمي له."
                : "To be the leading Arabic platform in supporting creators, managing creative rights, and promoting quality content, while ensuring everyone takes pride in their community."}
            </p>

            <div className="flex flex-col items-center mb-6">
              <Logo className="w-30 h-20 mb-4" />
              <h2 className="text-2xl font-bold text-center mb-2">
                {isRtl ? "أهلاً بك في آرت سبيس. هنا... الفن له صوت" : "Welcome to Art Space. Here... Art Has a Voice"}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About; 