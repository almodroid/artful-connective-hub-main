import React from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";

const TermsAndConditions = () => {
  const { isRtl } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className={isRtl ? "text-right" : "text-left"}>{isRtl ? "الشروط والأحكام" : "Terms and Conditions"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={isRtl ? "text-right" : "text-left"}>
              {isRtl ? (
                <>
                  <h2 className="text-lg font-semibold mb-2">قبول الشروط</h2>
                  <p>باستخدامك منصتنا، فإنك توافق على هذه الشروط والأحكام. يرجى قراءتها بعناية.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">مسؤوليات المستخدم</h2>
                  <ul className="list-disc ml-6">
                    <li>تقديم معلومات دقيقة ومحدثة</li>
                    <li>احترام المستخدمين الآخرين ومحتواهم</li>
                    <li>عدم الانخراط في الأنشطة المحظورة (انظر أدناه)</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الأنشطة المحظورة</h2>
                  <ul className="list-disc ml-6">
                    <li>نشر محتوى غير قانوني أو مسيء أو ضار</li>
                    <li>مخالفة أنظمة أو لوائح المملكة العربية السعودية</li>
                    <li>محاولة اختراق أو تعطيل أو إساءة استخدام المنصة</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">تعليق الحساب وإنهاؤه</h2>
                  <p>نحتفظ بالحق في تعليق أو إنهاء الحسابات التي تنتهك هذه الشروط أو الأنظمة السعودية، مع أو بدون إشعار.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الملكية الفكرية</h2>
                  <p>جميع المحتوى على هذه المنصة محمي بموجب قوانين حقوق النشر والملكية الفكرية. يحتفظ المستخدمون بحقوقهم في محتواهم الخاص لكن يمنحوننا ترخيصًا لعرضه على المنصة.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">تحديد المسؤولية</h2>
                  <p>نحن غير مسؤولين عن أي أضرار تنشأ عن استخدامك للمنصة، إلى الحد الذي يسمح به النظام السعودي.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الامتثال للأنظمة السعودية</h2>
                  <p>يجب على المستخدمين الامتثال لجميع الأنظمة واللوائح المعمول بها في المملكة العربية السعودية.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">القانون الحاكم وتسوية النزاعات</h2>
                  <p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية. يتم حل أي نزاعات حصريًا من قبل المحاكم المختصة في المملكة.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">تغييرات الشروط</h2>
                  <p>قد نقوم بتحديث هذه الشروط من وقت لآخر. استمرارك في استخدام المنصة يعني قبولك للشروط الجديدة.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الاتصال</h2>
                  <p>إذا كان لديك أي استفسار حول هذه الشروط، يرجى التواصل معنا على legal@example.com.</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-2">Acceptance of Terms</h2>
                  <p>By using our platform, you agree to these terms and conditions. Please read them carefully.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">User Responsibilities</h2>
                  <ul className="list-disc ml-6">
                    <li>Provide accurate and up-to-date information</li>
                    <li>Respect other users and their content</li>
                    <li>Do not engage in prohibited activities (see below)</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Prohibited Activities</h2>
                  <ul className="list-disc ml-6">
                    <li>Posting illegal, offensive, or harmful content</li>
                    <li>Violating Saudi laws or regulations</li>
                    <li>Attempting to hack, disrupt, or misuse the platform</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Account Suspension and Termination</h2>
                  <p>We reserve the right to suspend or terminate accounts that violate these terms or Saudi regulations, with or without notice.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Intellectual Property</h2>
                  <p>All content on this platform is protected by copyright and intellectual property laws. Users retain rights to their own content but grant us a license to display it on the platform.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Limitation of Liability</h2>
                  <p>We are not liable for any damages arising from your use of the platform, to the fullest extent permitted by Saudi law.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Compliance with Saudi Regulations</h2>
                  <p>Users must comply with all applicable laws and regulations of the Kingdom of Saudi Arabia.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Governing Law and Dispute Resolution</h2>
                  <p>These terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes shall be resolved exclusively by the competent courts in Saudi Arabia.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Changes to Terms</h2>
                  <p>We may update these terms from time to time. Continued use of the platform means you accept the new terms.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Contact</h2>
                  <p>If you have questions about these terms, please contact us at legal@example.com.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TermsAndConditions; 