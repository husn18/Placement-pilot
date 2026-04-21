import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Shield, BarChart3, Users, CheckCircle, ArrowRight, BookOpen, Target } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Structured Experiences",
    description: "Read real interview experiences with round-by-round breakdowns from verified students.",
  },
  {
    icon: Target,
    title: "Eligibility Intelligence",
    description: "Instantly check which companies match your CGPA, branch, and skillset.",
  },
  {
    icon: Shield,
    title: "Verified Students Only",
    description: "College email verification ensures authentic, trustworthy content.",
  },
  {
    icon: BarChart3,
    title: "Placement Analytics",
    description: "Difficulty ratings, preparation strategies, and success patterns at a glance.",
  },
];

const stats = [
  { value: "10+", label: "Experiences" },
  { value: "10+", label: "Companies" },
  { value: "10+", label: "Students" },
  { value: "95%", label: "Accuracy" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={logo} alt="Placement Pilot" className="h-24 w-24 mx-auto mb-6 object-contain" />
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-4">
              Placement <span className="text-primary">Pilot</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-2 tracking-widest uppercase text-xs font-medium">
              Make Your Flight Placed
            </p>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4 mb-8">
              The verified placement intelligence platform that reduces anxiety and helps you prepare smarter with real interview experiences and eligibility insights.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Check Eligibility
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Everything you need to prepare
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built by students, for students. Every feature designed to give you a placement edge.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass-card p-6"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Ready to ace your placements?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join verified students already preparing smarter with Placement Pilot.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-12 border-t border-border bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Are you an administrator?
          </p>
          <Link
            to="/admin-login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Shield className="h-4 w-4" />
            Admin Portal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Placement Pilot" className="h-6 w-6 object-contain" />
            <span className="text-sm text-muted-foreground">
              © 2026 Placement Pilot. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/companies" className="hover:text-foreground transition-colors">Companies</Link>
            <Link to="/eligibility" className="hover:text-foreground transition-colors">Eligibility</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/admin-login" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
