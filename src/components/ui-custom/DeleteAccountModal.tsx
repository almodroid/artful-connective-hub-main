import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف الحساب</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>هل أنت متأكد من رغبتك في حذف حسابك؟</p>
            <p className="font-medium">ما يجب أن تعرفه:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>سيتم إخفاء ملفك الشخصي ومحتواك على الفور</li>
              <li>لديك 30 يومًا لاستعادة حسابك قبل الحذف النهائي</li>
              <li>بعد 30 يومًا، سيتم حذف جميع بياناتك بشكل دائم</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "جارٍ الحذف..." : "حذف الحساب"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountModal;