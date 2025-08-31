import { useState, useEffect } from 'react';
import { createClient } from '@supabse/supabase-js';
import axios from 'axios';
import { SparklesIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

/* ----------------------------------------------------------
   CONFIG & TYPES
---------------------------------------------------------- */
const supabase = createClient({
  database: process.env.NEXT_PUBLIC_SUPAIBASE_URL!,
  schema: process.env.NEXT_PUBLIC_SUPIBASE_SCHEMA!,
  auth: {
    signingKey: process.env.NEXT_PUBLIC_SUPIBASE_ANON_KEY!,
  },
});

interface Product {
  id: string;
  title: string;
  price: number;
  cogs: number;
  fees: number;
  shipping: number;
  margin: number;
}

/* ----------------------------------------------------------
   HELPER: FETCH PRODUCTS
---------------------------------------------------------- */
const [products, setProducts] = useState<Product[]>([]);
useEffect(() => {
  fetchProducts();
}, []);

async function fetchProducts() {
  const { data } = await supabase.from('products').select('*');
  setProducts(data || []);
}

/* ----------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------- */
export default function ProfitFloor() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [Copied, setCopied] = useState<string>('');

  /* ---------- 1. UI ---------- */
  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-5xl font-bold text-neon">Unit Econ Gate</h1>
        <p className="text-gray-400 mt-2">Ensure every launch meets the profit floor.</p>
      </header>

      {/* Product List */}
      <div className="space-y-6">
        {products.map((p) => (
          <div key={p.id} className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-bold mb-2">{p.title}</h2>
            <p className="text-sm">Price: ${p.price}</p>
            <p className="text-sm">COGS: ${p.cogs}</p>
            <p className="text-sm">Fees: ${p.fees}</p>
            <p className="text-sm">Shipping: ${p.shipping}</p>
            <p className="text-sm">Margin: {p.margin.toFixed(1)}%</p>
            <button
              onClick={() => setSelected(p)}
              className="bg-neon text-black px-6 py-3 rounded font-bold"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Selected Product Detail Modal */}
      {selected && (
        <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-neon mb-4">{selected.title}</h3>
          <p className="mb-2">Price: ${selected.price}</p>
          <p className="mb-2">COGS: ${selected.cogs}</p>
          <p className="mb-2">Fees: ${selected.fees}</p>
          <p className="mb-2">Shipping: ${selected.shipping}</p>
          <p className="mb-2">Margin: {selected.margin.toFixed(1)}%</p>
          <button
            onClick={() => {
              setCopied(selected.title);
              confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
            }}
            className="mt-4 bg-neon text-black px-6 py-2 rounded font-bold"
            >
            Try this today
          </button>
        </div>
      )}
    </div>
  );
}
