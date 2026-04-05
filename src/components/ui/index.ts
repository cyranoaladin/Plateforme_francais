/**
 * Nexus Réussite EAF — Shared UI Components
 * ==========================================
 * Barrel export for all reusable UI primitives.
 *
 * Usage:
 *   import { Button, Input, Card, Badge } from '@/components/ui';
 */

export { Button } from './button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button';

export { Input } from './input';
export type { InputProps, InputSize } from './input';

export { Textarea } from './textarea';
export type { TextareaProps, TextareaSize } from './textarea';

export { Select } from './select';
export type { SelectProps, SelectOption, SelectSize } from './select';

export { Card } from './card';
export type { CardProps, CardVariant, CardPadding } from './card';

export { Badge } from './badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './badge';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

export { SectionHeader } from './section-header';
export type { SectionHeaderProps, SectionHeaderSize } from './section-header';

export { StateNotice } from './state-notice';
export { Surface } from './surface';
export type { SurfaceProps, SurfaceTone, SurfacePadding } from './surface';

export { Icon } from './Icon';
export { UpgradePrompt } from './UpgradePrompt';
