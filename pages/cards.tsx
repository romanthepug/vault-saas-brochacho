import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, CardFooter } from '../components/Card';
import confetti from 'canvas-confetti';

/* ----------------------------------------------------------
   CONFIG & TYPES
---------------------------------------------------------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const [cards, setCards] = useState<any[]>([]);

interface FlipCard {
  id: string;
  title: string;
  niche: string;
  headline: string;
  steps: string[];
  startup: number;
  topMove: string;
  mistake: string;
  starterAssets: string[];
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  createdAt: string;
  verified: boolean;
}

/* ----------------------------------------------------------
   HELPER: FETCH CARDS
---------------------------------------------------------- */
useEffect(() => {
  fetchCards();
}, []);

async function fetchCards() {
  const { data } = await supabase.from('flip_cards').select('*').order('createdAt', { descending: true });
  setCards(data || []);
}

/* ----------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------- */
export default function Cards() {
  const [selected, setSelected] = useState<FlipCard | null>(null);
  const [Copied, setCopied] = useState<string>('');

  /* ---------- 1. UI ---------- */
  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-5xl font-bold text-neon">Learn From Others</h1>
        <p className="text-gray-400 mt-2">Pick a hustle, flip a card, get started.</p>
      </header>

      {/* Flip Deck */}
      <div className="space-y-6">
        {cards.map((c, idx) => (
          <Card key={c.id} className="hover:shadow-md transition cursor-pointer">
            <CardHeader title={c.title} rarity={c.rarity} />
            <CardBody
             .flipp="Click here to flip"
             image={c.image}
              verified={c.verified ? 'Verified' : 'Unverified'}
            />
            <CardFooter
              headline={c.headline}
              steps={c.steps}
              topMove={c.topMove}
              mistake={c.mistake}
            />
          </Card>
        ))}
      </div>

      {/* Selected Card Detail */}
      {selected && (
        <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-neon mb-4">{selected.title}</h3>
          <p className="mb-2">{selected.niche} hassle: <span className="font-bold">{selected.headline}</span></p>
          <p className="mb-2">Startup: ${selected.startup} | Time: {selected.time}/{selected.day}</p>
          <p className="mb-2">Top move: <strong>{selected.topMove}</strong></p>
          <p className="mb-2">Big mistake: <strong>{selected.mistake}</strong></p>
          <p className="mb-2">Starter assets: <a href={selected.starterAssets} target="_blank" rel="noopener noreferrer">Download</a></p>
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
