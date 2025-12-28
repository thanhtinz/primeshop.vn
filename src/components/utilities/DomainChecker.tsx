import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Copy, Check, Server, Shield, FileText, Calendar, Building, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

interface WhoisInfo {
  domain: string;
  registrar?: string;
  creationDate?: string;
  expiryDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  dnssec?: string;
  note?: string;
}

export function DomainChecker() {
  const [domain, setDomain] = useState('');
  const [activeTab, setActiveTab] = useState('ns');
  const [loading, setLoading] = useState(false);
  const [nsRecords, setNsRecords] = useState<DnsRecord[]>([]);
  const [dsRecords, setDsRecords] = useState<DnsRecord[]>([]);
  const [whoisInfo, setWhoisInfo] = useState<WhoisInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const cleanDomain = (input: string): string => {
    let cleaned = input.trim().toLowerCase();
    cleaned = cleaned.replace(/^https?:\/\//, '');
    cleaned = cleaned.replace(/^www\./, '');
    cleaned = cleaned.split('/')[0];
    return cleaned;
  };

  const handleCheck = async () => {
    const cleanedDomain = cleanDomain(domain);
    if (!cleanedDomain) {
      toast.error('Vui lòng nhập tên miền');
      return;
    }

    setLoading(true);
    setNsRecords([]);
    setDsRecords([]);
    setWhoisInfo(null);
    setHasData(false);

    try {
      // Fetch tất cả thông tin cùng lúc
      const { data, error } = await supabase.functions.invoke('domain-checker', {
        body: { domain: cleanedDomain, type: 'all' },
      });

      if (error) throw error;

      if (data.ns) setNsRecords(data.ns);
      if (data.ds) setDsRecords(data.ds);
      if (data.whois) setWhoisInfo(data.whois);
      
      setHasData(true);
      toast.success('Đã kiểm tra thành công');
    } catch (error: any) {
      console.error('Domain check error:', error);
      toast.error(error.message || 'Không thể kiểm tra domain');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    toast.success('Đã copy');
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('clientDeleteProhibited') || status.includes('serverDeleteProhibited')) {
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
    if (status.includes('clientTransferProhibited') || status.includes('serverTransferProhibited')) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
    if (status.includes('pendingDelete') || status.includes('redemptionPeriod')) {
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tên miền</Label>
        <div className="flex gap-2">
          <Input
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <Button onClick={handleCheck} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kiểm tra'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Bấm kiểm tra 1 lần để lấy đầy đủ thông tin NS, DS và WHOIS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ns" className="flex items-center gap-1">
            <Server className="h-4 w-4" />
            NS {hasData && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{nsRecords.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ds" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            DS {hasData && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{dsRecords.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="whois" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            WHOIS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ns" className="mt-4">
          {nsRecords.length > 0 ? (
            <div className="space-y-2">
              {nsRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between bg-muted/50 rounded-md p-3">
                  <div>
                    <p className="font-mono text-sm">{record.value}</p>
                    {record.ttl && <p className="text-xs text-muted-foreground">TTL: {record.ttl}s</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(record.value)}
                  >
                    {copied === record.value ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {hasData ? 'Không tìm thấy NS records' : 'Nhập tên miền và bấm Kiểm tra'}
            </p>
          )}
        </TabsContent>

        <TabsContent value="ds" className="mt-4">
          {dsRecords.length > 0 ? (
            <div className="space-y-2">
              {dsRecords.map((record, index) => (
                <div key={index} className="bg-muted/50 rounded-md p-3">
                  <p className="font-mono text-sm break-all">{record.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {hasData ? 'Domain chưa kích hoạt DNSSEC (không có DS records)' : 'Nhập tên miền và bấm Kiểm tra'}
            </p>
          )}
        </TabsContent>

        <TabsContent value="whois" className="mt-4">
          {whoisInfo ? (
            <div className="space-y-3">
              <div className="grid gap-3">
                {/* Domain */}
                <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Domain</p>
                    <p className="font-mono text-sm font-medium">{whoisInfo.domain}</p>
                  </div>
                </div>

                {/* Registrar */}
                {whoisInfo.registrar && (
                  <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                    <Building className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Nhà đăng ký (Registrar)</p>
                      <p className="text-sm">{whoisInfo.registrar}</p>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {whoisInfo.creationDate && (
                    <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                      <Calendar className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày đăng ký</p>
                        <p className="text-sm">{whoisInfo.creationDate}</p>
                      </div>
                    </div>
                  )}
                  {whoisInfo.expiryDate && (
                    <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                      <Calendar className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày hết hạn</p>
                        <p className="text-sm">{whoisInfo.expiryDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {whoisInfo.updatedDate && (
                  <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cập nhật lần cuối</p>
                      <p className="text-sm">{whoisInfo.updatedDate}</p>
                    </div>
                  </div>
                )}

                {/* DNSSEC */}
                {whoisInfo.dnssec && (
                  <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                    <Shield className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">DNSSEC</p>
                      <p className="text-sm">{whoisInfo.dnssec}</p>
                    </div>
                  </div>
                )}

                {/* Name Servers */}
                {whoisInfo.nameServers && whoisInfo.nameServers.length > 0 && (
                  <div className="bg-muted/50 rounded-md p-3 flex items-start gap-3">
                    <Server className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-2">Name Servers</p>
                      <div className="space-y-1">
                        {whoisInfo.nameServers.map((ns, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <p className="font-mono text-sm">{ns}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(ns)}
                            >
                              {copied === ns ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                {whoisInfo.status && whoisInfo.status.length > 0 && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-2">Trạng thái</p>
                    <div className="flex flex-wrap gap-1.5">
                      {whoisInfo.status.map((status, i) => (
                        <Badge key={i} variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                          {status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note - khi TLD không hỗ trợ RDAP */}
                {whoisInfo.note && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                    {whoisInfo.note.includes('http') ? (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {whoisInfo.note.split(': ')[0]}:{' '}
                        <a 
                          href={whoisInfo.note.split(': ')[1]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-500"
                        >
                          {whoisInfo.note.split(': ')[1]}
                        </a>
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">{whoisInfo.note}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {hasData ? 'Không tìm thấy thông tin WHOIS' : 'Nhập tên miền và bấm Kiểm tra'}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
