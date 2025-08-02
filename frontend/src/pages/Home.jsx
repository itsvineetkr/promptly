import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-10">
      {/* Main Heading */}
      <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
        Elevate Your Website with our AI Chatbots
      </h1>

      {/* Subheading */}
      <p className="text-xl text-muted-foreground leading-relaxed">
        Fast, flexible, and easy-to-integrate chatbot solution for modern websites.
      </p>

      {/* Content */}
      <div className="space-y-6 text-base text-gray-700 leading-relaxed">
        <p>
          Our chatbot platform empowers you to automate conversations, assist
          visitors, and improve user experience – all without writing a single
          line of backend logic. It's plug-and-play: just insert a script tag and
          you're ready to go.
        </p>

        <p>
          Whether you're running a blog, a product site, or an enterprise dashboard,
          our solution adapts to your content. You can scrape site data, choose from
          multiple UI themes, and embed the assistant seamlessly into your frontend.
        </p>

        <p>
          Focus on what you do best. Let the chatbot handle support, FAQs, and lead
          engagement for you.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <Button onClick={() => navigate("/signup")}>Create Account</Button>
        <Button variant="outline" onClick={() => navigate("/integrate")}>
          Integrate Now
        </Button>
      </div>
    </div>
  );
}
