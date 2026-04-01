import { describe, it, expect } from 'vitest'
import { PLAN_CATALOG } from '@nexus-eaf/shared-billing/plan-catalog'
import { getProgramme2026, PLAN_LIMITS } from '../src/tools/all-tools'

describe('MCP Plan Limits sync', () => {
  it('expose les mêmes clés que le plan catalog principal', () => {
    const catalogPlanIds = Object.keys(PLAN_CATALOG)
    const mcpPlanIds = Object.keys(PLAN_LIMITS)
    expect(mcpPlanIds).toEqual(catalogPlanIds)
  })

  it('utilise les quotas officiels pour les limites de plan', () => {
    const premiumQuota = PLAN_CATALOG.PREMIUM.quotas.WRITTEN_CORRECTIONS?.limit
    expect(PLAN_LIMITS.PREMIUM.correctionsPerMonth).toBe(premiumQuota ?? null)
    expect(PLAN_LIMITS.PRO.oralSessionsPerMonth).toBeNull()
    expect(PLAN_LIMITS.FREE.tuteurMessagesPerDay).toBe(
      PLAN_CATALOG.FREE.quotas.TUTOR_QUESTIONS?.limit ?? null,
    )
  })
})

describe('MCP programme 2026-2027', () => {
  it('retourne les 12 œuvres officielles avec bonne structure', async () => {
    const result = await getProgramme2026({ objet_etude: 'tous' })
    expect(result.oeuvres).toHaveLength(12)
    expect(result.oeuvres.every((o: { titre: string }) => typeof o.titre === 'string')).toBe(true)
    expect(result.oeuvres.map((o: { titre: string }) => o.titre)).toContain('Cahier de Douai')
  })
})
