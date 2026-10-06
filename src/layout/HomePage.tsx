import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useShellContext } from '../core/shellContext';
import type { ShellContext } from '../shared/contract';
import {
  framesSummary,
  lensesTotal,
  ordersByStatus,
  overduePatients,
  patientName,
  patientsSummary,
  pendingApprovalCount,
  recentOrders,
  salesTimeseries,
  type DailySales,
  type OverduePatient,
  type RecentOrder,
  type StatusCount,
  type WorkOrderStatus,
} from './homeApi';

/**
 * HU-14: the dashboard's final redesign. Every number comes straight from an endpoint already
 * built for another HU (HU-15, HU-17, HU-21, HU-24) — nothing here is computed or guessed. Each
 * block below loads its own data through {@link ShellContext.ui}'s `useLoad`/`DataState`, the
 * same contract every portal uses, so one backend being down only blanks its own block.
 */

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  QUOTATION: 'Cotización',
  APPROVED: 'Aprobada',
  IN_LABORATORY: 'En laboratorio',
  READY: 'Lista',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

const STATUS_TONE: Record<WorkOrderStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  QUOTATION: 'neutral',
  APPROVED: 'info',
  IN_LABORATORY: 'info',
  READY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

/** Same CSS variables as `.badge-*` (styles.css), so the charts pick up the theme, dark mode included. */
const TONE_COLOR: Record<'neutral' | 'info' | 'success' | 'warning' | 'danger', string> = {
  neutral: 'var(--text-soft)',
  info: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
};

const PATIENT_ICON = (
  <>
    <circle cx="10" cy="7" r="3" />
    <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
  </>
);

const OVERDUE_ICON = (
  <>
    <path d="M10 2.5 2.5 16.5h15Z" />
    <path d="M10 8.5v3.5M10 14.5h.01" />
  </>
);

const FRAME_ICON = (
  <>
    <circle cx="6" cy="10" r="3" />
    <circle cx="14" cy="10" r="3" />
    <path d="M9 10h2M3 10 1.5 8M17 10l1.5-2" />
  </>
);

const CLIPBOARD_ICON = (
  <>
    <rect x="4.5" y="3.5" width="11" height="14" rx="1.5" />
    <path d="M7.5 3.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.5M7 9h6M7 12.5h6M7 16h3.5" />
  </>
);

function formatCents(cents: number): string {
  return `$ ${Math.round(cents / 100).toLocaleString('es-CO')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/** `date` arrives as "YYYY-MM-DD"; only the day number is shown on the axis (same as ReportsPage). */
function dayLabel(date: string): string {
  return date.slice(-2);
}

function todayLabel(): string {
  const text = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Pacientes activos + Controles vencidos: both come from the same /patients/summary call. */
function PatientCards({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad((signal) => patientsSummary(signal), []);
  return (
    <ui.DataState state={state} onRetry={reload}>
      {(summary) => (
        <>
          <ui.StatCard icon={PATIENT_ICON} tone="success" label="Pacientes activos" value={summary.active} />
          <ui.StatCard icon={OVERDUE_ICON} tone="danger" label="Controles vencidos" value={summary.pendingControls} />
        </>
      )}
    </ui.DataState>
  );
}

/** Monturas en inventario: /frames/summary's own reference count (lenses are shown separately below, in the stock chart). */
function FramesCard({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad((signal) => framesSummary(signal), []);
  return (
    <ui.DataState state={state} onRetry={reload}>
      {(summary) => (
        <ui.StatCard icon={FRAME_ICON} tone="primary" label="Monturas en inventario" value={summary.totalReferences} />
      )}
    </ui.DataState>
  );
}

/** Órdenes por aprobar: work orders in QUOTATION, the status `approve()` moves out of (ADMIN/SELLER only, same as the Ventas nav entry). */
function PendingApprovalCard({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad((signal) => pendingApprovalCount(signal), []);
  return (
    <ui.DataState state={state} onRetry={reload}>
      {(total) => (
        <ui.StatCard icon={CLIPBOARD_ICON} tone="warning" label="Órdenes por aprobar" value={total} />
      )}
    </ui.DataState>
  );
}

/** Sales by day of the current month (HU-24, ADMIN only) — same chart as ReportsPage, sized for the dashboard. */
function SalesTimeseriesWidget({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad((signal) => salesTimeseries(signal), []);
  return (
    <section className="card">
      <h2>Ventas del mes</h2>
      <ui.DataState
        state={state}
        onRetry={reload}
        isEmpty={(data: DailySales[]) => data.length === 0}
        emptyTitle="Sin ventas este mes"
        emptyHint="Las cifras aparecen cuando se registre la primera venta del mes."
      >
        {(data) => (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.map((d) => ({ ...d, day: dayLabel(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-soft)" fontSize={12} />
              <YAxis stroke="var(--text-soft)" fontSize={12} tickFormatter={(value: number) => formatCents(value)} width={80} />
              <Tooltip
                formatter={(value) => formatCents(Number(value))}
                labelFormatter={(day) => `Día ${day}`}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              />
              <Bar dataKey="totalCents" name="Ventas" fill={TONE_COLOR.info} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ui.DataState>
    </section>
  );
}

/** Work orders by status (HU-24, ADMIN only) — same donut as ReportsPage, sized for the dashboard. */
function OrdersByStatusWidget({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad((signal) => ordersByStatus(signal), []);
  return (
    <section className="card">
      <h2>Órdenes por estado</h2>
      <ui.DataState
        state={state}
        onRetry={reload}
        isEmpty={(data: StatusCount[]) => data.every((row) => row.count === 0)}
        emptyTitle="Sin órdenes todavía"
        emptyHint="Las cifras aparecen cuando se abra la primera orden."
      >
        {(data) => (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props) => {
                  const { status, count } = props as unknown as StatusCount;
                  return count > 0 ? `${STATUS_LABEL[status]}: ${count}` : '';
                }}
              >
                {data.map((row) => (
                  <Cell key={row.status} fill={TONE_COLOR[STATUS_TONE[row.status]]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const row = (item as { payload: StatusCount }).payload;
                  return [value, STATUS_LABEL[row.status]];
                }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              />
              <Legend formatter={(_value, entry) => STATUS_LABEL[(entry.payload as unknown as StatusCount).status]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ui.DataState>
    </section>
  );
}

/**
 * Stock by category: the only two real product categories (Monturas, Lentes) — accessories and
 * liquids are left out because, unlike lenses, there is no cheap "count via an empty page" lookup
 * confirmed for them in this pass, and the brief asks not to invent categories.
 */
function StockByCategoryWidget({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad(async (signal) => {
    const [frames, lenses] = await Promise.all([framesSummary(signal), lensesTotal(signal)]);
    return [
      { category: 'Monturas', total: frames.totalReferences },
      { category: 'Lentes', total: lenses },
    ];
  }, []);
  return (
    <section className="card">
      <h2>Stock por categoría</h2>
      <ui.DataState state={state} onRetry={reload}>
        {(data) => (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" stroke="var(--text-soft)" fontSize={12} />
              <YAxis stroke="var(--text-soft)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              <Bar dataKey="total" name="Referencias" fill={TONE_COLOR.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ui.DataState>
    </section>
  );
}

interface RecentOrderRow extends RecentOrder {
  patientFullName: string | null;
}

/** Órdenes recientes (ADMIN/SELLER): the 5 newest work orders, with the patient's name resolved from customers-api. */
function RecentOrdersList({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad(async (signal) => {
    const page = await recentOrders(signal);
    const rows: RecentOrderRow[] = await Promise.all(
      page.data.map(async (order) => {
        try {
          const patient = await patientName(order.patientId, signal);
          return { ...order, patientFullName: patient.fullName };
        } catch {
          // The order itself is real data; a patient lookup failing just means we show less, not wrong data.
          return { ...order, patientFullName: null };
        }
      }),
    );
    return rows;
  }, []);
  return (
    <section className="card">
      <h2>Órdenes recientes</h2>
      <ui.DataState
        state={state}
        onRetry={reload}
        isEmpty={(data) => data.length === 0}
        emptyTitle="Sin órdenes todavía"
      >
        {(rows) => (
          <ul className="home-list">
            {rows.map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.number}</strong>
                  <span className="home-list-meta">{order.patientFullName ?? order.patientId}</span>
                </div>
                <div className="home-list-end">
                  <ui.Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</ui.Badge>
                  <span className="num">{formatCents(order.totalCents)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ui.DataState>
    </section>
  );
}

/** Pacientes con control vencido: up to 5, same status the top card counts. */
function OverduePatientsList({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { state, reload } = ui.useLoad((signal) => overduePatients(signal), []);
  return (
    <section className="card">
      <h2>Pacientes con control vencido</h2>
      <ui.DataState
        state={state}
        onRetry={reload}
        isEmpty={(data) => data.data.length === 0}
        emptyTitle="Nadie tiene el control vencido"
      >
        {(page) => (
          <ul className="home-list">
            {page.data.map((patient: OverduePatient) => (
              <li key={patient.id}>
                <strong>{patient.fullName}</strong>
                <span className="home-list-meta">Último control: {formatDate(patient.lastControlDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </ui.DataState>
    </section>
  );
}

/**
 * Nueva orden / Registrar venta are the same destination: a sale is opened through the place-order
 * saga at `/sales/new`, which creates the work order and its invoice in one step — there is no
 * separate "create order" screen to link to, so both are offered as a single access.
 */
function QuickLinks({ shell }: { shell: ShellContext }): ReactNode {
  return (
    <section className="card" aria-label="Accesos rápidos">
      <h2>Accesos rápidos</h2>
      <div className="quick-links">
        <Link className="btn btn-quiet" to="/customers/new">
          Nuevo paciente
        </Link>
        {shell.can('ADMIN', 'SELLER') ? (
          <Link className="btn btn-quiet" to="/sales/new">
            Registrar venta
          </Link>
        ) : null}
        <Link className="btn btn-quiet" to="/products">
          Ver inventario
        </Link>
        {shell.can('ADMIN') ? (
          <Link className="btn btn-quiet" to="/sales/reports">
            Reportes
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function HomePage(): ReactNode {
  const shell = useShellContext();
  if (!shell) {
    return null;
  }
  const canSeeOrders = shell.can('ADMIN', 'SELLER');
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Hola, {shell.user.fullName.split(' ')[0]}</h1>
          <p className="subtitle">{todayLabel()} — esto es lo que necesita atención hoy.</p>
        </div>
      </header>

      <section className="summary-grid" aria-label="Resumen del día">
        <PatientCards shell={shell} />
        <FramesCard shell={shell} />
        {canSeeOrders ? <PendingApprovalCard shell={shell} /> : null}
      </section>

      <div className="grid-3">
        {shell.can('ADMIN') ? <SalesTimeseriesWidget shell={shell} /> : null}
        {shell.can('ADMIN') ? <OrdersByStatusWidget shell={shell} /> : null}
        <StockByCategoryWidget shell={shell} />
      </div>

      <div className="grid-2">
        {canSeeOrders ? <RecentOrdersList shell={shell} /> : null}
        <OverduePatientsList shell={shell} />
      </div>

      <QuickLinks shell={shell} />
    </>
  );
}
