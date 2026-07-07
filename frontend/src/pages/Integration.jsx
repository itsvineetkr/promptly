import { useEffect, useRef, useState } from "react";
import API from "@/lib/api";
import { Spinner, FormError } from "@/pages/LoginForm";

const THEMES = [
  { name: "Black", code: "BL", swatch: "bg-neutral-900" },
  { name: "Violet", code: "VI", swatch: "bg-violet-400" },
  { name: "Red", code: "RE", swatch: "bg-rose-400" },
  { name: "Yellow", code: "YE", swatch: "bg-amber-300" },
  { name: "Green", code: "GR", swatch: "bg-green-400" },
];

const SCRAPE_STATUSES = [
  "Crawling your pages…",
  "Extracting page content…",
  "Splitting content into chunks…",
  "Building the knowledge base…",
  "Generating embeddings…",
  "Almost there — finalizing your chatbot…",
];

const TEST_ATTR = "data-promptly-test";

function removeTestWidget() {
  document
    .querySelectorAll(`.chat-toggle, .chatbot-container, [${TEST_ATTR}]`)
    .forEach((el) => el.remove());
}

function injectTestWidget(src, onReady, onError) {
  removeTestWidget();
  const existingStyles = new Set(document.head.querySelectorAll("style"));
  const script = document.createElement("script");
  script.setAttribute(TEST_ATTR, "");
  script.src = src;
  script.onload = () => {
    // Tag the styles the widget injected so we can clean them up later
    document.head.querySelectorAll("style").forEach((s) => {
      if (!existingStyles.has(s)) s.setAttribute(TEST_ATTR, "");
    });
    onReady();
  };
  script.onerror = onError;
  document.body.appendChild(script);
}

function StepHeading({ n, title, subtitle }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-sm text-neutral-300">{n}</span>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function ChatbotIntegration() {
  const [url, setUrl] = useState("");
  const [scrapedContent, setScrapedContent] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("BL");
  const [scriptTag, setScriptTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [testState, setTestState] = useState("off"); // off | loading | on | error
  const timerRef = useRef(null);

  // Progress timer while scraping
  useEffect(() => {
    if (isLoading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [isLoading]);

  // Remove the test widget when leaving the page
  useEffect(() => removeTestWidget, []);

  const normalizeUrl = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const handleScrape = async () => {
    setError("");
    const targetUrl = normalizeUrl(url);
    if (!targetUrl) {
      setError("Please enter your website URL.");
      return;
    }
    try {
      new URL(targetUrl);
    } catch {
      setError("That doesn't look like a valid URL. Try something like https://example.com");
      return;
    }

    setIsLoading(true);
    setScrapedContent("");
    setScriptTag("");
    setTestState("off");
    removeTestWidget();

    try {
      const response = await API.post("/chatbot/scrape", null, {
        params: {
          website_url: targetUrl,
          origin_url: targetUrl,
          max_depth: 1,
          max_urls: 100,
        },
      });

      if (response.data.status === "success") {
        setScrapedContent(response.data.scrapped_content);
        setScriptTag(
          response.data.script_tag.replace(/\/chatbot\/[A-Z]{2}\//, `/chatbot/${selectedTheme}/`)
        );
      } else {
        setError(
          response.data.message ||
            response.data.response ||
            "Scraping failed — no content could be extracted from that site."
        );
      }
    } catch (err) {
      if (!err.response) {
        setError("Could not reach the server. The scrape may take a while — check your connection and try again.");
      } else if (err.response.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response.data?.detail || "Scraping failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (code) => {
    setSelectedTheme(code);
    if (!scriptTag) return;
    const updated = scriptTag.replace(/\/chatbot\/[A-Z]{2}\//, `/chatbot/${code}/`);
    setScriptTag(updated);
    // If the widget is live on the page, reload it with the new theme
    if (testState === "on" || testState === "loading") {
      startTest(updated);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startTest = (tag = scriptTag) => {
    const src = tag.match(/src=['"]([^'"]+)['"]/)?.[1];
    if (!src) return;
    setTestState("loading");
    injectTestWidget(
      src,
      () => setTestState("on"),
      () => setTestState("error")
    );
  };

  const stopTest = () => {
    removeTestWidget();
    setTestState("off");
  };

  const statusMessage = SCRAPE_STATUSES[Math.min(Math.floor(elapsed / 20), SCRAPE_STATUSES.length - 1)];
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
        Dashboard
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Set up your chatbot</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Scrape your site, pick a theme, then embed — and test — the widget.
      </p>

      {/* Step 1 — Scrape */}
      <section className="mt-12 border border-neutral-200 p-6">
        <StepHeading
          n="01"
          title="Scrape your website"
          subtitle="We'll crawl your pages and build the chatbot's knowledge base."
        />
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            id="url"
            type="url"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleScrape()}
            disabled={isLoading}
            className="h-10 flex-1 border border-neutral-300 bg-white px-3 font-mono text-sm outline-none transition-colors focus:border-neutral-900 disabled:bg-neutral-50"
          />
          <button
            onClick={handleScrape}
            disabled={isLoading}
            className="flex h-10 items-center justify-center gap-2 bg-neutral-900 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
          >
            {isLoading ? <Spinner /> : null}
            {isLoading ? "Scraping…" : "Scrape"}
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <FormError message={error} />
          </div>
        )}

        {isLoading && (
          <div className="mt-5 border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">{statusMessage}</p>
              <span className="font-mono text-xs text-neutral-400">
                {mins}:{secs}
              </span>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden bg-neutral-200">
              <div className="h-full w-1/3 animate-[progress_1.5s_ease-in-out_infinite] bg-neutral-900" />
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Large sites can take 2–5 minutes. Keep this tab open.
            </p>
            <style>{`@keyframes progress { 0% { margin-left: -35%; } 100% { margin-left: 100%; } }`}</style>
          </div>
        )}

        {scrapedContent && !isLoading && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Scraped content</p>
              <span className="font-mono text-xs text-neutral-400">
                {scrapedContent.length.toLocaleString()} chars
              </span>
            </div>
            <div className="mt-2 max-h-64 overflow-y-auto border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-neutral-600">
              {scrapedContent}
            </div>
          </div>
        )}
      </section>

      {/* Step 2 — Theme */}
      <section className={`mt-6 border border-neutral-200 p-6 ${!scriptTag ? "opacity-40 pointer-events-none select-none" : ""}`}>
        <StepHeading
          n="02"
          title="Choose a widget theme"
          subtitle="This only changes how the chatbot looks on your site."
        />
        <div className="mt-5 flex flex-wrap gap-3">
          {THEMES.map(({ name, code, swatch }) => (
            <button
              key={code}
              onClick={() => handleThemeChange(code)}
              className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                selectedTheme === code
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-900"
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${swatch}`} />
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Step 3 — Embed & test */}
      <section className={`mt-6 border border-neutral-200 p-6 ${!scriptTag ? "opacity-40 pointer-events-none select-none" : ""}`}>
        <StepHeading
          n="03"
          title="Embed and test"
          subtitle="Paste this into your site's HTML — or try it live right here first."
        />

        {scriptTag && (
          <>
            <div className="mt-5 flex items-start gap-2">
              <code className="flex-1 overflow-x-auto border border-neutral-200 bg-neutral-900 p-4 font-mono text-xs leading-relaxed text-neutral-100 whitespace-pre-wrap break-all">
                {scriptTag}
              </code>
              <button
                onClick={handleCopy}
                className="h-10 shrink-0 border border-neutral-300 px-4 text-sm transition-colors hover:border-neutral-900"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <div className="mt-5 border-t border-neutral-200 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Test it live on this page</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Loads the exact widget your visitors will see — look for the chat
                    bubble in the bottom-right corner.
                  </p>
                </div>
                {testState === "on" || testState === "loading" ? (
                  <button
                    onClick={stopTest}
                    className="h-10 shrink-0 border border-neutral-900 px-4 text-sm font-medium transition-colors hover:bg-neutral-100"
                  >
                    Stop test
                  </button>
                ) : (
                  <button
                    onClick={() => startTest()}
                    className="h-10 shrink-0 bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                  >
                    Launch test
                  </button>
                )}
              </div>
              {testState === "loading" && (
                <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                  <Spinner className="h-3 w-3" /> Loading widget…
                </p>
              )}
              {testState === "on" && (
                <p className="mt-3 font-mono text-xs text-neutral-500">
                  ● Widget is live — click the chat bubble in the corner to talk to your bot.
                </p>
              )}
              {testState === "error" && (
                <p className="mt-3 text-xs text-red-600">
                  Couldn't load the widget script. Check that the backend is reachable and try again.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
