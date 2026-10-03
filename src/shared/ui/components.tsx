import type { ReactNode } from 'react';
import type { DataStateProps, FieldProps, PageMeta, SelectFieldProps, TextFieldProps } from '../contract';

/** Loading, error with retry, empty and data: the four states every view must design. */
export function DataState<T>({ state, isEmpty, emptyTitle, emptyHint, onRetry, children }: DataStateProps<T>): ReactNode {
  if (state.status === 'loading') {
    return (
      <div className="state" role="status" aria-busy="true" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Cargando…</p>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="state state-error" role="alert">
        <p className="state-title">No pudimos cargar la información</p>
        <p>{state.error.userMessage}</p>
        <button type="button" className="btn" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }
  if (isEmpty?.(state.data)) {
    return (
      <div className="state" role="status">
        <p className="state-title">{emptyTitle ?? 'Sin resultados'}</p>
        {emptyHint ? <p>{emptyHint}</p> : null}
      </div>
    );
  }
  return <>{children(state.data)}</>;
}

/** A label tied to its control, and the error right next to it, announced by screen readers. */
export function Field({ id, label, error, hint, required, children }: FieldProps): ReactNode {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={error ? 'field has-error' : 'field'}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="required" aria-hidden="true"> *</span> : null}
      </label>
      {children({ 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ id, label, value, onChange, error, hint, required, type = 'text', inputMode, maxLength, autoComplete, placeholder, disabled }: TextFieldProps): ReactNode {
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      {(aria) => (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          {...aria}
        />
      )}
    </Field>
  );
}

export function SelectField({ id, label, value, onChange, options, error, hint, required, placeholder, disabled }: SelectFieldProps): ReactNode {
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      {(aria) => (
        <select id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} {...aria}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }): ReactNode {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Pager({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }): ReactNode {
  if (meta.total === 0) {
    return null;
  }
  const first = (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);
  return (
    <nav className="pager" aria-label="Paginación">
      <span>
        {first}–{last} de {meta.total}
      </span>
      <div>
        <button type="button" className="btn btn-quiet" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Anterior
        </button>
        <span aria-current="page">
          Página {meta.page} de {Math.max(meta.totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-quiet"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}

export function Banner({ kind, title, children }: { kind: 'error' | 'info' | 'success'; title?: string; children: ReactNode }): ReactNode {
  return (
    <div className={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}

export function Badge({ tone, children }: { tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger'; children: ReactNode }): ReactNode {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
