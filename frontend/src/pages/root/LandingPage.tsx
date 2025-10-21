import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PenTool, Share2, Infinity, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LandingPage() {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("verified") !== "true") return;
    toast.success("Email verified successfully!");
    params.delete("verified");
    const newSearch = params.toString();
    const newUrl = newSearch
      ? `${location.pathname}?${newSearch}`
      : location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [location.search]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="w-full bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <PenTool size={30} className="text-primary -rotate-90" />
            <span className="text-3xl font-bold tracking-tight">DrawBoard</span>
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative w-full py-24 px-4 sm:px-6 lg:px-8 text-center overflow-hidden
        bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-background"
      >
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Draw. Collaborate. Create — <br />
            in Real Time with <span className="text-primary">DrawBoard</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            A live collaborative whiteboard for teams, designers, and educators.
            Sketch ideas, brainstorm visually, and build together — anywhere.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 group"
              >
                Start Drawing Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl py-20 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-foreground">
          Why Teams Love DrawSync
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<PenTool className="h-12 w-12 text-primary" />}
            title="Real-Time Drawing"
            desc="See every stroke appear live. Collaborate instantly with teammates, clients, or students."
          />
          <FeatureCard
            icon={<Infinity className="h-12 w-12 text-primary" />}
            title="Infinite Canvas"
            desc="Zoom, pan, and expand freely. No limits to your creativity or your ideas."
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-primary" />}
            title="Team Collaboration"
            desc="Invite others to your board, chat, and create together — just like in-person sessions."
          />
          <FeatureCard
            icon={<Share2 className="h-12 w-12 text-primary" />}
            title="Share & Export"
            desc="Share boards via link or export to PNG, SVG, or PDF with one click."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full max-w-7xl py-20 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-foreground">
          Get Started in 3 Simple Steps
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <StepCard
            step="1"
            title="Sign In or Create an Account"
            desc="Access your collaborative space instantly — no setup required."
          />
          <StepCard
            step="2"
            title="Create a Whiteboard"
            desc="Open a new canvas and start drawing, sketching, or brainstorming with your team."
          />
          <StepCard
            step="3"
            title="Invite & Collaborate"
            desc="Share your board link, collaborate in real-time, and watch creativity flow."
          />
        </div>
      </section>
      {/* CTA Section */}
      <section
        className="w-full py-24 px-4 sm:px-6 lg:px-8 text-center
        bg-gradient-to-br from-primary/10 via-purple-400/10 to-background"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">
          Turn Ideas into Reality — Together
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Join thousands of creators using{" "}
          <span className="font-semibold">DrawSync</span> to sketch, ideate, and
          collaborate visually — all in one place.
        </p>
        <Link to="/auth">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 group"
          >
            Try DrawSync Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="bg-card text-card-foreground rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-border">
      <CardHeader className="flex flex-col items-center text-center">
        {icon}
        <CardTitle className="text-xl font-semibold mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-center">
        {desc}
      </CardContent>
    </Card>
  );
}
function StepCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {step}. {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}
