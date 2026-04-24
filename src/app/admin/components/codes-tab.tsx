'use client';

import { useState } from 'react';
import { Copy, Ban } from '@/components/ui/icons';
import { Card, Badge, Button, Input } from '@/components/ui';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { type ActivationCode, getVisiblePlanColor, statusLabels } from './shared';

export function CodesTab({
  codes,
  onReload,
}: {
  codes: ActivationCode[];
  onReload: () => void;
}) {
  const [newCodePlan, setNewCodePlan] = useState<'PREMIUM' | 'MASTERIUM'>('PREMIUM');
  const [newCodeDuration, setNewCodeDuration] = useState('30');
  const [bulkCount, setBulkCount] = useState('1');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generateCodes() {
    setGeneratingCode(true);
    setError(null);
    setGeneratedCodes([]);

    const count = Math.min(10, Math.max(1, parseInt(bulkCount) || 1));
    const results: string[] = [];

    try {
      const csrfToken = await getCsrfToken();
      for (let i = 0; i < count; i++) {
        const res = await fetch('/api/v1/admin/activation-codes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            plan: newCodePlan,
            durationDays: parseInt(newCodeDuration),
            batchId: count > 1 ? `batch-${Date.now()}` : undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erreur lors de la generation');
        }

        const data = await res.json();
        results.push(data.code.plainCode);
      }

      setGeneratedCodes(results);
      onReload();
      setNewCodeDuration('30');
      setBulkCount('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setGeneratingCode(false);
    }
  }

  async function revokeCode(codeId: string) {
    if (!confirm('Revoquer ce code ?')) return;
    setRevoking(codeId);
    setError(null);

    try {
      const csrf = await getCsrfToken();
      const res = await fetch('/api/v1/admin/activation-codes/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ codeId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setRevoking(null);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 bg-accent-subtle border-[var(--border-accent)]">
          <p className="text-sm text-accent">{error}</p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Generer des codes d'activation</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="new-code-plan" className="block text-sm font-medium mb-2">Plan</label>
            <select
              id="new-code-plan"
              value={newCodePlan}
              onChange={(e) => setNewCodePlan(e.target.value as 'PREMIUM' | 'MASTERIUM')}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
            >
              <option value="PREMIUM">Premium (99 TND/mois)</option>
              <option value="MASTERIUM">Masterium (129 TND/mois)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duree (jours)</label>
            <Input
              type="number"
              value={newCodeDuration}
              onChange={(e) => setNewCodeDuration(e.target.value)}
              disabled={false}
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quantite (1-10)</label>
            <Input
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              disabled={false}
              placeholder="1"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={generateCodes} disabled={generatingCode} className="w-full">
              {generatingCode ? 'Generation...' : 'Generer'}
            </Button>
          </div>
        </div>
      </Card>

      {generatedCodes.length > 0 && (
        <Card className="p-6 bg-success-subtle border-[var(--border-success)]">
          <h3 className="text-lg font-bold mb-3 text-success">
            {generatedCodes.length} code{generatedCodes.length > 1 ? 's' : ''} genere{generatedCodes.length > 1 ? 's' : ''} !
          </h3>
          <div className="space-y-2">
            {generatedCodes.map((code, i) => (
              <div key={i} className="flex items-center gap-3">
                <code className="flex-1 p-2 bg-surface border border-[var(--border-success)] rounded font-mono text-lg font-bold text-heading">
                  {code}
                </code>
                <Button
                  onClick={() => copyToClipboard(code, `gen-${i}`)}
                  className="bg-success hover:bg-[var(--c-success-hover,var(--color-emerald-700))] text-sm px-3"
                >
                  <Copy className="w-4 h-4 mr-1 inline" />
                  {copied === `gen-${i}` ? 'Copie !' : 'Copier'}
                </Button>
              </div>
            ))}
          </div>
          {generatedCodes.length > 1 && (
            <Button
              onClick={() => copyToClipboard(generatedCodes.join('\n'), 'all')}
              className="mt-3 bg-success hover:bg-[var(--c-success-hover,var(--color-emerald-700))] text-sm"
            >
              {copied === 'all' ? 'Tous copies !' : 'Copier tous les codes'}
            </Button>
          )}
          <p className="text-xs text-success mt-2">
            Ces codes ne seront plus affiches. Assurez-vous de les sauvegarder.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Codes d'activation ({codes.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 px-4">Hash</th>
                <th className="text-left py-2 px-4">Plan</th>
                <th className="text-left py-2 px-4">Duree</th>
                <th className="text-left py-2 px-4">Statut</th>
                <th className="text-left py-2 px-4">Cree le</th>
                <th className="text-left py-2 px-4">Utilise le</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-[var(--border-primary)]">
                  <td className="py-2 px-4 font-mono text-xs">
                    {code.codeHash.substring(0, 8)}...
                  </td>
                  <td className="py-2 px-4">
                    <Badge className={getVisiblePlanColor(code.plan)}>
                      {formatPlanLabel(code.plan)}
                    </Badge>
                  </td>
                  <td className="py-2 px-4">
                    {code.durationDays >= 365
                      ? `${Math.round(code.durationDays / 365)} an(s)`
                      : `${code.durationDays} jours`}
                  </td>
                  <td className="py-2 px-4">
                    <Badge
                      className={
                        code.status === 'REDEEMED'
                          ? 'bg-success-subtle text-success'
                          : code.status === 'CREATED'
                            ? 'bg-brand-subtle text-brand'
                            : code.status === 'REVOKED'
                              ? 'bg-accent-subtle text-accent'
                              : 'bg-surface-secondary text-body'
                      }
                    >
                      {statusLabels[code.status] || code.status}
                    </Badge>
                  </td>
                  <td className="py-2 px-4">
                    {new Date(code.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2 px-4">
                    {code.redeemedAt
                      ? new Date(code.redeemedAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="py-2 px-4">
                    {code.status === 'CREATED' && (
                      <button
                        type="button"
                        onClick={() => revokeCode(code.id)}
                        disabled={revoking === code.id}
                        className="text-xs text-[var(--text-accent,#dc2626)] hover:underline disabled:opacity-50"
                      >
                        <Ban className="w-3 h-3 mr-1 inline" />
                        {revoking === code.id ? '...' : 'Revoquer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
