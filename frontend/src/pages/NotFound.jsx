import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta({ title: 'Page not found', noindex: true });
  return (
    <div className="container-page py-24 text-center">
      <div className="font-head text-7xl font-bold text-rust-600">404</div>
      <h1 className="font-head text-2xl font-semibold text-steel-900 mt-4">This page went to the recycler</h1>
      <p className="text-steel-500 mt-2">The link may be old or mistyped.</p>
      <div className="flex justify-center gap-3 mt-8">
        <Link to="/" className="btn-primary">
          Go home
        </Link>
        <Link to="/rates" className="btn-outline">
          See scrap rates
        </Link>
      </div>
    </div>
  );
}
