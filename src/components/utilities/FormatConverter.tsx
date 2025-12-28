import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Copy, 
  Trash2, 
  ArrowLeftRight, 
  Undo2, 
  Redo2, 
  Save, 
  FolderOpen,
  ChevronDown,
  Settings2,
  Sparkles,
  ListOrdered,
  FileText,
  TableIcon,
  Columns,
  Hash,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ConversionMode = "text-to-list" | "list-to-text" | "text-to-csv" | "csv-to-table" | "normalize";

interface ConversionOptions {
  // Text to List
  inputSeparator: string;
  customSeparator: string;
  trimWhitespace: boolean;
  removeEmpty: boolean;
  
  // List to Text
  outputSeparator: string;
  customOutputSeparator: string;
  addSpaces: boolean;
  
  // Text to CSV
  csvInputSeparator: string;
  quoteData: boolean;
  
  // Normalize
  columnCount: number;
  normalizeOutputSeparator: string;
  
  // Data cleaning
  removeDuplicates: boolean;
  limitChars: number;
  forceCase: "none" | "lower" | "upper";
  removeSpecialChars: boolean;
  
  // Line numbering
  addLineNumbers: boolean;
  startNumber: number;
}

interface Preset {
  id: string;
  name: string;
  mode: ConversionMode;
  options: ConversionOptions;
  createdAt: string;
}

const defaultOptions: ConversionOptions = {
  inputSeparator: ",",
  customSeparator: "",
  trimWhitespace: true,
  removeEmpty: true,
  outputSeparator: "|",
  customOutputSeparator: "",
  addSpaces: false,
  csvInputSeparator: "|",
  quoteData: false,
  columnCount: 3,
  normalizeOutputSeparator: "|",
  removeDuplicates: false,
  limitChars: 0,
  forceCase: "none",
  removeSpecialChars: false,
  addLineNumbers: false,
  startNumber: 1,
};

const STORAGE_KEY = "format_converter_presets";

export const FormatConverter: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>("text-to-list");
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions);
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showOptions, setShowOptions] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<boolean[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: Preset[]) => {
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
  };

  // Process input and generate output
  const output = useMemo((): string => {
    if (!input.trim()) return "";

    let lines = input.split("\n");
    
    // Apply data cleaning
    if (options.trimWhitespace) {
      lines = lines.map(line => line.trim());
    }
    
    if (options.removeEmpty) {
      lines = lines.filter(line => line.length > 0);
    }
    
    if (options.removeDuplicates) {
      lines = [...new Set(lines)];
    }
    
    if (options.forceCase === "lower") {
      lines = lines.map(line => line.toLowerCase());
    } else if (options.forceCase === "upper") {
      lines = lines.map(line => line.toUpperCase());
    }
    
    if (options.removeSpecialChars) {
      lines = lines.map(line => line.replace(/[^\w\s@.-]/g, ""));
    }
    
    if (options.limitChars > 0) {
      lines = lines.map(line => line.substring(0, options.limitChars));
    }

    let result: string[] = [];

    // Handle csv-to-table separately as it returns early
    if (mode === "csv-to-table") {
      return lines.join("\n");
    }

    switch (mode) {
      case "text-to-list": {
        const sep = options.inputSeparator === "custom" 
          ? options.customSeparator 
          : options.inputSeparator === "space" 
            ? " " 
            : options.inputSeparator;
        
        result = lines.flatMap(line => 
          line.split(sep).map(item => options.trimWhitespace ? item.trim() : item)
        );
        
        if (options.removeEmpty) {
          result = result.filter(item => item.length > 0);
        }
        break;
      }
      
      case "list-to-text": {
        const sep = options.outputSeparator === "custom" 
          ? options.customOutputSeparator 
          : options.outputSeparator;
        const joinStr = options.addSpaces ? `${sep} ` : sep;
        result = [lines.join(joinStr)];
        break;
      }
      
      case "text-to-csv": {
        result = lines.map(line => {
          const parts = line.split(options.csvInputSeparator);
          if (options.quoteData) {
            return parts.map(p => `"${p.trim().replace(/"/g, '""')}"`).join(",");
          }
          return parts.map(p => p.trim()).join(",");
        });
        break;
      }
      
      case "normalize": {
        result = lines.map(line => {
          const parts = line.split(/\s+/).filter(p => p.length > 0);
          const chunks: string[] = [];
          
          for (let i = 0; i < parts.length; i += options.columnCount) {
            chunks.push(parts.slice(i, i + options.columnCount).join(options.normalizeOutputSeparator));
          }
          
          return chunks.join("\n");
        });
        break;
      }
    }

    // Add line numbers
    if (options.addLineNumbers) {
      result = result.map((line, idx) => `${options.startNumber + idx}. ${line}`);
    }

    return result.join("\n");
  }, [input, mode, options]);

  // Parse CSV for table view
  const tableData = useMemo(() => {
    if (mode !== "csv-to-table" || !input.trim()) return { headers: [], rows: [] };
    
    const lines = input.split("\n").filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const parseCSVLine = (line: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && !inQuotes) {
          inQuotes = true;
        } else if (char === '"' && inQuotes) {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const allRows = lines.map(parseCSVLine);
    const maxCols = Math.max(...allRows.map(r => r.length));
    
    // Pad rows to have equal columns
    const paddedRows = allRows.map(row => {
      while (row.length < maxCols) row.push("");
      return row;
    });
    
    const headers = paddedRows[0] || [];
    const rows = paddedRows.slice(1);
    
    // Initialize visible columns
    if (visibleColumns.length !== maxCols) {
      setVisibleColumns(new Array(maxCols).fill(true));
    }
    
    return { headers, rows };
  }, [input, mode, visibleColumns.length]);

  // History management
  const updateInput = useCallback((newInput: string) => {
    setInput(newInput);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newInput);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setInput(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setInput(history[historyIndex + 1]);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Đã copy output!");
    } catch {
      toast.error("Không thể copy");
    }
  };

  const handleClear = () => {
    updateInput("");
    toast.info("Đã xoá input");
  };

  const handleSwap = () => {
    updateInput(output);
    toast.info("Đã hoán đổi input ↔ output");
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Vui lòng nhập tên preset");
      return;
    }
    
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      mode,
      options,
      createdAt: new Date().toISOString(),
    };
    
    savePresets([...presets, newPreset]);
    setPresetName("");
    setSaveDialogOpen(false);
    toast.success(`Đã lưu preset "${newPreset.name}"`);
  };

  const handleLoadPreset = (preset: Preset) => {
    setMode(preset.mode);
    setOptions(preset.options);
    setLoadDialogOpen(false);
    toast.success(`Đã load preset "${preset.name}"`);
  };

  const handleDeletePreset = (id: string) => {
    savePresets(presets.filter(p => p.id !== id));
    toast.success("Đã xoá preset");
  };

  const updateOption = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const toggleColumn = (index: number) => {
    const newVisible = [...visibleColumns];
    newVisible[index] = !newVisible[index];
    setVisibleColumns(newVisible);
  };

  const modeConfig = {
    "text-to-list": { icon: ListOrdered, label: "Text → List", desc: "Tách text thành danh sách" },
    "list-to-text": { icon: FileText, label: "List → Text", desc: "Gộp danh sách thành text" },
    "text-to-csv": { icon: TableIcon, label: "Text → CSV", desc: "Chuyển text sang CSV" },
    "csv-to-table": { icon: Columns, label: "CSV → Table", desc: "Xem CSV dạng bảng" },
    "normalize": { icon: Sparkles, label: "Chuẩn hoá", desc: "Gộp dòng theo cột" },
  };

  const inputStats = useMemo(() => {
    const lines = input.split("\n").filter(l => l.trim()).length;
    const chars = input.length;
    return { lines, chars };
  }, [input]);

  const outputStats = useMemo(() => {
    const lines = output.split("\n").filter(l => l.trim()).length;
    const chars = output.length;
    return { lines, chars };
  }, [output]);

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(modeConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = mode === key;
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(key as ConversionMode)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!output}>
          <Copy className="h-4 w-4 mr-1" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear} disabled={!input}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear
        </Button>
        <Button variant="outline" size="sm" onClick={handleSwap} disabled={!output}>
          <ArrowLeftRight className="h-4 w-4 mr-1" /> Swap
        </Button>
        <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
          <Undo2 className="h-4 w-4 mr-1" /> Undo
        </Button>
        <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo2 className="h-4 w-4 mr-1" /> Redo
        </Button>
        
        <div className="flex-1" />
        
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" /> Lưu Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lưu Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên preset</Label>
                <Input 
                  value={presetName} 
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nhập tên preset..."
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Chế độ: <Badge variant="secondary">{modeConfig[mode].label}</Badge>
              </div>
              <Button onClick={handleSavePreset} className="w-full">
                <Save className="h-4 w-4 mr-2" /> Lưu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={presets.length === 0}>
              <FolderOpen className="h-4 w-4 mr-1" /> Load ({presets.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load Preset</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {presets.map(preset => (
                  <div key={preset.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {modeConfig[preset.mode].label}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleLoadPreset(preset)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeletePreset(preset.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Options Panel */}
      <Collapsible open={showOptions} onOpenChange={setShowOptions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Tuỳ chọn xử lý
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showOptions ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mode-specific options */}
                {mode === "text-to-list" && (
                  <>
                    <div className="space-y-2">
                      <Label>Dấu phân cách đầu vào</Label>
                      <Select value={options.inputSeparator} onValueChange={(v) => updateOption("inputSeparator", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=",">Dấu phẩy (,)</SelectItem>
                          <SelectItem value="|">Gạch đứng (|)</SelectItem>
                          <SelectItem value=";">Chấm phẩy (;)</SelectItem>
                          <SelectItem value="space">Khoảng trắng</SelectItem>
                          <SelectItem value="custom">Tuỳ chỉnh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {options.inputSeparator === "custom" && (
                      <div className="space-y-2">
                        <Label>Dấu tuỳ chỉnh</Label>
                        <Input 
                          value={options.customSeparator} 
                          onChange={(e) => updateOption("customSeparator", e.target.value)}
                          placeholder="Nhập dấu..."
                        />
                      </div>
                    )}
                  </>
                )}

                {mode === "list-to-text" && (
                  <>
                    <div className="space-y-2">
                      <Label>Dấu nối</Label>
                      <Select value={options.outputSeparator} onValueChange={(v) => updateOption("outputSeparator", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="|">Gạch đứng (|)</SelectItem>
                          <SelectItem value=",">Dấu phẩy (,)</SelectItem>
                          <SelectItem value=";">Chấm phẩy (;)</SelectItem>
                          <SelectItem value=" ">Khoảng trắng</SelectItem>
                          <SelectItem value="custom">Tuỳ chỉnh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {options.outputSeparator === "custom" && (
                      <div className="space-y-2">
                        <Label>Dấu tuỳ chỉnh</Label>
                        <Input 
                          value={options.customOutputSeparator} 
                          onChange={(e) => updateOption("customOutputSeparator", e.target.value)}
                          placeholder="Nhập dấu..."
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={options.addSpaces} 
                        onCheckedChange={(v) => updateOption("addSpaces", v)} 
                      />
                      <Label>Thêm khoảng trắng sau dấu</Label>
                    </div>
                  </>
                )}

                {mode === "text-to-csv" && (
                  <>
                    <div className="space-y-2">
                      <Label>Dấu phân cách đầu vào</Label>
                      <Input 
                        value={options.csvInputSeparator} 
                        onChange={(e) => updateOption("csvInputSeparator", e.target.value)}
                        placeholder="|"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={options.quoteData} 
                        onCheckedChange={(v) => updateOption("quoteData", v)} 
                      />
                      <Label>Đặt dữ liệu trong &quot; &quot;</Label>
                    </div>
                  </>
                )}

                {mode === "normalize" && (
                  <>
                    <div className="space-y-2">
                      <Label>Số cột</Label>
                      <Input 
                        type="number"
                        min={1}
                        value={options.columnCount} 
                        onChange={(e) => updateOption("columnCount", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dấu phân cách output</Label>
                      <Input 
                        value={options.normalizeOutputSeparator} 
                        onChange={(e) => updateOption("normalizeOutputSeparator", e.target.value)}
                        placeholder="|"
                      />
                    </div>
                  </>
                )}

                <Separator className="col-span-full" />

                {/* Data cleaning options */}
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={options.trimWhitespace} 
                    onCheckedChange={(v) => updateOption("trimWhitespace", v)} 
                  />
                  <Label>Trim khoảng trắng</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={options.removeEmpty} 
                    onCheckedChange={(v) => updateOption("removeEmpty", v)} 
                  />
                  <Label>Xoá dòng trống</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={options.removeDuplicates} 
                    onCheckedChange={(v) => updateOption("removeDuplicates", v)} 
                  />
                  <Label>Xoá dòng trùng</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={options.removeSpecialChars} 
                    onCheckedChange={(v) => updateOption("removeSpecialChars", v)} 
                  />
                  <Label>Xoá ký tự đặc biệt</Label>
                </div>

                <div className="space-y-2">
                  <Label>Chuyển đổi chữ</Label>
                  <Select value={options.forceCase} onValueChange={(v) => updateOption("forceCase", v as "none" | "lower" | "upper")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không đổi</SelectItem>
                      <SelectItem value="lower">Chữ thường</SelectItem>
                      <SelectItem value="upper">Chữ HOA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Giới hạn ký tự (0 = không giới hạn)</Label>
                  <Input 
                    type="number"
                    min={0}
                    value={options.limitChars} 
                    onChange={(e) => updateOption("limitChars", parseInt(e.target.value) || 0)}
                  />
                </div>

                <Separator className="col-span-full" />

                {/* Line numbering */}
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={options.addLineNumbers} 
                    onCheckedChange={(v) => updateOption("addLineNumbers", v)} 
                  />
                  <Label>Đánh số dòng</Label>
                </div>
                {options.addLineNumbers && (
                  <div className="space-y-2">
                    <Label>Bắt đầu từ số</Label>
                    <Input 
                      type="number"
                      min={0}
                      value={options.startNumber} 
                      onChange={(e) => updateOption("startNumber", parseInt(e.target.value) || 1)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Main Content - Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Input</CardTitle>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{inputStats.lines} dòng</Badge>
                <Badge variant="outline">{inputStats.chars} ký tự</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => updateInput(e.target.value)}
              placeholder={
                mode === "text-to-list" ? "a,b,c,d hoặc a|b|c|d..." :
                mode === "list-to-text" ? "Mỗi dòng một item..." :
                mode === "text-to-csv" ? "email|password|cookie..." :
                mode === "csv-to-table" ? "header1,header2,header3\ndata1,data2,data3..." :
                "email1 pass1 cookie1\nemail2 pass2 cookie2..."
              }
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Output</CardTitle>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{outputStats.lines} dòng</Badge>
                <Badge variant="outline">{outputStats.chars} ký tự</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mode === "csv-to-table" ? (
              <div className="space-y-4">
                {/* Column visibility toggles */}
                {tableData.headers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tableData.headers.map((header, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Checkbox 
                          checked={visibleColumns[idx] !== false} 
                          onCheckedChange={() => toggleColumn(idx)}
                        />
                        <Label className="text-xs">{header || `Col ${idx + 1}`}</Label>
                      </div>
                    ))}
                  </div>
                )}
                
                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Hash className="h-4 w-4" />
                        </TableHead>
                        {tableData.headers.map((header, idx) => 
                          visibleColumns[idx] !== false && (
                            <TableHead key={idx}>{header || `Col ${idx + 1}`}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.rows.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          <TableCell className="text-muted-foreground text-xs">{rowIdx + 1}</TableCell>
                          {row.map((cell, cellIdx) =>
                            visibleColumns[cellIdx] !== false && (
                              <TableCell key={cellIdx}>{cell}</TableCell>
                            )
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <Textarea
                value={output}
                readOnly
                className="min-h-[300px] font-mono text-sm bg-muted/50"
                placeholder="Kết quả sẽ hiển thị ở đây..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormatConverter;
