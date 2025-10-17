import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Store,
  Package,
  Lock,
  BarChart2,
  Users,
  ArrowRight,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
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
      <nav className="w-full shadow-sm bg-background sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/shop.png"
              alt="Dokanify Logo"
              className="h-10 w-10 -mt-1"
            />
            <span className="text-3xl font-bold">Dokanify</span>
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section
        className="w-full py-20 px-4 sm:px-6 lg:px-8 text-center
       bg-gradient-to-b from-primary/10 to-background"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Share your products easily with
          <span className="text-primary ms-2">Dokanify</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Login and create a simple, shareable product page for your customers.
          Get a dedicated dashboard to manage orders, add products, and track
          analytics. Cash on Delivery supported.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 group"
            >
              Create Your Shop
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-foreground">
          Why Dokanify?
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="bg-card text-card-foreground rounded-xl shadow-lg 
            hover:shadow-xl transition-shadow border border-border"
          >
            <CardHeader>
              <Store className="h-12 w-12 text-primary" />
              <CardTitle className="text-xl font-semibold mt-2">
                Simple Shop Creation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Create your shareable product page in minutes – no full e-commerce
              complexity, just what you need to start selling.
            </CardContent>
          </Card>
          <Card
            className="bg-card text-card-foreground rounded-xl shadow-lg 
            hover:shadow-xl transition-shadow border border-border"
          >
            <CardHeader>
              <Package className="h-12 w-12 text-primary" />
              <CardTitle className="text-xl font-semibold mt-2">
                Easy Product Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Add, edit, and organize products effortlessly from your intuitive
              dashboard.
            </CardContent>
          </Card>
          <Card
            className="bg-card text-card-foreground rounded-xl shadow-lg 
           hover:shadow-xl transition-shadow border border-border"
          >
            <CardHeader>
              <Lock className="h-12 w-12 text-primary" />
              <CardTitle className="text-xl font-semibold mt-2">
                Cash on Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Support COD payments for hassle-free transactions with your
              customers.
            </CardContent>
          </Card>
          <Card
            className="bg-card text-card-foreground rounded-xl shadow-lg 
            hover:shadow-xl transition-shadow border border-border"
          >
            <CardHeader>
              <BarChart2 className="h-12 w-12 text-primary" />
              <CardTitle className="text-xl font-semibold mt-2">
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Track orders, customer interactions, and performance to grow your
              shop smarter.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-foreground">
          Get Selling in 3 Simple Steps
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
            <CardHeader>
              <CardTitle className="text-xl">1. Login & Create Shop</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Sign in and set up your simple product page – ready to share with
              customers.
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
            <CardHeader>
              <CardTitle className="text-xl">
                2. Add Products & Manage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Upload products and handle orders from your personalized
              dashboard.
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
            <CardHeader>
              <CardTitle className="text-xl">3. Share & Sell</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Share your page link and start receiving COD orders from
              customers.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-foreground">
          Loved by Creators & Sellers
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg mt-2">Aisha K.</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              "Dokanify made sharing my handmade crafts so easy! The dashboard
              helps me track everything without the hassle of a full website."
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg mt-2">Rahul S.</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              "Perfect for small sellers like me. COD support is a game-changer,
              and the analytics keep me informed on sales."
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground rounded-xl shadow-lg border border-border">
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg mt-2">Maria L.</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              "Simple, effective, and just like Patreon for my digital products.
              Love how quick it is to manage orders!"
            </CardContent>
          </Card>
        </div>
      </section>
      {/* CTA Section */}
      <section
        className="w-full py-20 px-4 sm:px-6 lg:px-8 text-center 
        bg-gradient-to-b from-primary/10 to-background"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">
          Ready to Share Your Shop?
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Join creators thriving with{" "}
          <span className="font-semibold">Dokanify</span>. Create your simple
          product page today – free to start, COD ready.
        </p>
        <Link to="/auth">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 group"
          >
            Create Your Shop
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
