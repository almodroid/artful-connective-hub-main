import React from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imgSrc: string;
  crop: Crop | undefined;
  setCrop: (crop: Crop) => void;
  onComplete: (crop: Crop) => void;
  onSave: () => void;
  imgRef: React.RefObject<HTMLImageElement>;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  isUploading: boolean;
}

const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imgSrc,
  crop,
  setCrop,
  onComplete,
  onSave,
  imgRef,
  onImageLoad,
  isUploading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Avatar</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-h-[400px] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={onComplete}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imgSrc}
                onLoad={onImageLoad}
                style={{ maxWidth: '100%' }}
                alt="Crop preview"
              />
            </ReactCrop>
          </div>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isUploading}>
              {isUploading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropModal;