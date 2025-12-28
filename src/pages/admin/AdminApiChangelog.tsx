import { useState } from 'react';
import { useApiChangelog, useCreateChangelog, useDeleteChangelog } from '@/hooks/useApiChangelog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, History, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangeEntry {
  type: string;
  description: string;
}

const AdminApiChangelog = () => {
  const { t } = useLanguage();
  const { formatDate } = useDateFormat();
  const { data: changelog, isLoading } = useApiChangelog();
  const createChangelog = useCreateChangelog();
  const deleteChangelog = useDeleteChangelog();

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
    is_breaking: false,
    published_at: new Date().toISOString().split('T')[0],
  });
  const [changes, setChanges] = useState<ChangeEntry[]>([{ type: 'added', description: '' }]);

  const resetForm = () => {
    setFormData({
      version: '',
      title: '',
      description: '',
      is_breaking: false,
      published_at: new Date().toISOString().split('T')[0],
    });
    setChanges([{ type: 'added', description: '' }]);
  };

  const handleAddChange = () => {
    setChanges([...changes, { type: 'added', description: '' }]);
  };

  const handleRemoveChange = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  const handleChangeUpdate = (index: number, field: 'type' | 'description', value: string) => {
    const newChanges = [...changes];
    newChanges[index][field] = value;
    setChanges(newChanges);
  };

  const handleSubmit = () => {
    if (!formData.version || !formData.title) {
      toast.error(t('pleaseEnterVersionAndTitle'));
      return;
    }

    const validChanges = changes.filter(c => c.description.trim());
    if (validChanges.length === 0) {
      toast.error(t('pleaseAddAtLeastOneChange'));
      return;
    }

    createChangelog.mutate({
      version: formData.version,
      title: formData.title,
      description: formData.description || null,
      is_breaking: formData.is_breaking,
      published_at: new Date(formData.published_at).toISOString(),
      changes: validChanges,
    }, {
      onSuccess: () => {
        setShowDialog(false);
        resetForm();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDeleteChangelog'))) {
      deleteChangelog.mutate(id);
    }
  };

  const getTypeBadge = (type: string) => {
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
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const breakingCount = changelog?.filter(c => c.is_breaking).length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('manageApiChangelog')}</h1>
            <p className="text-sm text-muted-foreground">{t('manageApiChangeHistory')}</p>
          </div>
        </div>
        <Button onClick={() => setShowDialog(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {t('addVersion')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('totalVersions')}</p>
                <p className="text-xl font-bold">{changelog?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Breaking changes</p>
                <p className="text-xl font-bold">{breakingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Plus className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('latestVersion')}</p>
                <p className="text-xl font-bold font-mono">
                  {changelog?.[0]?.version ? `v${changelog[0].version}` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {changelog?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('noChangelogYet')}
            </CardContent>
          </Card>
        ) : (
          changelog?.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono">v{entry.version}</Badge>
                    {entry.is_breaking && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Breaking
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <p className="font-medium">{entry.title}</p>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{entry.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {entry.changes?.slice(0, 4).map((change, i) => (
                    <span key={i}>{getTypeBadge(change.type)}</span>
                  ))}
                  {entry.changes?.length > 4 && (
                    <Badge variant="secondary">+{entry.changes.length - 4}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.published_at)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base">{t('apiChangeHistory')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {changelog?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noChangelogYet')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('version')}</TableHead>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('changes')}</TableHead>
                  <TableHead>{t('releaseDate')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changelog?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">v{entry.version}</Badge>
                        {entry.is_breaking && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Breaking
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{entry.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.changes?.slice(0, 3).map((change, i) => (
                          <span key={i}>{getTypeBadge(change.type)}</span>
                        ))}
                        {entry.changes?.length > 3 && (
                          <Badge variant="secondary">+{entry.changes.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(entry.published_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addNewVersion')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('version')} *</Label>
                <Input
                  placeholder="1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('releaseDate')}</Label>
                <Input
                  type="date"
                  value={formData.published_at}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('title')} *</Label>
              <Input
                placeholder={t('versionName')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Textarea
                placeholder={t('shortDescriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_breaking}
                onCheckedChange={(checked) => setFormData({ ...formData, is_breaking: checked })}
              />
              <Label>Breaking Change</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('changeList')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddChange}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('add')}
                </Button>
              </div>

              {changes.map((change, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Select
                    value={change.type}
                    onValueChange={(value) => handleChangeUpdate(index, 'type', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="added">Added</SelectItem>
                      <SelectItem value="changed">Changed</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="removed">Removed</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t('describeChange')}
                    value={change.description}
                    onChange={(e) => handleChangeUpdate(index, 'description', e.target.value)}
                    className="flex-1"
                  />
                  {changes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveChange(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={createChangelog.isPending}>
              {createChangelog.isPending ? t('creating') : t('createChangelog')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApiChangelog;
