import React from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  const { isRtl } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className={isRtl ? "text-right" : "text-left"}>{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={isRtl ? "text-right" : "text-left"}>
              {isRtl ? (
                <>
                  <h2 className="text-lg font-semibold mb-2">مقدمة</h2>
                  <p>نحن نولي خصوصيتك أهمية كبيرة وملتزمون بحماية بياناتك الشخصية وفقًا لنظام حماية البيانات الشخصية السعودي (PDPL). توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها وتخزينها وحمايتها عند استخدامك منصتنا.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">المعلومات التي نجمعها</h2>
                  <ul className="list-disc ml-6">
                    <li>المعلومات الشخصية التي تقدمها (مثل الاسم، البريد الإلكتروني، بيانات الملف الشخصي)</li>
                    <li>بيانات الاستخدام (مثل الصفحات التي تزورها، الإجراءات التي تتخذها)</li>
                    <li>ملفات تعريف الارتباط والتقنيات المشابهة</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الأساس النظامي للمعالجة</h2>
                  <p>نعالج بياناتك الشخصية بناءً على موافقتك، أو للوفاء بالتزاماتنا التعاقدية، أو كما يقتضيه النظام.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">كيفية استخدام المعلومات</h2>
                  <ul className="list-disc ml-6">
                    <li>تقديم وتحسين خدماتنا</li>
                    <li>التواصل معك</li>
                    <li>ضمان أمان المنصة</li>
                    <li>الامتثال للالتزامات النظامية</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">حقوقك بموجب نظام حماية البيانات</h2>
                  <ul className="list-disc ml-6">
                    <li>الحق في الوصول إلى بياناتك الشخصية</li>
                    <li>الحق في تصحيح أو حذف بياناتك</li>
                    <li>الحق في سحب الموافقة</li>
                    <li>الحق في الاعتراض على المعالجة</li>
                    <li>الحق في نقل البيانات</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الاحتفاظ بالبيانات</h2>
                  <p>نحتفظ ببياناتك الشخصية فقط طالما كان ذلك ضروريًا لتحقيق الأغراض التي جمعت من أجلها أو كما يقتضيه النظام.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">نقل البيانات خارج المملكة</h2>
                  <p>قد يتم نقل بياناتك خارج المملكة العربية السعودية فقط وفقًا لمتطلبات النظام وبوجود الضمانات المناسبة.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">أمان البيانات</h2>
                  <p>نطبق تدابير تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول غير المصرح به أو الفقد أو سوء الاستخدام.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الإبلاغ عن خرق البيانات</h2>
                  <p>في حال حدوث خرق للبيانات، سنقوم بإبلاغ المستخدمين والجهات المختصة حسب ما يقتضيه النظام السعودي.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">الاتصال بمسؤول حماية البيانات</h2>
                  <p>إذا كان لديك أي استفسار حول هذه السياسة أو حقوقك بموجب النظام، يرجى التواصل مع مسؤول حماية البيانات على dpo@example.com.</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-2">Introduction</h2>
                  <p>We value your privacy and are committed to protecting your personal data in accordance with the Saudi Personal Data Protection Law (PDPL). This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Information We Collect</h2>
                  <ul className="list-disc ml-6">
                    <li>Personal information you provide (e.g., name, email, profile info)</li>
                    <li>Usage data (e.g., pages visited, actions taken)</li>
                    <li>Cookies and similar technologies</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Legal Basis for Processing</h2>
                  <p>We process your personal data based on your consent, to fulfill our contractual obligations, or as required by law.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">How We Use Information</h2>
                  <ul className="list-disc ml-6">
                    <li>To provide and improve our services</li>
                    <li>To communicate with you</li>
                    <li>To ensure platform security</li>
                    <li>To comply with legal obligations</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">User Rights under PDPL</h2>
                  <ul className="list-disc ml-6">
                    <li>Right to access your personal data</li>
                    <li>Right to request correction or deletion</li>
                    <li>Right to withdraw consent</li>
                    <li>Right to object to processing</li>
                    <li>Right to data portability</li>
                  </ul>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Data Retention</h2>
                  <p>We retain your personal data only as long as necessary to fulfill the purposes for which it was collected or as required by law.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Cross-Border Data Transfer</h2>
                  <p>Your data may be transferred outside Saudi Arabia only in accordance with PDPL requirements and with appropriate safeguards in place.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Data Security</h2>
                  <p>We implement appropriate technical and organizational measures to protect your data from unauthorized access, loss, or misuse.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Breach Notification</h2>
                  <p>In the event of a data breach, we will notify affected users and the relevant authorities as required by Saudi law.</p>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Contact Data Protection Officer</h2>
                  <p>If you have questions about this policy or your rights under PDPL, please contact our Data Protection Officer at dpo@example.com.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy; 