import {
  assignStaffRolesAction,
  createStaffAction,
  toggleStaffActiveAction,
} from "@/features/staff/actions";
import { listRoles, listStaff } from "@/features/staff/service";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminStaffPage() {
  await requirePermission("staff.manage", "/admin/staff");
  const [staff, roles] = await Promise.all([listStaff(), listRoles()]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-display text-3xl font-semibold">Команда</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Облікові записи адмін-панелі, ролі та доступ.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Новий співробітник</h2>
        <form action={createStaffAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Імʼя</span>
            <input
              name="name"
              required
              placeholder="Олена"
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="staff@example.com"
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Пароль</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Телефон (опційно)</span>
            <input
              name="phone"
              type="tel"
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm text-muted-foreground">Ролі</legend>
            <div className="flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role.id} className="inline-flex items-center gap-2 text-sm">
                  <input name="roleKeys" type="checkbox" value={role.key} />
                  {role.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white sm:col-span-2"
          >
            Створити
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Співробітники</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">Співробітників ще немає.</p>
        ) : (
          staff.map((member) => {
            const memberRoleKeys = new Set(member.userRoles.map((ur) => ur.role.key));
            const isActive = member.staffProfile?.isActive ?? false;

            return (
              <article
                key={member.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isActive ? (
                        <span className="text-success">Активний</span>
                      ) : (
                        <span>Неактивний</span>
                      )}
                      {member.staffProfile?.phone ? ` · ${member.staffProfile.phone}` : null}
                    </p>
                  </div>
                  <form action={toggleStaffActiveAction} className="inline">
                    <input type="hidden" name="userId" value={member.id} />
                    <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
                    >
                      {isActive ? "Деактивувати" : "Активувати"}
                    </button>
                  </form>
                </div>

                <form action={assignStaffRolesAction} className="mt-4 space-y-3">
                  <input type="hidden" name="userId" value={member.id} />
                  <p className="text-sm text-muted-foreground">Ролі</p>
                  <div className="flex flex-wrap gap-3">
                    {roles.map((role) => (
                      <label key={role.id} className="inline-flex items-center gap-2 text-sm">
                        <input
                          name="roleKeys"
                          type="checkbox"
                          value={role.key}
                          defaultChecked={memberRoleKeys.has(role.key)}
                        />
                        {role.name}
                      </label>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
                  >
                    Зберегти ролі
                  </button>
                </form>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
