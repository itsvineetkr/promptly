import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    n: "01",
    title: "Point us at your site",
    text: "Enter your website URL and we crawl your pages, indexing the content your visitors ask about.",
  },
  {
    n: "02",
    title: "Pick a theme",
    text: "Choose a widget style that matches your brand. Switch themes any time without re-scraping.",
  },
  {
    n: "03",
    title: "Paste one script tag",
    text: "Drop a single line of HTML into your site. The chatbot appears and answers from your own content.",
  },
];

const FEATURES = [
  ["No backend required", "Everything runs on our infrastructure — you only add a script tag."],
  ["Trained on your content", "Answers come from your scraped pages, not generic knowledge."],
  ["Works anywhere", "Blogs, product sites, docs, dashboards — any page that can load a script."],
  ["Test before you ship", "Preview the exact widget on our dashboard before touching your site."],
];

export default function Home({ loggedIn }) {
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="border-b border-neutral-200 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
          AI chatbots for any website
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.1] tracking-tight">
          Your website, answering its own questions.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
          Promptly scrapes your site, builds a knowledge base, and gives you a
          chatbot you can embed with a single script tag. No backend code, no
          training pipelines.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={() => navigate(loggedIn ? "/integrate" : "/signup")}
            className="bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            {loggedIn ? "Open dashboard" : "Create your chatbot"}
          </button>
          <button
            onClick={() => navigate(loggedIn ? "/integrate" : "/login")}
            className="border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            {loggedIn ? "Manage integration" : "Log in"}
          </button>
        </div>
        <div className="mt-14 max-w-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="font-mono text-xs text-neutral-400"># All it takes:</p>
          <code className="mt-1 block overflow-x-auto whitespace-nowrap font-mono text-sm text-neutral-800">
            {'<script src="https://promptly…/chatbot/BL/your-site.js"></script>'}
          </code>
        </div>
        <a
          href="https://github.com/itsvineetkr/promptly"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          This project is open source — explore the codebase on GitHub
          <span aria-hidden="true">→</span>
        </a>
      </section>

      {/* How it works */}
      <section className="border-b border-neutral-200 py-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
          How it works
        </h2>
        <div className="mt-10 grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-white p-8">
              <span className="font-mono text-sm text-neutral-300">{step.n}</span>
              <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
          Why Promptly
        </h2>
        <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {FEATURES.map(([title, text]) => (
            <div key={title} className="border-t border-neutral-900 pt-4">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-neutral-200 py-8">
        <p className="font-mono text-xs text-neutral-400">
          Promptly — plug-and-play AI chatbots.
        </p>
        <a
          href="https://github.com/itsvineetkr/promptly"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-neutral-400 underline underline-offset-4 transition-colors hover:text-neutral-900"
        >
          View the code on GitHub →
        </a>
      </footer>
    </main>
  );
}
