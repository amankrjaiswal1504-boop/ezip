import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="font-head text-5xl font-semibold text-steel-300 mb-4">404</div>
      <p className="text-steel-600 mb-6">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
