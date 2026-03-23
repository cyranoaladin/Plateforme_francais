import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`);
});

const getAuthenticatedUserMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/auth/session', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

describe('role-protected layouts', () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getAuthenticatedUserMock.mockReset();
  });

  it('allows parent and admin on the parent layout', async () => {
    const ParentLayout = (await import('@/app/parent/layout')).default;

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'parent' } });
    const parentResult = await ParentLayout({ children: 'ok' });
    expect(parentResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'admin' } });
    const adminResult = await ParentLayout({ children: 'ok' });
    expect(adminResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects non-parent roles away from the parent layout', async () => {
    const ParentLayout = (await import('@/app/parent/layout')).default;

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'eleve' } });
    await expect(ParentLayout({ children: 'ok' })).rejects.toThrow('redirect:/dashboard');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('allows teacher and admin on the teacher layout', async () => {
    const TeacherLayout = (await import('@/app/enseignant/layout')).default;

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'enseignant' } });
    const teacherResult = await TeacherLayout({ children: 'ok' });
    expect(teacherResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'admin' } });
    const adminResult = await TeacherLayout({ children: 'ok' });
    expect(adminResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects student away from the teacher layout', async () => {
    const TeacherLayout = (await import('@/app/enseignant/layout')).default;

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'eleve' } });
    await expect(TeacherLayout({ children: 'ok' })).rejects.toThrow('redirect:/dashboard');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('allows only admin on the admin layout', async () => {
    const AdminLayout = (await import('@/app/admin/layout')).default;

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'admin' } });
    const adminResult = await AdminLayout({ children: 'ok' });
    expect(adminResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'enseignant' } });
    await expect(AdminLayout({ children: 'ok' })).rejects.toThrow('redirect:/dashboard');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('allows only student and admin on the dashboard layout', async () => {
    const DashboardLayout = (await import('@/app/dashboard/layout')).default;

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'eleve' } });
    const studentResult = await DashboardLayout({ children: 'ok' });
    expect(studentResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'admin' } });
    const adminResult = await DashboardLayout({ children: 'ok' });
    expect(adminResult).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'parent' } });
    await expect(DashboardLayout({ children: 'ok' })).rejects.toThrow('redirect:/parent');
    expect(redirectMock).toHaveBeenCalledWith('/parent');

    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'enseignant' } });
    await expect(DashboardLayout({ children: 'ok' })).rejects.toThrow('redirect:/enseignant');
    expect(redirectMock).toHaveBeenCalledWith('/enseignant');
  });
});
