import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiChangelog } from '@/hooks/useApiChangelog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useDateFormat } from '@/hooks/useDateFormat';
import { 
  History, Plus, Minus, RefreshCw, AlertTriangle, 
  CheckCircle2, ArrowLeft, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ApiChangelogPage = () => {
  const { language } = useLanguage();
  const { formatDate } = useDateFormat();
  const { data: changelog, isLoading } = useApiChangelog();

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'changed':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'fixed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'deprecated':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeBadge = (type: string) => {
    switch (type) {
      case 'added':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Added</Badge>;
      case 'removed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Removed</Badge>;
      case 'changed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Changed</Badge>;
      case 'fixed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Fixed</Badge>;
      case 'deprecated':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Deprecated</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero */}
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <div className="container py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/api-docs">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <History className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">API Changelog</h1>
                <p className="text-muted-foreground">
                  {language === 'vi' 
                    ? 'Theo dõi các cập nhật và thay đổi của API' 
                    : 'Track API updates and changes'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          <div className="max-w-3xl mx-auto">
            {changelog?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'vi' ? 'Chưa có changelog nào' : 'No changelog entries yet'}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

              <div className="space-y-6">
                {changelog?.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-primary border-4 border-background hidden md:block" />

                    <Card className="md:ml-12">
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                            v{entry.version}
                          </Badge>
                          {entry.is_breaking && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Breaking Change
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground ml-auto">
                            {formatDate(entry.published_at, 'dd MMM yyyy')}
                          </span>
                        </div>
                        <CardTitle className="text-xl mt-2">{entry.title}</CardTitle>
                        {entry.description && (
                          <p className="text-muted-foreground text-sm">{entry.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {entry.changes?.map((change, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                              {getChangeIcon(change.type)}
                              <div className="flex-1">
                                <span className="mr-2">{getChangeBadge(change.type)}</span>
                                <span className="text-foreground">{change.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to docs */}
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link to="/api-docs">
                  <Code className="h-4 w-4 mr-2" />
                  {language === 'vi' ? 'Quay lại API Docs' : 'Back to API Docs'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiChangelogPage;
