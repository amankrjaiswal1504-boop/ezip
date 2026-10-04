import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '../i18n/I18nContext';

// Renders inside router + i18n. `routes` lets a test assert navigation.
export function renderWithProviders(ui, { route = '/', routes = [] } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>
        <Routes>
          <Route path="*" element={ui} />
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  );
}
