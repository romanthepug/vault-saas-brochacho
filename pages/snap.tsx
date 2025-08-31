import { useState, ChangeEvent, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { CameraIcon, SparklesIcon } from '@heroicons/react/24/outline';

/* ----------------------------------------------------------
   CONFIG
---------------------------------------------------------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!, dangerouslyAllowBrowser: true });

interface Listing {
  title: string;
  description: string;
  price: number;
  hashtags: string[];
  margin: number;
  comps: { title: string; price: number; url: string }[];
}

/* ----------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------- */
export default function SnapListing() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [copied, setCopied] = useState<string>('');

  /* ---------- 1. Handle file ---------- */
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  /* ---------- 2. Vision → Listing ---------- */
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    /* Convert to base64 */
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;

      /* Vision prompt */
      const prompt = `Analyze this product photo and return JSON: {
        "title": "eBay title ≤60 chars",
        "description": "SEO description ≤500 chars",
        "price": "suggested price USD",
        "hashtags": ["5 trending hashtags"],
        "comps": [{"title":"eBay comp title","price":19.99,"url":"https://ebay.com/..."}]
      }`;
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64 } },
            ],
          },
        ],
        max_tokens: 400,
      });

      try {
        const json = JSON.parse(res.choices[0]?.message?.content || '{}');
        /* Compute margin */
        const cogs = 5;
        const fees = 1.5;
        const shipping = 3;
        const margin = ((json.price - cogs - fees - shipping) / json.price) * 100;
        setListing({ ...json, margin });
      } catch {
        setListing(null);
      }
      setLoading(false);
    };
  };

  /* ---------- 3. Copy helpers ---------- */
  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(txt);
    setTimeout(() => setCopied(''), 2000);
  };

  /* ---------- 4. UI ---------- */
  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-5xl font-bold text-neon">Snap-to-Listing</h1>
        <p className="text-gray-400 mt-2">Photo → eBay/FBM/Gumtree listing in 10 s.</p>
      </header>

      <form onSubmit={handleGenerate} className="mb-8">
        <label className="block mb-2 font-bold">Upload Product Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-neon file:text-black hover:file:bg-accent"
        />
        {preview && (
          <img src={preview} alt="preview" className="mt-4 w-64 h-64 object-cover rounded" />
        )}
        <button
          type="submit"
          disabled={loading || !file}
          className="mt-6 bg-neon text-black px-6 py-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Generate Listing'}
        </button>
      </form>

      {listing && (
        <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Generated Listing</h2>
            <span className="text-green-400 font-bold">Margin: {listing.margin.toFixed(1)}%</span>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-1">Title</h3>
            <input
              value={listing.title}
              readOnly
              className="w-full p-2 rounded bg-gray-700"
            />
            <button onClick={() => copy(listing.title)} className="text-xs text-neon underline">
              {copied === listing.title ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-1">Description</h3>
            <textarea
              value={listing.description}
              readOnly
              rows={4}
              className="w-full p-2 rounded bg-gray-700"
            />
            <button onClick={() => copy(listing.description)} className="text-xs text-neon underline">
              {copied === listing.description ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-1">Price</h3>
            <input
              value={`$${listing.price.toFixed(2)}`}
              readOnly
              className="w-full p-2 rounded bg-gray-700"
            />
            <button onClick={() => copy(`$${listing.price.toFixed(2)}`)} className="text-xs text-neon underline">
              {copied === `$${listing.price.toFixed(2)}` ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-1">Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {listing.hashtags.map((h, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-700 rounded text-sm"
                >
                  #{h}
                </span>
              ))}
            </div>
            <button onClick={() => copy(listing.hashtags.join(' '))} className="text-xs text-neon underline">
              {copied === listing.hashtags.join(' ') ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-1">Comps</h3>
            <ul className="text-sm space-y-1">
              {listing.comps.map((c, idx) => (
                <li key={idx}>
                  {c.title} — ${c.price.toFixed(2)}{' '}
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-neon underline">
                    view
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
