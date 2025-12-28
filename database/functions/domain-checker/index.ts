import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchNsRecords(domain: string) {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`
    );
    const data = await response.json();
    
    if (data.Answer) {
      return data.Answer.map((record: any) => ({
        type: 'NS',
        value: record.data.replace(/\.$/, ''),
        ttl: record.TTL,
      }));
    }
    return [];
  } catch (error) {
    console.error('NS lookup error:', error);
    return [];
  }
}

async function fetchDsRecords(domain: string) {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=DS`
    );
    const data = await response.json();
    
    if (data.Answer) {
      return data.Answer.map((record: any) => ({
        type: 'DS',
        value: record.data,
      }));
    }
    return [];
  } catch (error) {
    console.error('DS lookup error:', error);
    return [];
  }
}

async function fetchWhoisInfo(domain: string) {
  try {
    const tld = domain.split('.').pop()?.toLowerCase() || '';
    
    // Thử who-dat.as93.net API trước (miễn phí, không cần key, hỗ trợ nhiều TLD)
    let whoisData: any = null;
    
    try {
      console.log('Trying who-dat API for', domain);
      const response = await fetch(`https://who-dat.as93.net/${encodeURIComponent(domain)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        whoisData = await response.json();
        console.log('who-dat API success for', domain);
      }
    } catch (e) {
      console.log('who-dat API failed:', e);
    }

    // Nếu who-dat có dữ liệu
    if (whoisData && !whoisData.error) {
      const whoisInfo: any = {
        domain: domain,
        nameServers: [],
        status: [],
      };

      // Registrar
      if (whoisData.registrar) {
        whoisInfo.registrar = whoisData.registrar;
      }

      // Dates
      if (whoisData.creation_date || whoisData.creationDate) {
        whoisInfo.creationDate = formatDate(whoisData.creation_date || whoisData.creationDate);
      }
      if (whoisData.expiration_date || whoisData.expirationDate) {
        whoisInfo.expiryDate = formatDate(whoisData.expiration_date || whoisData.expirationDate);
      }
      if (whoisData.updated_date || whoisData.updatedDate) {
        whoisInfo.updatedDate = formatDate(whoisData.updated_date || whoisData.updatedDate);
      }

      // Name servers
      if (whoisData.name_servers || whoisData.nameServers) {
        const ns = whoisData.name_servers || whoisData.nameServers;
        whoisInfo.nameServers = Array.isArray(ns) ? ns.map((n: string) => n.toLowerCase()) : [];
      }

      // Status
      if (whoisData.status) {
        whoisInfo.status = Array.isArray(whoisData.status) ? whoisData.status : [whoisData.status];
      }

      // DNSSEC
      if (whoisData.dnssec !== undefined) {
        whoisInfo.dnssec = whoisData.dnssec ? 'Đã kích hoạt' : 'Chưa kích hoạt';
      }

      // Registrant info
      if (whoisData.registrant) {
        whoisInfo.registrant = whoisData.registrant;
      }
      if (whoisData.registrant_name) {
        whoisInfo.registrantName = whoisData.registrant_name;
      }
      if (whoisData.registrant_organization) {
        whoisInfo.registrantOrg = whoisData.registrant_organization;
      }

      // Fallback: nếu không có nameservers, lấy từ DNS
      if (whoisInfo.nameServers.length === 0) {
        const nsRecords = await fetchNsRecords(domain);
        whoisInfo.nameServers = nsRecords.map((r: any) => r.value);
      }

      return whoisInfo;
    }

    // Fallback: thử RDAP
    let rdapBaseUrl = '';
    
    const rdapServers: Record<string, string> = {
      'com': 'https://rdap.verisign.com/com/v1',
      'net': 'https://rdap.verisign.com/net/v1',
      'org': 'https://rdap.publicinterestregistry.org/rdap',
      'info': 'https://rdap.afilias.net/rdap/info',
      'biz': 'https://rdap.afilias.net/rdap/biz',
      'io': 'https://rdap.nic.io',
      'co': 'https://rdap.nic.co',
      'me': 'https://rdap.nic.me',
      'app': 'https://rdap.nic.google',
      'dev': 'https://rdap.nic.google',
      'xyz': 'https://rdap.centralnic.com/xyz',
      'online': 'https://rdap.centralnic.com/online',
      'store': 'https://rdap.centralnic.com/store',
      'tech': 'https://rdap.centralnic.com/tech',
      'site': 'https://rdap.centralnic.com/site',
      'shop': 'https://rdap.centralnic.com/shop',
      'cloud': 'https://rdap.donuts.co/rdap',
      'live': 'https://rdap.donuts.co/rdap',
    };

    rdapBaseUrl = rdapServers[tld] || '';

    let rdapData: any = null;

    if (rdapBaseUrl) {
      try {
        const response = await fetch(`${rdapBaseUrl}/domain/${encodeURIComponent(domain)}`, {
          headers: { 'Accept': 'application/rdap+json' }
        });
        if (response.ok) {
          rdapData = await response.json();
        }
      } catch (e) {
        console.log('RDAP specific server failed:', e);
      }
    }

    if (!rdapData) {
      try {
        const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
          headers: { 'Accept': 'application/rdap+json' }
        });
        if (response.ok) {
          rdapData = await response.json();
        }
      } catch (e) {
        console.log('rdap.org failed:', e);
      }
    }

    const whoisInfo: any = {
      domain: domain,
      nameServers: [],
      status: [],
    };

    if (rdapData) {
      console.log('RDAP data found for', domain);
      
      if (rdapData.entities) {
        const registrar = rdapData.entities.find((e: any) => 
          e.roles?.includes('registrar')
        );
        if (registrar?.vcardArray) {
          const vcard = registrar.vcardArray[1];
          const fnEntry = vcard?.find((v: any) => v[0] === 'fn');
          if (fnEntry) {
            whoisInfo.registrar = fnEntry[3];
          }
        }
        if (!whoisInfo.registrar && registrar?.publicIds) {
          whoisInfo.registrar = registrar.publicIds[0]?.identifier;
        }
        if (!whoisInfo.registrar && registrar?.handle) {
          whoisInfo.registrar = registrar.handle;
        }
      }

      if (rdapData.events) {
        for (const event of rdapData.events) {
          if (event.eventAction === 'registration') {
            whoisInfo.creationDate = formatDate(event.eventDate);
          } else if (event.eventAction === 'expiration') {
            whoisInfo.expiryDate = formatDate(event.eventDate);
          } else if (event.eventAction === 'last changed' || event.eventAction === 'last update of RDAP database') {
            whoisInfo.updatedDate = formatDate(event.eventDate);
          }
        }
      }

      if (rdapData.nameservers) {
        whoisInfo.nameServers = rdapData.nameservers.map((ns: any) => 
          ns.ldhName?.toLowerCase() || ns.unicodeName?.toLowerCase()
        ).filter(Boolean);
      }

      if (rdapData.status) {
        whoisInfo.status = rdapData.status;
      }

      if (rdapData.secureDNS) {
        whoisInfo.dnssec = rdapData.secureDNS.delegationSigned ? 'Đã kích hoạt' : 'Chưa kích hoạt';
      }
    } else {
      console.log('No WHOIS/RDAP data found for', domain);
      
      const whoisLinks: Record<string, string> = {
        'vn': 'https://www.vnnic.vn/whois-information',
        'jp': 'https://whois.jprs.jp/',
        'kr': 'https://whois.kr/',
        'cn': 'https://whois.cnnic.cn/',
        'tw': 'https://whois.twnic.net.tw/',
        'ru': 'https://www.nic.ru/whois/',
        'br': 'https://registro.br/tecnologia/ferramentas/whois/',
        'uk': 'https://www.nominet.uk/whois/',
      };
      
      const whoisLink = whoisLinks[tld];
      if (whoisLink) {
        whoisInfo.note = `TLD .${tld} không hỗ trợ tra cứu tự động. Tra cứu WHOIS tại: ${whoisLink}`;
      } else {
        whoisInfo.note = `TLD .${tld} không hỗ trợ tra cứu tự động. Vui lòng tra cứu WHOIS tại nhà đăng ký domain.`;
      }
    }

    if (whoisInfo.nameServers.length === 0) {
      const nsRecords = await fetchNsRecords(domain);
      whoisInfo.nameServers = nsRecords.map((r: any) => r.value);
    }

    return whoisInfo;
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    const nsRecords = await fetchNsRecords(domain);
    return {
      domain: domain,
      nameServers: nsRecords.map((r: any) => r.value),
      note: 'Không thể lấy thông tin WHOIS đầy đủ',
    };
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, type } = await req.json();

    if (!domain) {
      throw new Error('Domain is required');
    }

    console.log(`Checking domain: ${domain}, type: ${type}`);

    // Nếu type = 'all' hoặc không chỉ định, fetch tất cả
    if (type === 'all' || !type) {
      const [ns, ds, whois] = await Promise.all([
        fetchNsRecords(domain),
        fetchDsRecords(domain),
        fetchWhoisInfo(domain),
      ]);

      console.log('Full check result:', { ns: ns.length, ds: ds.length, whois: !!whois });

      return new Response(JSON.stringify({ ns, ds, whois }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch theo loại cụ thể
    let result: any = {};

    if (type === 'ns') {
      result.ns = await fetchNsRecords(domain);
    } else if (type === 'ds') {
      result.ds = await fetchDsRecords(domain);
    } else if (type === 'whois') {
      result.whois = await fetchWhoisInfo(domain);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Domain checker error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to check domain' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
