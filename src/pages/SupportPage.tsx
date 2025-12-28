import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTickets } from '@/hooks/useTickets';
import { useMyTicketsToSellers } from '@/hooks/useSellerTickets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Shield, Store, Loader2 } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { BuyerShopTickets } from '@/components/profile/BuyerShopTickets';

export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatDateTime } = useDateFormat();
  const { tickets, isLoading, createTicket } = useTickets();
  const { data: shopTickets, isLoading: shopTicketsLoading } = useMyTicketsToSellers();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'general', message: '' });

  const categories = [
    { value: 'general', label: t('categoryGeneral') },
    { value: 'order', label: t('categoryOrder') },
    { value: 'payment', label: t('categoryPayment') },
    { value: 'account', label: t('categoryAccount') },
    { value: 'technical', label: t('categoryTechnical') },
    { value: 'other', label: t('categoryOther') },
  ];

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    open: { label: t('statusOpen'), variant: 'default', icon: <AlertCircle className="h-3 w-3" /> },
    pending: { label: t('statusPending'), variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    resolved: { label: t('statusResolved'), variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
    closed: { label: t('statusClosed'), variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) return;
    
    await createTicket.mutateAsync(newTicket);
    setNewTicket({ subject: '', category: 'general', message: '' });
    setIsCreateOpen(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('loginToUseSupport')}</h2>
              <p className="text-muted-foreground mb-4">{t('loginToUseSupportDesc')}</p>
              <Button asChild>
                <Link to="/auth">{t('login')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const systemTicketCount = tickets?.length || 0;
  const shopTicketCount = shopTickets?.length || 0;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('support')}</h1>
            <p className="text-muted-foreground">{t('manageSupportRequests')}</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createTicket')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewTicket')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">{t('ticketSubject')}</label>
                  <Input
                    placeholder={t('ticketSubjectPlaceholder')}
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('ticketCategory')}</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('ticketContent')}</label>
                  <Textarea
                    placeholder={t('ticketContentPlaceholder')}
                    rows={5}
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateTicket}
                  disabled={createTicket.isPending || !newTicket.subject || !newTicket.message}
                >
                  {createTicket.isPending ? t('creating') : t('createTicket')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('allTickets')}
              <Badge variant="secondary" className="ml-1 text-xs">
                {systemTicketCount + shopTicketCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('systemTickets')}
              <Badge variant="secondary" className="ml-1 text-xs">
                {systemTicketCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              {t('shopTickets')}
              <Badge variant="secondary" className="ml-1 text-xs">
                {shopTicketCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading || shopTicketsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (systemTicketCount + shopTicketCount) > 0 ? (
              <div className="space-y-4">
                {/* System Tickets */}
                {tickets?.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.open;
                  const category = categories.find((c) => c.value === ticket.category);
                  
                  return (
                    <Link key={ticket.id} to={`/support/${ticket.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {t('systemLabel')}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {ticket.ticket_number}
                                </span>
                                <Badge variant={status.variant} className="text-xs">
                                  {status.icon}
                                  <span className="ml-1">{status.label}</span>
                                </Badge>
                              </div>
                              <h3 className="font-medium text-foreground truncate">
                                {ticket.subject}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{category?.label || ticket.category}</span>
                                <span>•</span>
                                <span>{formatDateTime(ticket.created_at)}</span>
                              </div>
                            </div>
                            <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}

                {/* Shop Tickets */}
                {shopTickets?.map((ticket: any) => {
                  const shopStatus = statusConfig[ticket.status] || statusConfig.open;
                  
                  return (
                    <Card key={ticket.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                                <Store className="h-3 w-3 mr-1" />
                                {ticket.seller?.shop_name || 'Shop'}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                #{ticket.ticket_number}
                              </span>
                              <Badge variant={shopStatus.variant} className="text-xs">
                                {shopStatus.icon}
                                <span className="ml-1">{shopStatus.label}</span>
                              </Badge>
                            </div>
                            <h3 className="font-medium text-foreground truncate">
                              {ticket.subject}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{formatDateTime(ticket.created_at)}</span>
                            </div>
                          </div>
                          <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('noTicketsYet')}</h3>
                  <p className="text-muted-foreground mb-4">{t('createFirstTicketDesc')}</p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createFirstTicket')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="system">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.open;
                  const category = categories.find((c) => c.value === ticket.category);
                  
                  return (
                    <Link key={ticket.id} to={`/support/${ticket.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {t('systemLabel')}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {ticket.ticket_number}
                                </span>
                                <Badge variant={status.variant} className="text-xs">
                                  {status.icon}
                                  <span className="ml-1">{status.label}</span>
                                </Badge>
                              </div>
                              <h3 className="font-medium text-foreground truncate">
                                {ticket.subject}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{category?.label || ticket.category}</span>
                                <span>•</span>
                                <span>{formatDateTime(ticket.created_at)}</span>
                              </div>
                            </div>
                            <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('noSystemTickets')}</h3>
                  <p className="text-muted-foreground mb-4">{t('noSystemTicketsDesc')}</p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createNewTicket')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="shop">
            <BuyerShopTickets />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}