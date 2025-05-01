import { useState } from "react";
import { 
  AlertCircle, 
  Info, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  FileVideo,
  Crop,
  Timer,
  Scissors,
  Image,
  Upload,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "@/hooks/use-translation";

interface ReelUploadGuidelinesProps {
  detailed?: boolean;
}

export function ReelUploadGuidelines({ detailed = false }: ReelUploadGuidelinesProps) {
  const { t, isRtl } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Quick summary guidelines
  const quickGuidelines = (
    <Alert variant="default" className="bg-muted/50 border-primary/30">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertTitle>{isRtl ? "إرشادات الريل" : "Reel Guidelines"}</AlertTitle>
      <AlertDescription className="mt-2 text-sm">
        <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1`}>
          <li>{isRtl ? "الحد الأقصى للحجم: 50 ميجابايت" : "Max size: 50MB"}</li>
          <li>{isRtl ? "الأبعاد: 9:16 (عمودي)" : "Dimensions: 9:16 (vertical)"}</li>
          <li>{isRtl ? "المدة: 15-60 ثانية" : "Duration: 15-60 seconds"}</li>
          <li>{isRtl ? "التنسيقات: MP4، MOV، WebM" : "Formats: MP4, MOV, WebM"}</li>
          <li>{isRtl ? "فلاتر وتعديلات متاحة" : "Filters & adjustments available"}</li>
        </ul>
      </AlertDescription>
    </Alert>
  );

  // Detailed guidelines with sections
  const detailedGuidelines = (
    <div dir={isRtl ? "rtl" : "ltr"}>
    
      
      
      
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileVideo className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "متطلبات الملف" : "File Requirements"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "الحد الأقصى لحجم الملف: 50 ميجابايت" : "Maximum file size: 50MB"}</li>
            <li>{isRtl ? "التنسيقات المدعومة: MP4، MOV، WebM" : "Supported formats: MP4, MOV, WebM"}</li>
            <li>{isRtl ? "الدقة المثلى: 1080 × 1920 بكسل" : "Optimal resolution: 1080 × 1920 pixels"}</li>
            <li>{isRtl ? "معدل البت: 2-4 ميجابت في الثانية" : "Bitrate: 2-4 Mbps"}</li>
          </ul>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crop className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "الأبعاد والنسبة" : "Dimensions & Ratio"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "النسبة المثالية: 9:16 (عمودي)" : "Ideal aspect ratio: 9:16 (vertical)"}</li>
            <li>{isRtl ? "سيتم قص الفيديو تلقائيًا إلى 9:16" : "Video will be automatically cropped to 9:16"}</li>
            <li>{isRtl ? "استخدم أداة القص لضبط محتوى الفيديو" : "Use cropping tool to adjust content area"}</li>
          </ul>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "طول الفيديو" : "Video Length"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "الحد الأدنى: 15 ثانية" : "Minimum: 15 seconds"}</li>
            <li>{isRtl ? "الحد الأقصى: 60 ثانية" : "Maximum: 60 seconds"}</li>
            <li>{isRtl ? "الطول المثالي: 30 ثانية" : "Ideal length: 30 seconds"}</li>
          </ul>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scissors className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "نصائح للتحسين" : "Optimization Tips"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "استخدم الإضاءة الجيدة" : "Use good lighting"}</li>
            <li>{isRtl ? "تأكد من وضوح الصوت" : "Ensure clear audio"}</li>
            <li>{isRtl ? "ضغط الفيديو قبل التحميل للحصول على حجم أصغر" : "Compress video before uploading for smaller size"}</li>
            <li>{isRtl ? "إضافة غلاف جذاب" : "Add an attractive cover image"}</li>
          </ul>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "الفلاتر والتعديلات" : "Filters & Adjustments"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "10 فلاتر متاحة لتعزيز مظهر الفيديو" : "10 available filters to enhance video appearance"}</li>
            <li>{isRtl ? "ضبط السطوع والتباين والتشبع" : "Adjust brightness, contrast, and saturation"}</li>
            <li>{isRtl ? "إنشاء صورة مصغرة مخصصة مع الفلاتر" : "Create custom thumbnail with filters"}</li>
            <li>{isRtl ? "تطبيق نفس الفلتر على الفيديو والصورة المصغرة" : "Apply the same filter to video and thumbnail"}</li>
          </ul>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "صورة الغلاف" : "Cover Image"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "يتم إنشاؤها تلقائيًا من الفيديو" : "Automatically generated from video"}</li>
            <li>{isRtl ? "يمكنك تحميل صورة غلاف مخصصة" : "You can upload a custom cover image"}</li>
            <li>{isRtl ? "الأبعاد الموصى بها: 1080 × 1920 بكسل" : "Recommended dimensions: 1080 × 1920 pixels"}</li>
          </ul>
        </div>
        
        <div className="bg-background/80 p-3 rounded border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{isRtl ? "قائمة التحقق قبل التحميل" : "Pre-Upload Checklist"}</h4>
          </div>
          <ul className={`list-disc ${isRtl ? "pr-5" : "pl-5"} space-y-1 text-sm`}>
            <li>{isRtl ? "فيديو أقل من 50 ميجابايت" : "Video under 50MB"}</li>
            <li>{isRtl ? "نسبة العرض إلى الارتفاع 9:16" : "9:16 aspect ratio"}</li>
            <li>{isRtl ? "طول 15-60 ثانية" : "15-60 seconds length"}</li>
            <li>{isRtl ? "جودة الصوت جيدة" : "Good audio quality"}</li>
            <li>{isRtl ? "تنسيق MP4 أو MOV أو WebM" : "MP4, MOV, or WebM format"}</li>
          </ul>
        </div>
        
        <div className="flex items-center justify-center mt-4">
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={() => {
              // This could link to a more detailed guide or open a tutorial
              window.open('https://help.example.com/reel-guidelines', '_blank');
            }}
          >
            <Upload className="h-4 w-4" />
            <span>{isRtl ? "دليل التحسين الكامل" : "Full Optimization Guide"}</span>
          </Button>
        </div>
      
    </div>
  );

  return detailed ? detailedGuidelines : quickGuidelines;
} 