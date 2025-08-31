import { useState, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { SparklesIcon, ClipboardIcon } from '@heroicons/react/24/outline';

/* ----------------------------------------------------------
   CONFIG
---------------------------------------------------------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!, dangerouslyAllowBrowser: true });

/* ----------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------- */
export default function Generate() {
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generated, setGenerated] = useState<{
    hooks: string[];
    thumbnail: string;
    script: string;
  } | null>(null);
  const [copied, setCopied] = useState<string>('');

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);

    const prompt = `Trending keyword: "${keyword}"  
Return JSON: {
  "hooks": ["3 viral TikTok hooks ≤15 words"],
  "thumbnail": "thumbnail concept text overlay + color palette",
  "script": "30-second TikTok script outline with CTA"
}`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    try {
      const json = JSON.parse(res.choices[0]?.message?.content || '{}');
      setGenerated(json);
    } catch {
      setGenerated(null);
    }
    setLoading(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-5xl font-bold text-neon">Content Generator</h1>
        <p className="text-gray-400 mt-2">Turn any keyword into viral hooks, thumbnails & scripts.</p>
      </header>

      <form onSubmit={handleGenerate} className="mb-8">
        <textarea
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword… e.g. LED collar"
          rows={3}
          className="w-full p-3 rounded bg-gray-800 focus:outline-none focus:ring-2 focus:ring-neon"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-neon text-black px-6 py-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>

      {generated && (
        <div className="space-y-6">
          {/* Hooks */}
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-neon" />
              Viral Hooks
            </h2>
            <ul className="space-y-2">
              {generated.hooks.map((hook, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                  <span>{hook}</span>
                  <button
                    onClick={() => copyToClipboard(hook)}
                    className="text-xs text-neon underline"
                  >
                    {copied === hook ? 'Copied!' : 'Copy'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Thumbnail */}
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <ClipboardIcon className="h-6 w-6 mr-2 text-neon" />
              Thumbnail Concept
            </h2>
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-sm">{generated.thumbnail}</p>
              <button
                onClick={() => copyToClipboard(generated.thumbnail)}
                className="mt-2 text-xs text-neon underline"
              >
                {copied === generated.thumbnail ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Script */}
          <div>
            <h2 className="text-2xl font-bold mb-2">30-Second Script</h2>
            <pre className="bg-gray-800 p-4 rounded whitespace-pre-wrap text-sm">
              {generated.script}
            </pre>
            <button
              onClick={() => copyToClipboard(generated.script)}
              className="mt-2 text-xs text-neon underline"
            >
              {copied === generated.script ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
