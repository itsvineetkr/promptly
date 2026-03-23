import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import API, { setAuthToken } from "@/lib/api";

export default function ChatbotIntegration() {
  const [url, setUrl] = useState("");
  const [scrapedContent, setScrapedContent] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Black");
  const [scriptTag, setScriptTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

const themes = {
    Black: { bg: "bg-slate-700", code: "BL" },
    Violet: { bg: "bg-violet-300", code: "VI" },
    Red: { bg: "bg-rose-300", code: "RE" },
    Yellow: { bg: "bg-amber-200", code: "YE" },
    Green: { bg: "bg-green-300", code: "GR" },
    Orange: { bg: "bg-orange-300", code: "OR" },
};

  const handleScrape = async () => {
    if (!url) {
      alert("Please enter a website URL");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch token from localStorage and set it in axios instance
      const token = localStorage.getItem("token");
      setAuthToken(token);
      const response = await API.post("/chatbot/scrape", null, {
        params: {
          website_url: url,
          origin_url: url,
          max_depth: 1,
          max_urls: 100,
        }
      });

      if (response.data.status === "success") {
        setScrapedContent(response.data.scrapped_content);
        setScriptTag(response.data.script_tag);
      }
    } catch (error) {
      console.error("Error scraping content:", error);
      alert("Failed to scrape content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateScriptTagWithTheme = (theme) => {
    if (scriptTag) {
      const themeCode = themes[theme].code;
      // Replace the color code in the script tag URL
      const updatedScriptTag = scriptTag.replace(
        /\/chatbot\/[A-Z]{2}\//,
        `/chatbot/${themeCode}/`
      );
      setScriptTag(updatedScriptTag);
    }
  };

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    updateScriptTagWithTheme(theme);
  };

  return (

    <div className="max-w-2xl mx-auto p-6 space-y-6 font-handwriting">
      <h1 className="text-3xl font-bold">Chatbot Integration</h1>

      {/* Input field */}
      <div className="flex gap-2 items-center">
        <label htmlFor="url" className="whitespace-nowrap">
          Enter your website url:
        </label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button 
          variant="outline" 
          className="bg-rose-100 text-black"
          onClick={handleScrape}
          disabled={isLoading}
        >
          {isLoading ? "Scraping..." : "Scrape"}
        </Button>
      </div>
      <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-3 py-2 mb-5">
        <span className="font-semibold">Note:</span> Scraping may take 2-5 minutes depending on your website size and server speed.
      </div>

      {/* Scraped Content */}
      <div>
        <p className="font-semibold mb-2">Scrapped Content:</p>
        <div className="rounded-lg p-4 bg-green-100 min-h-[100px] max-h-[300px] overflow-y-auto text-xs">
          {scrapedContent}
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <p className="font-semibold mb-2">Choose theme:</p>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(themes).map(([color, { bg }]) => (
            <button
              key={color}
              onClick={() => handleThemeChange(color)}
              className={`w-8 h-8 rounded-full border-2 ${
                selectedTheme === color ? "border-gray-800 border-2" : "border-gray-300"
              } ${bg}`}
              title={color}
            ></button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">Selected: {selectedTheme}</p>
      </div>

      {/* Script Tag Section */}
      {scriptTag && (
        <div>
          <p className="font-semibold mb-2">Add this script tag to your web:</p>
          <div className="flex items-center gap-2 p-2 rounded">
            <Textarea
              value={scriptTag}
              readOnly
              className="font-mono resize-none"
              style={{ fontSize: "12px" }}
            />
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(scriptTag)}>
              Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
