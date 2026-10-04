export default function Footer() {
  return (
    <footer className="bg-steel-900 text-steel-100 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-head font-semibold text-white text-lg mb-2">ScrapMate</div>
          <p className="text-steel-300">Doorstep scrap pickup, fair weighing, transparent payouts.</p>
        </div>
        <div>
          <div className="text-white font-medium mb-2">Company</div>
          <ul className="space-y-1 text-steel-300">
            <li>About</li>
            <li>How it works</li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <div className="text-white font-medium mb-2">Support</div>
          <ul className="space-y-1 text-steel-300">
            <li>Contact us</li>
            <li>FAQ</li>
            <li>Terms & conditions</li>
          </ul>
        </div>
        <div>
          <div className="text-white font-medium mb-2">Cities</div>
          <ul className="space-y-1 text-steel-300">
            <li>Bengaluru</li>
            <li>Mumbai</li>
            <li>Delhi NCR</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-steel-700 text-center text-xs text-steel-300 py-4">
        © {new Date().getFullYear()} ScrapMate. Demo project — not affiliated with any existing scrap service.
      </div>
    </footer>
  );
}
