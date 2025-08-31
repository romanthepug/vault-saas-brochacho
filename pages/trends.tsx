import { useEffect, useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { PlayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';

/* ----------------------------------------------------------
   CONFIG
---------------------------------------------------------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!, dangerouslyAllowBrowser: true });

interface DataPoint {
  id: string;
  name: string;
  platform: 'tiktok' | 'etsy' | 'gumroad';
  velocity: number;
  profitScore: number;
  priceLadder: number[];
  margin: number;
  cogs: number;
  fees: number;
  shipping: number;
  createdAt: string;
}

/* ----------------------------------------------------------
   HELPER: PROFIT FLOOR
---------------------------------------------------------- */
function computeMargin(price: number, cogs: number, fees: number, shipping: number): number {
  return ((price - cogs - fees - shipping) / price) * 100;
}

function generatePriceLadder(cogs: number, fees: number, shipping: number): number[] {
  const base = cogs + fees + shipping;
  return [base * 1.3, base * 1.6, base * 2.0].map(p => Math.round(p * 100) / 100);
}

/* ----------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------- */
export default function Trends() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<DataPoint | null>(null);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'tiktok' | 'etsy' | 'gumroad'>('all');
  const [sort, setSort] = useState<'velocity' | 'profitScore'>('profitScore');

  /* ---------- 1. Live fetch ---------- */
  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    /* MOCK: Real TikTok/Etsy/Gumroad API calls go here */
    const raw = [
      { name: '#LEDcollars', platform: 'tiktok', velocity: 450, cogs: 2.5, fees: 0.8, shipping: 1.2 },
      { name: '#tinyhats', platform: 'etsy', velocity: 310, cogs: 1.8, fees: 0.6, shipping: 1.0 },
      { name: '#AIstickers', platform: 'gumroad', velocity: 280, cogs: 0.5, fees: 0.3, shipping: 0.2 },
      { name: '#ministand', platform: 'tiktok', velocity: 390, cogs: 3.0, fees: 1.0, shipping: 1.5 },
    ];
    const enriched = raw.map((r, idx) => {
      const ladder = generatePriceLadder(r.cogs, r.fees, r.shipping);
      const margin = computeMargin(ladder[0], r.cogs, r.fees, r.shipping);
      return {
        id: `trend-${idx}`,
        name: r.name,
        platform: r.platform,
        velocity: r.velocity,
        profitScore: Math.min(100, Math.round(r.velocity * 0.2 + margin * 2)),
        priceLadder: ladder,
        margin,
        cogs: r.cogs,
        fees: r.fees,
        shipping: r.shipping,
        createdAt: new Date().toISOString(),
      };
    });
    await supabase.from('trends').upsert(enriched, { onConflict: 'name' });
    const { data } = await supabase.from('trends').select('*').order(sort, { ascending: false });
    setData(data || []);
    setLoading(false);
  }, [sort]);

  /* ---------- 2. Filters & search ---------- */
  const filtered = useMemo(() => {
    return data
      .filter(d => (filter === 'all' || d.platform === filter))
      .filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, filter, search]);

  /* ---------- 3. UI ---------- */
  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-5xl font-bold text-neon">Trend Scope</h1>
        <p className="text-gray-400 mt-2">Live micro-trends ranked by teen cash potential.</p>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          value={search}
          onChange={debounce((e) => setSearch(e.target.value), 300)}
          placeholder="Search trend…"
          className="px-4 py-2 rounded bg-gray-800 focus:outline-none focus:ring-2 focus:ring-neon"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 rounded bg-gray-800"
        >
          <option value="all">All</option>
          <option value="tiktok">TikTok</option>
          <option value="etsy">Etsy</option>
          <option value="gumroad">Gumroad</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="px-4 py-2 rounded bg-gray-800"
        >
          <option value="profitScore">Profit Score</option>
          <option value="velocity">Velocity</option>
        </select>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-30} textAnchor="end" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8 }}
              labelStyle={{ color: '#00f5ff' }}
            />
            <Line type="monotone" dataKey="velocity" stroke="#00f5ff" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="profitScore" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3">Trend</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Velocity</th>
              <th className="px-4 py-3">Profit Score</th>
              <th className="px-4 py-3">Price Ladder</th>
              <th className="px-4 py-3">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-gray-700 transition cursor-pointer"
                onClick={() => setSelected(t)}
              >
                <td className="px-4 py-3 font-bold">{t.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      t.platform === 'tiktok'
                        ? 'bg-red-500'
                        : t.platform === 'etsy'
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {t.platform}
                  </span>
                </td>
                <td className="px-4 py-3">{t.velocity}</td>
                <td className="px-4 py-3">{t.profitScore}</td>
                <td className="px-4 py-3">{t.priceLadder.join(' → ')}</td>
                <td className="px-4 py-3">{t.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Detail Modal */}
      {selected && (
        <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-neon mb-2">{selected.name}</h3>
          <p className="mb-2">
            Platform: <span className="font-bold">{selected.platform}</span> | Velocity:{' '}
            <span className="font-bold">{selected.velocity}</span>
          </p>
          <p className="mb-2">
            Price ladder:{' '}
            <span className="text-green-400">{selected.priceLadder.join(' → ')}</span>
          </p>
          <p className="mb-4">
            Margin: <span className="text-green-400">{selected.margin.toFixed(1)}%</span>
          </p>
          <button
            className="bg-neon text-black px-6 py-2 rounded font-bold"
            onClick={() => alert(`Pitch generated for ${selected.name}!`)}
          >
            Generate Pitch & Ladder
          </button>
        </div>
      )}
    </div>
  );
}
