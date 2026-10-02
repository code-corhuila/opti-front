import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** The page for a route that does not exist. */
export function NotFound(): ReactNode {
  return (
    <div className="state">
      <p className="state-title">Página no encontrada</p>
      <p>La dirección que abriste no existe o cambió de lugar.</p>
      <Link className="btn" to="/">
        Volver al inicio
      </Link>
    </div>
  );
}
