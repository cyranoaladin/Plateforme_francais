/**
 * Composant Icon — wrapper universel pour lucide-react
 * Gère automatiquement aria-hidden pour les icônes décoratives
 * et aria-label pour les icônes porteuses de sens.
 */
import { type ComponentType, type SVGAttributes } from 'react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

type Props = {
  icon: ComponentType<SVGAttributes<SVGElement>>;
  size?: IconSize;
  className?: string;
  /** Si fourni, l'icône sera visible pour les lecteurs d'écran */
  label?: string;
} & Omit<SVGAttributes<SVGElement>, 'ref'>;

export function Icon({
  icon: IconComponent,
  size = 'md',
  className = '',
  label,
  ...rest
}: Props) {
  return (
    <IconComponent
      className={`${SIZE_CLASS[size]} shrink-0 ${className}`}
      aria-hidden={label === undefined ? true : undefined}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
      {...rest}
    />
  );
}
