#!/bin/bash
# Script de standardisation des styles pour atteindre le 10/10

cd "$(dirname "$0")/.."

echo "=== Standardisation des styles ==="

# Remplacement des rounded-[...] par les tokens
echo "→ Remplacement des rayons arbitraires..."

# rounded-[24px] → rounded-[var(--radius-2xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[24px\]/rounded-[var(--radius-2xl)]/g' {} \;

# rounded-[22px] → rounded-[var(--radius-xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[22px\]/rounded-[var(--radius-xl)]/g' {} \;

# rounded-[20px] → rounded-[var(--radius-xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[20px\]/rounded-[var(--radius-xl)]/g' {} \;

# rounded-[18px] → rounded-[var(--radius-xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[18px\]/rounded-[var(--radius-xl)]/g' {} \;

# rounded-[16px] → rounded-[var(--radius-lg)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[16px\]/rounded-[var(--radius-lg)]/g' {} \;

# rounded-[28px] → rounded-[var(--radius-xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[28px\]/rounded-[var(--radius-xl)]/g' {} \;

# rounded-[30px] → rounded-[var(--radius-xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[30px\]/rounded-[var(--radius-xl)]/g' {} \;

# rounded-[26px] → rounded-[var(--radius-xl)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[26px\]/rounded-[var(--radius-xl)]/g' {} \;

# rounded-[10px] → rounded-[var(--radius-md)]
find src -name "*.tsx" -exec sed -i 's/rounded-\[10px\]/rounded-[var(--radius-md)]/g' {} \;

echo "→ Remplacement des couleurs Tailwind..."

# text-slate-200 → text-[var(--text-secondary)]
find src -name "*.tsx" -exec sed -i 's/text-slate-200/text-[var(--text-secondary)]/g' {} \;

# text-slate-300 → text-[var(--text-muted)]
find src -name "*.tsx" -exec sed -i 's/text-slate-300/text-[var(--text-muted)]/g' {} \;

# text-slate-400 → text-[var(--text-muted)]
find src -name "*.tsx" -exec sed -i 's/text-slate-400/text-[var(--text-muted)]/g' {} \;

# text-slate-500 → text-[var(--text-muted)]
find src -name "*.tsx" -exec sed -i 's/text-slate-500/text-[var(--text-muted)]/g' {} \;

# border-slate-800 → border-[var(--border-strong)]
find src -name "*.tsx" -exec sed -i 's/border-slate-800/border-[var(--border-strong)]/g' {} \;

# bg-slate-*
find src -name "*.tsx" -exec sed -i 's/bg-slate-50/bg-[var(--bg-page)]/g' {} \;
find src -name "*.tsx" -exec sed -i 's/bg-slate-100/bg-[var(--bg-surface-secondary)]/g' {} \;
find src -name "*.tsx" -exec sed -i 's/bg-slate-200/bg-[var(--bg-surface-secondary)]/g' {} \;
find src -name "*.tsx" -exec sed -i 's/bg-slate-800/bg-[var(--bg-surface)]/g' {} \;
find src -name "*.tsx" -exec sed -i 's/bg-slate-900/bg-[var(--bg-page)]/g' {} \;

echo "=== Vérification ==="
echo "rounded-[...] restants:"
grep -r "rounded-\[" src --include="*.tsx" | wc -l

echo "Couleurs Tailwind restantes:"
grep -r "text-slate-\|bg-slate-\|border-slate-" src --include="*.tsx" | wc -l

echo "=== Terminé ==="
