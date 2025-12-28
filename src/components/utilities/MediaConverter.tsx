import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Image,
  Music,
  Video,
  Upload,
  Download,
  Trash2,
  FileArchive,
  Settings2,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  outputUrl?: string;
  outputName?: string;
  error?: string;
}

interface ImageOptions {
  format: "jpg" | "png" | "webp" | "ico";
  resize: boolean;
  resizeWidth: number;
  resizeHeight: number;
  keepAspectRatio: boolean;
  resizeMode: "px" | "percent";
  compression: "low" | "medium" | "high";
  stripMetadata: boolean;
  backgroundColor: string;
}

interface AudioOptions {
  format: "mp3" | "wav" | "aac" | "ogg";
  bitrate: "64" | "128" | "192" | "320";
  channels: "mono" | "stereo";
  trim: boolean;
  trimStart: number;
  trimEnd: number;
  normalize: boolean;
  stripMetadata: boolean;
}

interface VideoOptions {
  format: "mp4" | "webm" | "mov";
  resolution: "original" | "480p" | "720p" | "1080p";
  fps: "original" | "30" | "60";
  compression: "fast" | "balanced" | "high";
  keepAudio: boolean;
  trim: boolean;
  trimStart: number;
  trimEnd: number;
  extractThumbnail: boolean;
  thumbnailFormat: "jpg" | "png";
}

const MediaConverter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"image" | "audio" | "video">("image");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageOptions, setImageOptions] = useState<ImageOptions>({
    format: "jpg",
    resize: false,
    resizeWidth: 800,
    resizeHeight: 600,
    keepAspectRatio: true,
    resizeMode: "px",
    compression: "medium",
    stripMetadata: true,
    backgroundColor: "#ffffff"
  });

  const [audioOptions, setAudioOptions] = useState<AudioOptions>({
    format: "mp3",
    bitrate: "192",
    channels: "stereo",
    trim: false,
    trimStart: 0,
    trimEnd: 60,
    normalize: false,
    stripMetadata: true
  });

  const [videoOptions, setVideoOptions] = useState<VideoOptions>({
    format: "mp4",
    resolution: "original",
    fps: "original",
    compression: "balanced",
    keepAudio: true,
    trim: false,
    trimStart: 0,
    trimEnd: 60,
    extractThumbnail: false,
    thumbnailFormat: "jpg"
  });

  const loadFFmpeg = async () => {
    if (ffmpegRef.current || ffmpegLoading) return;
    
    setFfmpegLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      
      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      toast.success("FFmpeg đã sẵn sàng!");
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      toast.error("Không thể tải FFmpeg. Vui lòng thử lại.");
    } finally {
      setFfmpegLoading(false);
    }
  };

  const getAcceptedTypes = () => {
    switch (activeTab) {
      case "image":
        return "image/jpeg,image/png,image/webp,image/gif,image/bmp";
      case "audio":
        return "audio/mpeg,audio/wav,audio/m4a,audio/ogg,audio/aac";
      case "video":
        return "video/mp4,video/quicktime,video/x-matroska,video/x-msvideo,video/webm";
      default:
        return "*";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: FileItem[] = selectedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const convertImage = async (fileItem: FileItem): Promise<{ url: string; name: string }> => {
    const { file } = fileItem;
    const { format, resize, resizeWidth, resizeHeight, keepAspectRatio, resizeMode, compression, stripMetadata, backgroundColor } = imageOptions;

    // Use browser-image-compression for image processing
    const compressionQuality = compression === "low" ? 0.9 : compression === "medium" ? 0.7 : 0.5;
    
    let maxWidth = resize ? (resizeMode === "percent" ? undefined : resizeWidth) : undefined;
    let maxHeight = resize ? (resizeMode === "percent" ? undefined : resizeHeight) : undefined;
    
    if (resize && resizeMode === "percent") {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => img.onload = resolve);
      maxWidth = Math.round(img.width * (resizeWidth / 100));
      maxHeight = Math.round(img.height * (resizeHeight / 100));
    }

    const options = {
      maxSizeMB: compression === "low" ? 10 : compression === "medium" ? 5 : 2,
      maxWidthOrHeight: maxWidth || maxHeight ? Math.max(maxWidth || 0, maxHeight || 0) : undefined,
      useWebWorker: true,
      initialQuality: compressionQuality,
      exifOrientation: stripMetadata ? 1 : undefined,
    };

    let processedBlob = await imageCompression(file, options);

    // Convert format using canvas
    const img = new window.Image();
    img.src = URL.createObjectURL(processedBlob);
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement("canvas");
    let targetWidth = img.width;
    let targetHeight = img.height;

    if (resize) {
      if (resizeMode === "percent") {
        targetWidth = Math.round(img.width * (resizeWidth / 100));
        targetHeight = Math.round(img.height * (resizeHeight / 100));
      } else {
        if (keepAspectRatio) {
          const ratio = Math.min(resizeWidth / img.width, resizeHeight / img.height);
          targetWidth = Math.round(img.width * ratio);
          targetHeight = Math.round(img.height * ratio);
        } else {
          targetWidth = resizeWidth;
          targetHeight = resizeHeight;
        }
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d")!;

    // Fill background for non-transparent formats
    if (format === "jpg") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const mimeType = format === "jpg" ? "image/jpeg" : format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/png";
    const quality = compressionQuality;

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(b => resolve(b!), mimeType, quality);
    });

    // Handle ICO format
    if (format === "ico") {
      // Create a small version for ICO
      const icoCanvas = document.createElement("canvas");
      icoCanvas.width = 64;
      icoCanvas.height = 64;
      const icoCtx = icoCanvas.getContext("2d")!;
      icoCtx.drawImage(canvas, 0, 0, 64, 64);
      
      const icoBlob = await new Promise<Blob>((resolve) => {
        icoCanvas.toBlob(b => resolve(b!), "image/png");
      });
      
      const baseName = file.name.replace(/\.[^.]+$/, "");
      return {
        url: URL.createObjectURL(icoBlob),
        name: `${baseName}.ico`
      };
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
      url: URL.createObjectURL(blob),
      name: `${baseName}.${format}`
    };
  };

  const convertAudio = async (fileItem: FileItem): Promise<{ url: string; name: string }> => {
    if (!ffmpegRef.current) throw new Error("FFmpeg not loaded");
    
    const ffmpeg = ffmpegRef.current;
    const { file } = fileItem;
    const { format, bitrate, channels, trim, trimStart, trimEnd, normalize, stripMetadata } = audioOptions;

    const inputName = `input_${Date.now()}${getExtension(file.name)}`;
    const outputName = `output_${Date.now()}.${format}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args: string[] = ["-i", inputName];

    // Trim
    if (trim) {
      args.push("-ss", trimStart.toString(), "-to", trimEnd.toString());
    }

    // Bitrate
    args.push("-b:a", `${bitrate}k`);

    // Channels
    args.push("-ac", channels === "mono" ? "1" : "2");

    // Normalize
    if (normalize) {
      args.push("-filter:a", "loudnorm");
    }

    // Strip metadata
    if (stripMetadata) {
      args.push("-map_metadata", "-1");
    }

    // Output format specific
    if (format === "mp3") {
      args.push("-codec:a", "libmp3lame");
    } else if (format === "aac") {
      args.push("-codec:a", "aac");
    } else if (format === "ogg") {
      args.push("-codec:a", "libvorbis");
    }

    args.push("-y", outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
    const blob = new Blob([new Uint8Array(uint8Array)], { type: `audio/${format}` });

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
      url: URL.createObjectURL(blob),
      name: `${baseName}.${format}`
    };
  };

  const convertVideo = async (fileItem: FileItem): Promise<{ url: string; name: string; thumbnailUrl?: string }> => {
    if (!ffmpegRef.current) throw new Error("FFmpeg not loaded");
    
    const ffmpeg = ffmpegRef.current;
    const { file } = fileItem;
    const { format, resolution, fps, compression, keepAudio, trim, trimStart, trimEnd, extractThumbnail, thumbnailFormat } = videoOptions;

    const inputName = `input_${Date.now()}${getExtension(file.name)}`;
    const outputName = `output_${Date.now()}.${format}`;
    const thumbName = `thumb_${Date.now()}.${thumbnailFormat}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args: string[] = ["-i", inputName];

    // Trim
    if (trim) {
      args.push("-ss", trimStart.toString(), "-to", trimEnd.toString());
    }

    // Resolution
    if (resolution !== "original") {
      const scale = resolution === "480p" ? "scale=-2:480" : resolution === "720p" ? "scale=-2:720" : "scale=-2:1080";
      args.push("-vf", scale);
    }

    // FPS
    if (fps !== "original") {
      args.push("-r", fps);
    }

    // Compression preset
    const preset = compression === "fast" ? "ultrafast" : compression === "balanced" ? "medium" : "slow";
    args.push("-preset", preset);

    // Audio
    if (!keepAudio) {
      args.push("-an");
    }

    // Format specific
    if (format === "mp4") {
      args.push("-codec:v", "libx264", "-codec:a", "aac");
    } else if (format === "webm") {
      args.push("-codec:v", "libvpx-vp9", "-codec:a", "libopus");
    }

    args.push("-y", outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
    const blob = new Blob([new Uint8Array(uint8Array)], { type: `video/${format}` });
    const url = URL.createObjectURL(blob);

    let thumbnailUrl: string | undefined;
    
    // Extract thumbnail
    if (extractThumbnail) {
      try {
        await ffmpeg.exec([
          "-i", inputName,
          "-ss", "00:00:01",
          "-vframes", "1",
          "-y", thumbName
        ]);
        const thumbData = await ffmpeg.readFile(thumbName);
        const thumbUint8Array = thumbData instanceof Uint8Array ? thumbData : new TextEncoder().encode(thumbData as string);
        const thumbBlob = new Blob([new Uint8Array(thumbUint8Array)], { type: `image/${thumbnailFormat}` });
        thumbnailUrl = URL.createObjectURL(thumbBlob);
        await ffmpeg.deleteFile(thumbName);
      } catch (e) {
        console.error("Thumbnail extraction failed:", e);
      }
    }

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
      url,
      name: `${baseName}.${format}`,
      thumbnailUrl
    };
  };

  const getExtension = (filename: string): string => {
    const parts = filename.split(".");
    return parts.length > 1 ? `.${parts.pop()}` : "";
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn file để xử lý");
      return;
    }

    // Load FFmpeg for audio/video
    if ((activeTab === "audio" || activeTab === "video") && !ffmpegLoaded) {
      await loadFFmpeg();
      if (!ffmpegRef.current) return;
    }

    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === "pending");

    for (const fileItem of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: "processing", progress: 0 } : f
      ));

      try {
        let result: { url: string; name: string };

        if (activeTab === "image") {
          result = await convertImage(fileItem);
        } else if (activeTab === "audio") {
          result = await convertAudio(fileItem);
        } else {
          result = await convertVideo(fileItem);
        }

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: "done", progress: 100, outputUrl: result.url, outputName: result.name }
            : f
        ));
      } catch (error) {
        console.error("Conversion error:", error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: "error", error: error instanceof Error ? error.message : "Lỗi không xác định" }
            : f
        ));
      }
    }

    setIsProcessing(false);
    toast.success("Xử lý hoàn tất!");
  };

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const downloadAllAsZip = async () => {
    const doneFiles = files.filter(f => f.status === "done" && f.outputUrl);
    if (doneFiles.length === 0) {
      toast.error("Không có file nào để tải");
      return;
    }

    const zip = new JSZip();

    for (const fileItem of doneFiles) {
      const response = await fetch(fileItem.outputUrl!);
      const blob = await response.blob();
      zip.file(fileItem.outputName!, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    downloadFile(url, `converted_${activeTab}_${Date.now()}.zip`);
    URL.revokeObjectURL(url);
  };

  const retryFile = (id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: "pending", progress: 0, error: undefined } : f
    ));
  };

  const renderImageOptions = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Định dạng output</Label>
          <Select value={imageOptions.format} onValueChange={(v: ImageOptions["format"]) => setImageOptions(prev => ({ ...prev, format: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
              <SelectItem value="ico">ICO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mức nén</Label>
          <Select value={imageOptions.compression} onValueChange={(v: ImageOptions["compression"]) => setImageOptions(prev => ({ ...prev, compression: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Thấp (chất lượng cao)</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="high">Cao (file nhỏ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Resize ảnh</Label>
        <Switch checked={imageOptions.resize} onCheckedChange={(v) => setImageOptions(prev => ({ ...prev, resize: v }))} />
      </div>

      {imageOptions.resize && (
        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chế độ</Label>
              <Select value={imageOptions.resizeMode} onValueChange={(v: ImageOptions["resizeMode"]) => setImageOptions(prev => ({ ...prev, resizeMode: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px">Pixel</SelectItem>
                  <SelectItem value="percent">Phần trăm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={imageOptions.keepAspectRatio} onCheckedChange={(v) => setImageOptions(prev => ({ ...prev, keepAspectRatio: v }))} />
              <Label className="text-sm">Giữ tỷ lệ</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{imageOptions.resizeMode === "px" ? "Chiều rộng (px)" : "Chiều rộng (%)"}</Label>
              <Input type="number" value={imageOptions.resizeWidth} onChange={(e) => setImageOptions(prev => ({ ...prev, resizeWidth: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>{imageOptions.resizeMode === "px" ? "Chiều cao (px)" : "Chiều cao (%)"}</Label>
              <Input type="number" value={imageOptions.resizeHeight} onChange={(e) => setImageOptions(prev => ({ ...prev, resizeHeight: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>
      )}

      {imageOptions.format === "jpg" && (
        <div>
          <Label>Màu nền (PNG trong suốt → JPG)</Label>
          <div className="flex gap-2 mt-1">
            <Input type="color" value={imageOptions.backgroundColor} onChange={(e) => setImageOptions(prev => ({ ...prev, backgroundColor: e.target.value }))} className="w-16 h-10 p-1" />
            <Input value={imageOptions.backgroundColor} onChange={(e) => setImageOptions(prev => ({ ...prev, backgroundColor: e.target.value }))} className="flex-1" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Xoá metadata (EXIF)</Label>
        <Switch checked={imageOptions.stripMetadata} onCheckedChange={(v) => setImageOptions(prev => ({ ...prev, stripMetadata: v }))} />
      </div>
    </div>
  );

  const renderAudioOptions = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Định dạng output</Label>
          <Select value={audioOptions.format} onValueChange={(v: AudioOptions["format"]) => setAudioOptions(prev => ({ ...prev, format: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3</SelectItem>
              <SelectItem value="wav">WAV</SelectItem>
              <SelectItem value="aac">AAC</SelectItem>
              <SelectItem value="ogg">OGG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Bitrate</Label>
          <Select value={audioOptions.bitrate} onValueChange={(v: AudioOptions["bitrate"]) => setAudioOptions(prev => ({ ...prev, bitrate: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="64">64 kbps</SelectItem>
              <SelectItem value="128">128 kbps</SelectItem>
              <SelectItem value="192">192 kbps</SelectItem>
              <SelectItem value="320">320 kbps</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Kênh âm thanh</Label>
        <Select value={audioOptions.channels} onValueChange={(v: AudioOptions["channels"]) => setAudioOptions(prev => ({ ...prev, channels: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mono">Mono</SelectItem>
            <SelectItem value="stereo">Stereo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Cắt audio</Label>
        <Switch checked={audioOptions.trim} onCheckedChange={(v) => setAudioOptions(prev => ({ ...prev, trim: v }))} />
      </div>

      {audioOptions.trim && (
        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
          <div>
            <Label>Bắt đầu (giây)</Label>
            <Input type="number" value={audioOptions.trimStart} onChange={(e) => setAudioOptions(prev => ({ ...prev, trimStart: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Kết thúc (giây)</Label>
            <Input type="number" value={audioOptions.trimEnd} onChange={(e) => setAudioOptions(prev => ({ ...prev, trimEnd: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Chuẩn hoá âm lượng</Label>
        <Switch checked={audioOptions.normalize} onCheckedChange={(v) => setAudioOptions(prev => ({ ...prev, normalize: v }))} />
      </div>

      <div className="flex items-center justify-between">
        <Label>Xoá metadata</Label>
        <Switch checked={audioOptions.stripMetadata} onCheckedChange={(v) => setAudioOptions(prev => ({ ...prev, stripMetadata: v }))} />
      </div>
    </div>
  );

  const renderVideoOptions = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Định dạng output</Label>
          <Select value={videoOptions.format} onValueChange={(v: VideoOptions["format"]) => setVideoOptions(prev => ({ ...prev, format: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp4">MP4 (H.264)</SelectItem>
              <SelectItem value="webm">WebM (VP9)</SelectItem>
              <SelectItem value="mov">MOV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Độ phân giải</Label>
          <Select value={videoOptions.resolution} onValueChange={(v: VideoOptions["resolution"]) => setVideoOptions(prev => ({ ...prev, resolution: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Giữ nguyên</SelectItem>
              <SelectItem value="480p">480p</SelectItem>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>FPS</Label>
          <Select value={videoOptions.fps} onValueChange={(v: VideoOptions["fps"]) => setVideoOptions(prev => ({ ...prev, fps: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Giữ nguyên</SelectItem>
              <SelectItem value="30">30 FPS</SelectItem>
              <SelectItem value="60">60 FPS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mức nén</Label>
          <Select value={videoOptions.compression} onValueChange={(v: VideoOptions["compression"]) => setVideoOptions(prev => ({ ...prev, compression: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fast">Nhanh (file lớn)</SelectItem>
              <SelectItem value="balanced">Cân bằng</SelectItem>
              <SelectItem value="high">Chất lượng cao (chậm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Giữ âm thanh</Label>
        <Switch checked={videoOptions.keepAudio} onCheckedChange={(v) => setVideoOptions(prev => ({ ...prev, keepAudio: v }))} />
      </div>

      <div className="flex items-center justify-between">
        <Label>Cắt video</Label>
        <Switch checked={videoOptions.trim} onCheckedChange={(v) => setVideoOptions(prev => ({ ...prev, trim: v }))} />
      </div>

      {videoOptions.trim && (
        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
          <div>
            <Label>Bắt đầu (giây)</Label>
            <Input type="number" value={videoOptions.trimStart} onChange={(e) => setVideoOptions(prev => ({ ...prev, trimStart: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Kết thúc (giây)</Label>
            <Input type="number" value={videoOptions.trimEnd} onChange={(e) => setVideoOptions(prev => ({ ...prev, trimEnd: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Trích xuất thumbnail</Label>
        <Switch checked={videoOptions.extractThumbnail} onCheckedChange={(v) => setVideoOptions(prev => ({ ...prev, extractThumbnail: v }))} />
      </div>

      {videoOptions.extractThumbnail && (
        <div className="pl-4 border-l-2 border-primary/20">
          <Label>Định dạng thumbnail</Label>
          <Select value={videoOptions.thumbnailFormat} onValueChange={(v: VideoOptions["thumbnailFormat"]) => setVideoOptions(prev => ({ ...prev, thumbnailFormat: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); clearFiles(); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image" className="gap-2">
            <Image className="h-4 w-4" />
            Ảnh
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Music className="h-4 w-4" />
            Âm thanh
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-2">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Left: Upload & Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Kéo thả hoặc click để chọn file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === "image" && "JPG, PNG, WebP, GIF, BMP"}
                  {activeTab === "audio" && "MP3, WAV, M4A, OGG, AAC"}
                  {activeTab === "video" && "MP4, MOV, MKV, AVI, WebM"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={getAcceptedTypes()}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map(fileItem => (
                    <div key={fileItem.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileItem.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileItem.size)}
                        </p>
                        {fileItem.status === "processing" && (
                          <Progress value={fileItem.progress} className="mt-1 h-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileItem.status === "pending" && (
                          <Badge variant="secondary">Chờ</Badge>
                        )}
                        {fileItem.status === "processing" && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {fileItem.status === "done" && (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => downloadFile(fileItem.outputUrl!, fileItem.outputName!)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {fileItem.status === "error" && (
                          <>
                            <XCircle className="h-4 w-4 text-destructive" />
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => retryFile(fileItem.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => removeFile(fileItem.id)}
                          disabled={fileItem.status === "processing"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {files.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={processFiles} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Chuyển đổi
                      </>
                    )}
                  </Button>
                  {files.some(f => f.status === "done") && (
                    <Button variant="outline" onClick={downloadAllAsZip}>
                      <FileArchive className="h-4 w-4 mr-2" />
                      Tải tất cả (ZIP)
                    </Button>
                  )}
                  <Button variant="ghost" onClick={clearFiles} disabled={isProcessing}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xoá tất cả
                  </Button>
                </div>
              )}

              {/* FFmpeg Status */}
              {(activeTab === "audio" || activeTab === "video") && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {ffmpegLoading && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Đang tải FFmpeg...
                    </>
                  )}
                  {ffmpegLoaded && (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      FFmpeg sẵn sàng
                    </>
                  )}
                  {!ffmpegLoaded && !ffmpegLoading && (
                    <>
                      <Settings2 className="h-3 w-3" />
                      FFmpeg sẽ được tải khi bắt đầu xử lý (~30MB)
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Tuỳ chọn chuyển đổi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TabsContent value="image" className="mt-0">
                {renderImageOptions()}
              </TabsContent>
              <TabsContent value="audio" className="mt-0">
                {renderAudioOptions()}
              </TabsContent>
              <TabsContent value="video" className="mt-0">
                {renderVideoOptions()}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>💡 <strong>Lưu ý:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Tất cả xử lý diễn ra trên trình duyệt của bạn - file không được upload lên server</li>
              <li>Lần đầu xử lý audio/video sẽ tải FFmpeg (~30MB), sau đó dùng lại</li>
              <li>Video lớn có thể mất thời gian xử lý, tùy thuộc vào cấu hình máy</li>
              <li>Nên sử dụng trình duyệt mới nhất (Chrome, Firefox, Edge) để có hiệu suất tốt nhất</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaConverter;
