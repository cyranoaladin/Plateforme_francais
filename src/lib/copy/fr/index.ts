import { apiCopy } from './api';
import { billingCopy } from './billing';
import { parentsCopy } from './parents';
import { publicCopy } from './public';
import { studentCopy } from './student';
import { teacherCopy } from './teacher';
import { uiCopy } from './ui';

export const copy = {
  public: publicCopy,
  student: studentCopy,
  teacher: teacherCopy,
  parents: parentsCopy,
  api: apiCopy,
  billing: billingCopy,
  ui: uiCopy,
} as const;

export type AppCopy = typeof copy;
