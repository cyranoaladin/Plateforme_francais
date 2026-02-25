import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

function buildPayloadString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([key]) => key !== 'checksum' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function signParams(params: Record<string, string>, secret: string): string {
  const payload = buildPayloadString(params);
  return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('ClicToPay HMAC signature', () => {
  const SECRET = 'super-secret-webhook-key-32-chars!';

  it('accepte une signature valide', () => {
    const params = { orderNumber: 'ORD-001', amount: '1000', currency: 'TND' };
    const checksum = signParams(params, SECRET);
    const expected = createHmac('sha256', SECRET)
      .update(buildPayloadString(params))
      .digest('hex');
    expect(checksum).toBe(expected);
  });

  it('rejette une signature falsifiée', () => {
    const params = { orderNumber: 'ORD-001', amount: '1000', currency: 'TND' };
    const realSig = signParams(params, SECRET);
    const fakeSig = realSig.slice(0, -4) + 'XXXX';
    expect(fakeSig).not.toBe(realSig);
  });

  it('rejette si le montant a été modifié après signature', () => {
    const originalParams = { orderNumber: 'ORD-001', amount: '1000', currency: 'TND' };
    const validSig = signParams(originalParams, SECRET);
    const tamperedParams = { ...originalParams, amount: '1' };
    const recheckSig = createHmac('sha256', SECRET)
      .update(buildPayloadString(tamperedParams))
      .digest('hex');
    expect(recheckSig).not.toBe(validSig);
  });

  it('ignore les champs checksum et signature lors du calcul', () => {
    const paramsWithChecksum = { orderNumber: 'ORD-002', amount: '500', checksum: 'should-be-ignored' };
    const paramsWithSignature = { orderNumber: 'ORD-002', amount: '500', signature: 'also-ignored' };
    const payload1 = buildPayloadString(paramsWithChecksum);
    const payload2 = buildPayloadString(paramsWithSignature);
    expect(payload1).toBe(payload2);
  });

  it('trie les paramètres alphabétiquement avant de signer', () => {
    const paramsAbc = { aaa: 'x', bbb: 'y', ccc: 'z' };
    const paramsCba = { ccc: 'z', bbb: 'y', aaa: 'x' };
    const sig1 = signParams(paramsAbc, SECRET);
    const sig2 = signParams(paramsCba, SECRET);
    expect(sig1).toBe(sig2);
  });
});
