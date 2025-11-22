import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Edit3,
} from "lucide-react";
import { useVendorLogoUpload } from "@/hooks/use-vendor-logo-upload";
import { toast } from "@/components/ui/use-toast";
import { testVendorStorage, testFileUpload } from "@/utils/testStorage";
import { getCroppedImg } from "@/utils/imageCropping";

interface BusinessLogoUploaderProps {
  currentLogoUrl?: string;
  vendorId: string;
  businessName: string;
  onLogoUpdate: (newLogoUrl: string | null) => void;
  isEditable?: boolean;
  children?: React.ReactNode;
}

export const BusinessLogoUploader: React.FC<BusinessLogoUploaderProps> = ({
  currentLogoUrl,
  vendorId,
  businessName,
  onLogoUpdate,
  isEditable = true,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentLogoUrl || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadBusinessLogo, deleteBusinessLogo, uploading } =
    useVendorLogoUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Cropping states
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const validateAndSetFile = (file: File) => {
    console.log("File validation:", {
      name: file.name,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
      type: file.type,
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB) - more precise calculation
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "File too large",
        description: `Image size is ${fileSizeInMB}MB. Must be less than 5MB.`,
        variant: "destructive",
      });
      return;
    }

    // Additional validation - check if file size is reasonable
    if (file.size < 1024) {
      // Less than 1KB
      toast({
        title: "File too small",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const onCropComplete = useCallback(
    (
      _: unknown,
      croppedPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const confirmCrop = async () => {
    if (!previewUrl || !croppedAreaPixels) return;

    console.log("Starting crop process...");
    const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
    console.log("Cropped blob size:", croppedBlob.size, "bytes");

    // Check if cropped blob is too large
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB in bytes
    if (croppedBlob.size > maxSizeInBytes) {
      const fileSizeInMB = (croppedBlob.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "Cropped image too large",
        description: `Cropped image size is ${fileSizeInMB}MB. Please try with a smaller image or different crop area.`,
        variant: "destructive",
      });
      return;
    }

    const croppedFile = new File([croppedBlob], "business-logo.png", {
      type: "image/png",
    });

    console.log("Cropped file details:", {
      name: croppedFile.name,
      size: croppedFile.size,
      sizeInMB: (croppedFile.size / (1024 * 1024)).toFixed(2),
      type: croppedFile.type,
    });

    setSelectedFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));
    setCropping(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    console.log("Starting upload process:", {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileSizeInMB: (selectedFile.size / (1024 * 1024)).toFixed(2),
      fileType: selectedFile.type,
    });

    const newLogoUrl = await uploadBusinessLogo(
      selectedFile,
      vendorId,
      currentLogoUrl
    );
    if (newLogoUrl) {
      console.log("Upload successful, new URL:", newLogoUrl);
      onLogoUpdate(newLogoUrl);
      setPreviewUrl(newLogoUrl);
      setOpen(false);
      setSelectedFile(null);
      setCroppedAreaPixels(null);
    } else {
      console.log("Upload failed");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteBusinessLogo(vendorId, currentLogoUrl);
    if (success) {
      onLogoUpdate(null);
      setPreviewUrl(null);
      setOpen(false);
      setSelectedFile(null);
      setCroppedAreaPixels(null);
    }
    setIsDeleting(false);
  };

  const handleCancel = () => {
    setPreviewUrl(currentLogoUrl || null);
    setSelectedFile(null);
    setCropping(false);
    setCroppedAreaPixels(null);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPreviewUrl(currentLogoUrl || null);
      setSelectedFile(null);
      setCropping(false);
      setCroppedAreaPixels(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setOpen(newOpen);
  };

  const testStorage = async () => {
    console.log("Testing storage...");
    const isAccessible = await testVendorStorage();
    if (isAccessible) {
      toast({
        title: "Storage Test",
        description: "Vendor storage bucket is accessible",
      });
    } else {
      toast({
        title: "Storage Test Failed",
        description: "Vendor storage bucket is not accessible",
        variant: "destructive",
      });
    }
  };

  const testFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }

    console.log("Testing file upload...");
    const success = await testFileUpload(selectedFile, vendorId);
    if (success) {
      toast({
        title: "File Test",
        description: "File upload test successful",
      });
    } else {
      toast({
        title: "File Test Failed",
        description: "File upload test failed",
        variant: "destructive",
      });
    }
  };

  if (!isEditable) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] rounded-2xl pt-2">
        <DialogHeader>
          <DialogTitle className="text-center">
            Update Business Logo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-1">
          {/* Circular Preview - only show when not cropping */}
          {!cropping && (
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-28 w-28 rounded-full overflow-hidden ring-2 ring-gray-200 shadow-sm bg-gray-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={businessName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[11px]">No Logo</span>
                    </div>
                  )}
                </div>
                <Label
                  htmlFor="logo-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-sm-red text-white shadow-md hover:bg-sm-red-light"
                >
                  {croppedAreaPixels && previewUrl && currentLogoUrl ? (
                    <Edit3 size={14} />
                  ) : (
                    <Camera size={14} />
                  )}
                </Label>
              </div>
            </div>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Cropping Interface */}
          {cropping && previewUrl && (
            <div className="space-y-4">
              <div className="max-w-xs aspect-square relative h-32 w-32 mx-auto bg-muted rounded-full overflow-hidden">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="mt-2 w-full"
                  />
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      setCropping(false);
                      if (currentLogoUrl) {
                        setPreviewUrl(currentLogoUrl);
                      } else {
                        setPreviewUrl(null);
                      }
                      setSelectedFile(null);
                      setCroppedAreaPixels(null);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button onClick={confirmCrop} size="sm">
                    Crop & Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Dropzone - only show when not cropping */}
          {!cropping && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Upload className="w-5 h-5 mx-auto mb-2 text-gray-500" />
              <p className="text-sm font-medium text-gray-800">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-gray-500">PNG or JPG, up to 5MB</p>
              {selectedFile && (
                <p className="text-xs text-gray-600 mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          )}

          <div className="text-center text-[11px] text-gray-500">
            Recommended size: 256 x 256 px
          </div>

          {/* Actions */}
          {!cropping && (
            <div className="space-y-2">
              {/* Only show Save Logo button when a file is selected */}
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="w-full"
                >
                  {uploading && !isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Save Logo
                    </>
                  )}
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                {currentLogoUrl && (
                  <Button
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={uploading || isDeleting}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove current logo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessLogoUploader;
