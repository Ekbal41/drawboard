import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  PenTool,
  Share2,
  Infinity,
  ArrowRight,
  Zap,
  Lock,
  Sparkles,
  CheckCircle2,
  MousePointer2,
  Palette,
} from "lucide-react";
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
    <div className="flex flex-col items-center min-h-screen">
      {/* Navbar */}
      <nav className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <PenTool size={20} />
            </div>
            <span className="text-3xl font-bold tracking-tight">DrawBoard</span>
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full py-32 px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative z-10 max-w-6xl mx-auto">
          <Badge className="mb-6" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            100% Free Forever
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Collaborate in Real-Time
            <br />
            <span className="text-primary">Create Without Limits</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            The ultimate free collaborative whiteboard for teams, designers, and
            creators. Draw together, brainstorm visually, and bring ideas to
            life instantly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link to="/auth">
              <Button size="lg" className="group px-8 py-6 text-lg">
                Start Creating Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No Credit Card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Unlimited Boards
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Real-Time Sync
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl py-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Features
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Everything You Need to Collaborate
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed for seamless teamwork and unlimited
            creativity
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-primary" />}
            title="Instant Real-Time Sync"
            desc="See every change instantly. No lag, no delays — just pure collaboration magic."
          />
          <FeatureCard
            icon={<Infinity className="h-10 w-10 text-primary" />}
            title="Infinite Canvas"
            desc="Zoom, pan, and explore endlessly. Your creativity has no boundaries here."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-primary" />}
            title="Multi-User Collaboration"
            desc="Invite unlimited teammates and watch ideas flow together in real-time."
          />
          <FeatureCard
            icon={<Palette className="h-10 w-10 text-primary" />}
            title="Rich Drawing Tools"
            desc="Pens, shapes, colors, and more. Express yourself with professional-grade tools."
          />
          <FeatureCard
            icon={<Share2 className="h-10 w-10 text-primary" />}
            title="Easy Sharing"
            desc="Share boards with a simple link. Export to PNG, SVG, or PDF instantly."
          />
          <FeatureCard
            icon={<Lock className="h-10 w-10 text-primary" />}
            title="Secure & Private"
            desc="Your work is protected. Create private boards or share with confidence."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full max-w-7xl py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Getting Started
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Start Collaborating in Seconds
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No complex setup, no learning curve — just instant creativity
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <StepCard
            step="1"
            title="Create Your Account"
            desc="Sign up for free in seconds. No credit card needed, no hidden fees — ever."
            icon={<MousePointer2 className="h-8 w-8 text-primary" />}
          />
          <StepCard
            step="2"
            title="Start Your First Board"
            desc="Launch a new whiteboard and start drawing immediately. The canvas is yours."
            icon={<PenTool className="h-8 w-8 text-primary" />}
          />
          <StepCard
            step="3"
            title="Invite Your Team"
            desc="Share your board link and collaborate in real-time. It's that simple."
            icon={<Users className="h-8 w-8 text-primary" />}
          />
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full max-w-7xl py-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Use Cases
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Perfect For Every Team
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From startups to classrooms, DrawBoard adapts to your needs
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <UseCaseCard
            title="Design Teams"
            desc="Sketch wireframes, create mockups, and iterate together in real-time"
            emoji="🎨"
          />
          <UseCaseCard
            title="Remote Teams"
            desc="Bridge the distance gap with visual collaboration that feels in-person"
            emoji="🌍"
          />
          <UseCaseCard
            title="Educators"
            desc="Teach visually, engage students, and make learning interactive and fun"
            emoji="📚"
          />
          <UseCaseCard
            title="Brainstorming"
            desc="Map ideas, connect concepts, and unlock breakthrough innovations"
            emoji="💡"
          />
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <StatCard
              number="100%"
              label="Free Forever"
              sublabel="No hidden costs"
            />
            <StatCard
              number="∞"
              label="Unlimited Boards"
              sublabel="Create without limits"
            />
            <StatCard
              number="Live"
              label="Real-Time Sync"
              sublabel="Instant collaboration"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-32 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Transform How You{" "}
            <span className="text-primary">Collaborate</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Join creators worldwide who are turning ideas into reality with
            DrawBoard. Start your first board today — completely free, forever.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Creating Free
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Get started in 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 DrawBoard. Built with ❤️ for creators everywhere.</p>
        </div>
      </footer>
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
    <Card className="group hover:shadow-lg transition-all hover:border-primary/50">
      <CardHeader className="flex flex-col items-center text-center pt-8">
        <div className="bg-primary/10 p-3 rounded-xl mb-4">{icon}</div>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-center pb-8">
        {desc}
      </CardContent>
    </Card>
  );
}

function StepCard({
  step,
  title,
  desc,
  icon,
}: {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
            {step}
          </div>
        </div>
        <div className="flex justify-center mb-3">{icon}</div>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-center">
        {desc}
      </CardContent>
    </Card>
  );
}

function UseCaseCard({
  title,
  desc,
  emoji,
}: {
  title: string;
  desc: string;
  emoji: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow p-6 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{desc}</p>
    </Card>
  );
}

function StatCard({
  number,
  label,
  sublabel,
}: {
  number: string;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="p-6">
      <div className="text-5xl font-bold text-primary mb-2">{number}</div>
      <div className="text-xl font-semibold mb-1">{label}</div>
      <div className="text-sm text-muted-foreground">{sublabel}</div>
    </div>
  );
}
