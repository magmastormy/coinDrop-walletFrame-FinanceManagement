import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  BarChart3, 
  Users, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  DollarSign,
  PieChart,
  Target,
  Star,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const Home = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  
  useEffect(() => {
    // Component mounted
  }, []);

  // Accessibility: detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANIMATION_DURATION = 0.8;
  const EASE_OUT = [0.25, 0.46, 0.45, 0.94];

  // Core value propositions
  const valueProps = [
    {
      icon: Wallet,
      title: "Smart Wallet Management",
      description: "Connect all your financial accounts in one secure dashboard. Track spending, set budgets, and get AI-powered insights.",
      benefit: "Save 15+ hours/month on financial management"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Visualize your financial health with interactive charts and predictive insights. Make data-driven decisions with confidence.",
      benefit: "Average users save $2,847 in first year"
    },
    {
      icon: ShieldCheck,
      title: "Bank-Level Security",
      description: "Your data is protected with 256-bit encryption and never shared. We're SOC 2 Type II certified.",
      benefit: "Trusted by 50,000+ secure users"
    }
  ];

  // Social proof
  const socialProof = {
    users: "50,000+",
    saved: "$12M+",
    rating: "4.9/5",
    satisfaction: "98%"
  };

  // Pricing tiers
  const pricing = [
    {
      name: "Starter",
      price: "Free",
      features: [
        "Connect up to 3 accounts",
        "Basic budget tracking",
        "Monthly reports",
        "Email support"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$9.99/mo",
      features: [
        "Unlimited account connections",
        "Advanced analytics",
        "AI-powered insights",
        "Priority support",
        "Custom budgets",
        "Bill tracking"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Family",
      price: "$19.99/mo",
      features: [
        "Everything in Pro",
        "Up to 6 family members",
        "Family budget goals",
        "Shared expense tracking",
        "Dedicated account manager"
      ],
      cta: "Start Free Trial",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary overflow-x-hidden">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="fixed top-0 left-0 z-50 px-4 py-2 transform -translate-y-full focus:translate-y-0 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-color border border-border-color text-text-primary"
      >
        Skip to main content
      </a>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="fixed top-0 left-0 right-0 z-40 bg-surface-color/80 backdrop-blur-xl border-b border-border-color"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
                </div>
              </motion.div>
              <h1 className="text-xl font-bold text-text-heading">CoinDrop</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="hidden md:inline-flex"
              >
                Log In
              </Button>
              
              <Button
                onClick={() => navigate('/register')}
                className="inline-flex"
              >
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main id="main-content" className="pt-20">
        
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 py-20">
          {/* Subtle background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-100 dark:bg-primary-900/10 rounded-full opacity-20 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-purple dark:bg-accent-purple/10 rounded-full opacity-20 blur-3xl" />
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Hero Content */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_DURATION, ease: EASE_OUT }}
              >
                {/* Trust badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 mb-6"
                >
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    Trusted by {socialProof.users} users worldwide
                  </span>
                </motion.div>
                
                <motion.h1 
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-heading mb-6 leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: ANIMATION_DURATION, ease: EASE_OUT }}
                >
                  Take Control of Your
                  <span className="block text-primary-600 dark:text-primary-400">
                    Financial Future
                  </span>
                </motion.h1>
                
                <motion.p 
                  className="text-xl text-text-secondary mb-8 max-w-2xl leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: ANIMATION_DURATION }}
                >
                  Smart budgeting, seamless tracking, and AI-powered insights&mdash;all in one beautiful platform. 
                  Join thousands who&apos;ve transformed their relationship with money.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: ANIMATION_DURATION }}
                >
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="text-lg px-8 py-4 h-14 group"
                  >
                    Start Free Today
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="text-lg px-8 py-4 h-14"
                  >
                    View Demo
                  </Button>
                </motion.div>
                
                {/* Social proof numbers */}
                <motion.div 
                  className="grid grid-cols-2 sm:grid-cols-4 gap-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: ANIMATION_DURATION }}
                >
                  {[
                    { number: socialProof.users, label: "Active Users" },
                    { number: socialProof.saved, label: "Money Saved" },
                    { number: socialProof.rating, label: "App Rating" },
                    { number: socialProof.satisfaction, label: "Satisfaction" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-text-heading mb-1">{stat.number}</div>
                      <div className="text-sm text-text-secondary">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
              
              {/* Hero Visual */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: ANIMATION_DURATION, ease: EASE_OUT }}
              >
                <div className="relative">
                  {/* Main dashboard card */}
                  <div className="bg-surface-color border border-border-color rounded-3xl p-8 shadow-2xl">
                    {/* Balance card */}
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 mb-6 text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-primary-100 text-sm mb-1">Total Balance</p>
                          <p className="text-3xl font-bold">$24,847.50</p>
                        </div>
                        <Wallet className="w-8 h-8 text-primary-200" />
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-sm">+12.5% this month</span>
                      </div>
                    </div>
                    
                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: TrendingUp, label: "Income", value: "$4,500", color: "text-green-600" },
                        { icon: PieChart, label: "Budget", value: "65%", color: "text-blue-600" },
                        { icon: Target, label: "Goals", value: "3/5", color: "text-purple-600" }
                      ].map((item, i) => (
                        <div key={i} className="text-center p-3 bg-background-secondary rounded-xl">
                          <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
                          <p className="text-xs text-text-secondary">{item.label}</p>
                          <p className="font-semibold text-text-heading">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  {!prefersReducedMotion && (
                    <>
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-2 rounded-full text-sm font-medium"
                      >
                        On Track! ✓
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-4 -left-4 bg-primary-500 text-white p-3 rounded-full"
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-24 px-6 bg-background-secondary">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: ANIMATION_DURATION, ease: EASE_OUT }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-text-heading mb-4">
                Why Choose <span className="text-primary-600">CoinDrop?</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Experience the future of financial management with features designed to make your life easier and your finances healthier.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {valueProps.map((prop, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: ANIMATION_DURATION, ease: EASE_OUT }}
                  whileHover={{ y: -8 }}
                  className="bg-surface-color border border-border-color rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-6">
                    <prop.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-text-heading mb-4">{prop.title}</h3>
                  <p className="text-text-secondary mb-6 leading-relaxed">{prop.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {prop.benefit}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 bg-surface-color">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: ANIMATION_DURATION, ease: EASE_OUT }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-text-heading mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Choose the plan that fits your needs. Start free, upgrade anytime.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricing.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: ANIMATION_DURATION, ease: EASE_OUT }}
                  whileHover={{ y: -8 }}
                  className={`relative bg-background-secondary border-2 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 ${
                    plan.popular 
                      ? 'border-primary-500 shadow-primary-500/20' 
                      : 'border-border-color'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-text-heading mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {plan.price}
                      {plan.price !== "Free" && <span className="text-lg text-text-secondary">/month</span>}
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => navigate('/register')}
                    className={`w-full h-12 ${
                      plan.popular 
                        ? 'bg-primary-600 hover:bg-primary-700' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: ANIMATION_DURATION, ease: EASE_OUT }}
              className="text-4xl lg:text-5xl font-bold mb-6"
            >
              Ready to Transform Your Finances?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: ANIMATION_DURATION }}
              className="text-xl mb-10 text-primary-100"
            >
              Join thousands of users who have already taken control of their financial future. 
              It&apos;s free, easy, and takes less than a minute to get started.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: ANIMATION_DURATION }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-4 h-14"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Fast</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-color border-t border-border-color py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-primary-600" strokeWidth={1.5} />
              <span className="font-bold text-text-heading text-lg">CoinDrop</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-text-secondary">
              <span>&copy; {new Date().getFullYear()} CoinDrop. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
