import { Link } from 'react-router-dom';

const CATEGORIES = [
  { name: 'Metals', desc: 'Iron, steel, copper, brass, aluminium' },
  { name: 'Paper', desc: 'Newspaper, cardboard, books, office paper' },
  { name: 'E-waste', desc: 'Laptops, monitors, printers, phones' },
  { name: 'Appliances', desc: 'Fridges, washing machines, ACs' },
  { name: 'Plastic & glass', desc: 'Bottles, containers, jars' },
  { name: 'Vehicles', desc: 'Old bikes, scooters, cars' },
];

const STEPS = [
  { title: 'Check rates', desc: 'See live indicative prices for your city before you book.' },
  { title: 'Schedule a pickup', desc: 'Pick items, an address, and a time slot that suits you.' },
  { title: 'We weigh at your door', desc: 'A collector verifies weight and condition on the spot.' },
  { title: 'Get paid instantly', desc: 'Cash, UPI, or bank transfer — your choice.' },
];

export default function Home() {
  return (
    <div>
      <section className="bg-steel-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-head text-4xl md:text-5xl font-semibold leading-tight">
              Sell your scrap from your doorstep
            </h1>
            <p className="mt-4 text-steel-300 text-lg max-w-md">
              Book a free pickup, get a fair weight-based price, and get paid the same day — no
              hauling it anywhere yourself.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/schedule-pickup" className="btn-primary">
                Schedule pickup
              </Link>
              <Link to="/rates" className="btn-outline border-steel-500 text-white hover:border-white">
                Check scrap rates
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['500g+', 'tonnes recycled'],
              ['30 min', 'average pickup slot'],
              ['12+', 'cities served'],
              ['4.7/5', 'customer rating'],
            ].map(([stat, label]) => (
              <div key={label} className="bg-steel-700/60 border border-steel-700 rounded-sm p-5">
                <div className="font-head text-2xl font-semibold text-rust-500">{stat}</div>
                <div className="text-steel-300 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-head text-2xl font-semibold mb-8">How it works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card">
              <div className="text-rust-600 font-head font-semibold text-sm mb-2">Step {i + 1}</div>
              <div className="font-medium mb-1">{s.title}</div>
              <p className="text-steel-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-patina-100/60">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-head text-2xl font-semibold mb-8">What we pick up</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="bg-white border border-steel-100 rounded-sm p-5">
                <div className="font-medium mb-1">{c.name}</div>
                <p className="text-steel-500 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-head text-2xl font-semibold mb-4">Why choose ScrapMate</h2>
          <ul className="space-y-3 text-steel-700">
            <li>• Transparent, admin-verified pricing — updated regularly by city</li>
            <li>• Doorstep weighing, so you see exactly what you're paid for</li>
            <li>• Every item recycled responsibly, reducing landfill waste</li>
            <li>• Same-day payment via cash, UPI, or bank transfer</li>
          </ul>
        </div>
        <div className="card bg-patina-600 text-white border-none">
          <div className="font-head text-lg font-semibold mb-2">Our recycling impact</div>
          <p className="text-patina-100 text-sm">
            Every kilogram of metal, paper, and e-waste we collect is routed to certified recycling
            partners, cutting the raw-material and energy footprint of new production.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-head text-2xl font-semibold mb-8">Customers say (demo testimonials)</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ['Ananya R.', 'Booked a pickup for old newspapers and an AC — collector arrived on time and the payout matched the estimate.'],
            ['Farhan S.', 'Sold a scooter for scrap without dragging it anywhere. Simple and quick.'],
            ['Priya K.', 'Liked that the final weight and rate were shown before I confirmed payment.'],
          ].map(([name, quote]) => (
            <div key={name} className="card">
              <p className="text-steel-700 text-sm">"{quote}"</p>
              <div className="mt-3 text-sm font-medium">{name}</div>
              <div className="text-xs text-steel-400">Demo testimonial</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-head text-2xl font-semibold mb-8">Frequently asked questions</h2>
        <div className="divide-y divide-steel-100 border-t border-b border-steel-100">
          {[
            ['Is the price I see final?', 'No — prices shown are indicative. The final amount depends on the actual weight and condition verified at pickup.'],
            ['Is pickup free?', 'Yes, doorstep pickup is free of charge for all scrap categories we support.'],
            ['How do I get paid?', 'Choose cash, UPI, or bank transfer at the end of the pickup — payment is recorded and a receipt is generated instantly.'],
          ].map(([q, a]) => (
            <details key={q} className="py-4 group">
              <summary className="cursor-pointer font-medium list-none flex justify-between">
                {q}
                <span className="text-steel-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-steel-500 text-sm mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
