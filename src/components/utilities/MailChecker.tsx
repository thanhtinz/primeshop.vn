import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface MailResult {
  email: string;
  status: 'live' | 'die' | 'unknown';
  message?: string;
}

export function MailChecker() {
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MailResult[]>([]);
  const [progress, setProgress] = useState(0);

  const handleCheck = async () => {
    const emailList = emails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    if (emailList.length === 0) {
      toast.error('Vui lòng nhập ít nhất một email hợp lệ');
      return;
    }

    if (emailList.length > 50) {
      toast.error('Chỉ hỗ trợ tối đa 50 email mỗi lần');
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('mail-checker', {
        body: { emails: emailList },
      });

      if (error) throw error;

      if (data.results) {
        setResults(data.results);
        const liveCount = data.results.filter((r: MailResult) => r.status === 'live').length;
        toast.success(`Hoàn tất: ${liveCount}/${data.results.length} email live`);
      }
    } catch (error: any) {
      console.error('Mail check error:', error);
      toast.error(error.message || 'Không thể kiểm tra email');
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const exportResults = (status: 'live' | 'die' | 'all') => {
    let exportData = results;
    if (status !== 'all') {
      exportData = results.filter(r => r.status === status);
    }

    if (exportData.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const content = exportData.map(r => r.email).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails_${status}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${exportData.length} email`);
  };

  const liveCount = results.filter(r => r.status === 'live').length;
  const dieCount = results.filter(r => r.status === 'die').length;
  const unknownCount = results.filter(r => r.status === 'unknown').length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Danh sách Email (mỗi email một dòng)</Label>
        <Textarea
          placeholder="email1@gmail.com&#10;email2@yahoo.com&#10;email3@outlook.com"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          Tối đa 50 email mỗi lần kiểm tra
        </p>
      </div>

      <Button onClick={handleCheck} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Đang kiểm tra...
          </>
        ) : (
          'Kiểm tra'
        )}
      </Button>

      {loading && <Progress value={progress} className="h-2" />}

      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-500">{liveCount}</p>
              <p className="text-xs text-muted-foreground">Live</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-500">{dieCount}</p>
              <p className="text-xs text-muted-foreground">Die</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-yellow-500">{unknownCount}</p>
              <p className="text-xs text-muted-foreground">Unknown</p>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => exportResults('live')}>
              <Download className="h-4 w-4 mr-1" />
              Xuất Live ({liveCount})
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportResults('die')}>
              <Download className="h-4 w-4 mr-1" />
              Xuất Die ({dieCount})
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportResults('all')}>
              <Download className="h-4 w-4 mr-1" />
              Xuất tất cả
            </Button>
          </div>

          {/* Results list */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-md text-sm ${
                  result.status === 'live'
                    ? 'bg-green-500/10'
                    : result.status === 'die'
                    ? 'bg-red-500/10'
                    : 'bg-yellow-500/10'
                }`}
              >
                <span className="font-mono truncate">{result.email}</span>
                <div className="flex items-center gap-1">
                  {result.status === 'live' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : result.status === 'die' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-xs uppercase font-medium">{result.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
