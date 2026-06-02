'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/src/i18n';
import type { BillingInvoice, BillingPaymentMethod } from '@repo/contracts/payments';

type InvoicesResponse = { invoices: BillingInvoice[] };

const CURRENCY_FORMATTERS: Record<string, Intl.NumberFormat> = {
  eur: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
  usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

function formatAmount(cents: number, currency: string): string {
  const formatter = CURRENCY_FORMATTERS[currency.toLowerCase()];
  const value = cents / 100;
  return formatter ? formatter.format(value) : `${value.toFixed(2)} ${currency.toUpperCase()}`;
}

export default function BillingPage() {
  const { tp } = useI18n();
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  const copy = useMemo(
    () => ({
      title: tp('title', 'Facturation'),
      subtitle: tp(
        'subtitle',
        'Téléchargez vos factures Stripe et gérez votre moyen de paiement enregistré.'
      ),
      savedCardTitle: tp('savedCardTitle', 'Carte enregistrée'),
      savedCardDescription: tp(
        'savedCardDescription',
        'Cette carte est utilisée uniquement pour les achats prépayés (dont auto-reload).'
      ),
      noCard: tp('noCard', 'Aucune carte enregistrée'),
      removeCard: tp('removeCard', 'Supprimer la carte enregistrée'),
      removeCardHint: tp(
        'removeCardHint',
        "La suppression désactive aussi la recharge automatique jusqu'à un nouveau checkout manuel."
      ),
      removeSuccess: tp('removeSuccess', 'Carte supprimée. Auto-reload désactivé.'),
      removeFailed: tp('removeFailed', 'Impossible de supprimer la carte enregistrée.'),
      invoicesTitle: tp('invoicesTitle', 'Factures'),
      invoicesDescription: tp(
        'invoicesDescription',
        'Historique des factures Stripe liées à vos achats.'
      ),
      documentTypeInvoice: tp('documentTypeInvoice', 'Facture'),
      documentTypeReceipt: tp('documentTypeReceipt', 'Reçu'),
      noInvoices: tp('noInvoices', 'Aucune facture disponible pour le moment.'),
      statusPaid: tp('statusPaid', 'payée'),
      statusOpen: tp('statusOpen', 'ouverte'),
      statusDraft: tp('statusDraft', 'brouillon'),
      statusVoid: tp('statusVoid', 'annulée'),
      downloadPdf: tp('downloadPdf', 'PDF'),
      openHosted: tp('openHosted', 'Voir en ligne'),
      loadFailed: tp('loadFailed', 'Impossible de charger la facturation.'),
    }),
    [tp]
  );

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const [pmRes, invoicesRes] = await Promise.all([
        fetch('/api/billing/payment-method', { cache: 'no-store' }),
        fetch('/api/billing/invoices', { cache: 'no-store' }),
      ]);

      if (!pmRes.ok || !invoicesRes.ok) {
        toast.error(copy.loadFailed);
        return;
      }

      const pmJson = (await pmRes.json()) as BillingPaymentMethod;
      const invoicesJson = (await invoicesRes.json()) as InvoicesResponse;
      setPaymentMethod(pmJson);
      setInvoices(invoicesJson.invoices);
    } catch {
      toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const removeCard = async () => {
    setRemoving(true);
    try {
      const res = await fetch('/api/billing/payment-method', { method: 'DELETE' });
      if (!res.ok) {
        toast.error(copy.removeFailed);
        return;
      }
      toast.success(copy.removeSuccess);
      await loadBilling();
    } catch {
      toast.error(copy.removeFailed);
    } finally {
      setRemoving(false);
    }
  };

  const statusLabel = (status: string | null): string => {
    if (status === 'paid') return copy.statusPaid;
    if (status === 'open') return copy.statusOpen;
    if (status === 'draft') return copy.statusDraft;
    if (status === 'void') return copy.statusVoid;
    return status ?? '-';
  };

  const documentTypeLabel = (documentType: BillingInvoice['documentType']): string => {
    return documentType === 'receipt' ? copy.documentTypeReceipt : copy.documentTypeInvoice;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{copy.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {copy.savedCardTitle}
          </CardTitle>
          <CardDescription>{copy.savedCardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">...</p>
          ) : paymentMethod?.hasSavedPaymentMethod ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {paymentMethod.brand?.toUpperCase() ?? 'CARD'} •••• {paymentMethod.last4 ?? '----'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  exp {paymentMethod.expMonth ?? '--'}/{paymentMethod.expYear ?? '--'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{copy.removeCardHint}</p>
              <Button variant="destructive" onClick={() => void removeCard()} loading={removing}>
                <Trash2 className="mr-2 h-4 w-4" />
                {copy.removeCard}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.noCard}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {copy.invoicesTitle}
          </CardTitle>
          <CardDescription>{copy.invoicesDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.noInvoices}</p>
          ) : (
            <div className="divide-y rounded-md border">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {invoice.number ?? invoice.id} - {formatAmount(invoice.amountPaidCents, invoice.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {documentTypeLabel(invoice.documentType)} -{' '}
                      {new Date(invoice.createdAt).toLocaleDateString()} - {statusLabel(invoice.status)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice.hostedInvoiceUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                          {copy.openHosted}
                        </a>
                      </Button>
                    )}
                    {invoice.invoicePdfUrl && (
                      <Button asChild size="sm">
                        <a href={invoice.invoicePdfUrl} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          {copy.downloadPdf}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
