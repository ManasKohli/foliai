import React from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, Brain, PieChart, Shield, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <PieChart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Folio AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">AI-Powered Portfolio Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              Understand Your Portfolio Like Never Before
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 text-balance">
              Visualize holdings, analyze sector allocation, and get AI-driven insights to make smarter investment decisions. Educational tool for informed investors.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto group">
                <Link href="/auth/sign-up">
                  Start Analyzing Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Analyze Your Portfolio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful tools designed to give you clarity and confidence in your investment strategy.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<PieChart className="h-6 w-6" />}
              title="Visual Portfolio Breakdown"
              description="See your holdings at a glance with interactive pie charts showing allocation percentages and sector distribution."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Sector Analysis"
              description="Understand your exposure across different market sectors with detailed bar charts and trend analysis."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI-Powered Insights"
              description="Get intelligent suggestions on diversification, risk assessment, and potential opportunities based on your portfolio."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Performance Tracking"
              description="Monitor how your portfolio performs over time with clear visualizations and key metrics."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Risk Assessment"
              description="Identify concentration risks and get alerts when your portfolio becomes too heavily weighted in one area."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Quick Entry"
              description="Add holdings easily by entering ticker symbols and allocation percentages. No complex setup required."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-card/50 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No complicated setup. Just enter your holdings and start getting insights.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Create Your Account"
              description="Sign up for free and create your secure portfolio workspace."
            />
            <StepCard
              number="2"
              title="Enter Your Holdings"
              description="Add your stock tickers and allocation percentages to build your portfolio."
            />
            <StepCard
              number="3"
              title="Get AI Insights"
              description="Receive instant visualizations and intelligent analysis of your portfolio."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Understand Your Portfolio?
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Join thousands of investors using Folio AI to make more informed decisions.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <PieChart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Folio AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Educational tool only. Not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="group text-center">
      <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
