import { useState } from 'react';
import { AlertCircle, CheckCircle, FileImage, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
  };
}

interface FileUploadValidatorProps {
  file: File;
  maxSizeMB?: number;
  allowedFormats?: string[];
  minWidth?: number;
  minHeight?: number;
  onValidationComplete?: (result: FileValidationResult) => void;
  className?: string;
}

export function FileUploadValidator({
  file,
  maxSizeMB = 10,
  allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'ai', 'psd'],
  minWidth = 0,
  minHeight = 0,
  onValidationComplete,
  className,
}: FileUploadValidatorProps) {
  const [validating, setValidating] = useState(true);
  const [result, setResult] = useState<FileValidationResult | null>(null);

  useState(() => {
    validateFile();
  });

  async function validateFile() {
    setValidating(true);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const fileInfo: FileValidationResult['fileInfo'] = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFormats.includes(extension)) {
      errors.push(`Định dạng file không hỗ trợ. Cho phép: ${allowedFormats.join(', ')}`);
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      errors.push(`File quá lớn (${fileSizeMB.toFixed(2)}MB). Tối đa: ${maxSizeMB}MB`);
    } else if (fileSizeMB > maxSizeMB * 0.8) {
      warnings.push(`File gần đạt giới hạn kích thước (${fileSizeMB.toFixed(2)}/${maxSizeMB}MB)`);
    }

    // Check image dimensions if applicable
    if (file.type.startsWith('image/') && (minWidth > 0 || minHeight > 0)) {
      try {
        const dimensions = await getImageDimensions(file);
        fileInfo.width = dimensions.width;
        fileInfo.height = dimensions.height;

        if (minWidth > 0 && dimensions.width < minWidth) {
          errors.push(`Chiều rộng ảnh quá nhỏ (${dimensions.width}px). Tối thiểu: ${minWidth}px`);
        }
        if (minHeight > 0 && dimensions.height < minHeight) {
          errors.push(`Chiều cao ảnh quá nhỏ (${dimensions.height}px). Tối thiểu: ${minHeight}px`);
        }
      } catch (err) {
        warnings.push('Không thể kiểm tra kích thước ảnh');
      }
    }

    const validationResult: FileValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      fileInfo,
    };

    setResult(validationResult);
    setValidating(false);
    onValidationComplete?.(validationResult);
  }

  function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  if (validating) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang kiểm tra file...
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* File Info */}
      <div className="flex items-center gap-2 text-sm">
        <FileImage className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{result.fileInfo.name}</span>
        <Badge variant="outline" className="text-xs">
          {(result.fileInfo.size / (1024 * 1024)).toFixed(2)} MB
        </Badge>
        {result.fileInfo.width && result.fileInfo.height && (
          <Badge variant="outline" className="text-xs">
            {result.fileInfo.width} x {result.fileInfo.height}
          </Badge>
        )}
      </div>

      {/* Validation Status */}
      {result.valid ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          File hợp lệ
        </div>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {result.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <ul className="list-disc pl-4 space-y-1">
              {result.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Standalone validation function for use in hooks
export async function validateDesignFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedFormats?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<FileValidationResult> {
  const {
    maxSizeMB = 10,
    allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'ai', 'psd'],
    minWidth = 0,
    minHeight = 0,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  
  const fileInfo: FileValidationResult['fileInfo'] = {
    name: file.name,
    size: file.size,
    type: file.type,
  };

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedFormats.includes(extension)) {
    errors.push(`Định dạng file không hỗ trợ. Cho phép: ${allowedFormats.join(', ')}`);
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    errors.push(`File quá lớn (${fileSizeMB.toFixed(2)}MB). Tối đa: ${maxSizeMB}MB`);
  }

  if (file.type.startsWith('image/') && (minWidth > 0 || minHeight > 0)) {
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      fileInfo.width = dimensions.width;
      fileInfo.height = dimensions.height;

      if (minWidth > 0 && dimensions.width < minWidth) {
        errors.push(`Chiều rộng ảnh quá nhỏ (${dimensions.width}px). Tối thiểu: ${minWidth}px`);
      }
      if (minHeight > 0 && dimensions.height < minHeight) {
        errors.push(`Chiều cao ảnh quá nhỏ (${dimensions.height}px). Tối thiểu: ${minHeight}px`);
      }
    } catch {
      warnings.push('Không thể kiểm tra kích thước ảnh');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo,
  };
}
