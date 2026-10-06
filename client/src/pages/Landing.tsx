import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  CloudSun,
  Camera,
  Calculator,
  MessageSquare,
  ArrowRight,
  Globe2,
  CheckCircle,
} from 'lucide-react';
import { APP_LANGUAGES } from '@cropsage/shared';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-soil-50 flex flex-col text-stone-900 selection:bg-leaf-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-leaf-600 flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl text-stone-900 tracking-tight">
              Crop<span className="text-leaf-600">Sage</span> AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="text-sm font-bold text-stone-700 hover:text-stone-950 px-3.5 py-2 transition-colors min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="hidden sm:inline-flex items-center justify-center text-sm font-bold px-4 py-2.5 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white shadow-sm transition-colors min-h-[44px]"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-8 pt-16 pb-20 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-leaf-100/80 border border-leaf-300 text-leaf-900 text-xs sm:text-sm font-bold mb-6 animate-fadeIn">
            <Sprout className="w-4 h-4 text-leaf-700" />
            <span>AI-Powered Agriculture Advisory for Indian Farmers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-stone-950 leading-[1.1] mb-6">
            Timely, Weather-Smart Crop Guidance In Your{' '}
            <span className="text-leaf-600 underline decoration-leaf-300 underline-offset-8">
              Native Language
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-700 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Personalized crop advisories grounded in your farm&apos;s soil, season, and live 7-day
            weather forecast. Integrated pest management, precise fertilizer calculations, and zero
            unverified chemical recommendations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold px-8 py-4 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white shadow-md hover:shadow-lg transition-all min-h-[44px]"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center text-base font-bold px-8 py-4 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 transition-colors shadow-sm min-h-[44px]"
            >
              Sign In to Your Farms
            </Link>
          </div>

          {/* Languages Strip */}
          <div className="mt-14 pt-8 border-t border-stone-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-center gap-1.5">
              <Globe2 className="w-4 h-4 text-leaf-600" />
              <span>Available in 9 Indian Languages</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {APP_LANGUAGES.map((l) => (
                <span
                  key={l.code}
                  className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs sm:text-sm font-semibold text-stone-700 shadow-xs"
                >
                  {l.nativeName} ({l.name})
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-white py-20 px-4 sm:px-8 border-y border-stone-200/80">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-leaf-700 bg-leaf-50 px-2.5 py-1 rounded-md border border-leaf-200">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 font-display mt-3">
                Everything A Farmer Needs For A Bumper Harvest
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-stone-200 bg-soil-50/50 hover:border-leaf-300 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-leaf-100 text-leaf-700 flex items-center justify-center">
                  <CloudSun className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-display">
                  Weather-Grounded Advisories
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Stage-specific task lists calibrated with live 7-day Open-Meteo forecasts. Skip
                  irrigation when rain is imminent.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-stone-200 bg-soil-50/50 hover:border-leaf-300 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-display">
                  Photo Diagnosis & IPM Ladder
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Upload leaf or stem photos. Get biological and organic treatments first, with
                  chemical sprays only as a regulated last resort.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-stone-200 bg-soil-50/50 hover:border-leaf-300 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-display">
                  Soil Card Fertilizer Math
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Deterministic nutrient calculations based on lab N-P-K tests. Exact bag counts
                  and split application timetables.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl border border-stone-200 bg-soil-50/50 hover:border-leaf-300 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-display">
                  Streaming Multilingual AI Chat
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Ask questions anytime. Retains farm context and provides answers in simple,
                  jargon-free language with read-aloud voice support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Process */}
        <section className="py-20 px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-stone-950 font-display">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-stone-600 text-sm mt-2">
              Designed for ease of use by farmers and rural extension workers alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-stone-200">
              <div className="w-12 h-12 rounded-full bg-leaf-600 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">Register Your Farm</h3>
              <p className="text-xs text-stone-600">
                Input your district, soil type, irrigation source, and optional Soil Health Card
                values.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-stone-200">
              <div className="w-12 h-12 rounded-full bg-leaf-600 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">Select Crop & Stage</h3>
              <p className="text-xs text-stone-600">
                Pick from 40+ national crops or upload photos of leaves showing symptoms.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-stone-200">
              <div className="w-12 h-12 rounded-full bg-leaf-600 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">Execute & Protect</h3>
              <p className="text-xs text-stone-600">
                Receive prioritized tasks, listen aloud to instructions, or print reports for field
                use.
              </p>
            </div>
          </div>
        </section>

        {/* Safety & Trust Banner */}
        <section className="bg-leaf-900 text-white py-16 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-8">
            <div className="p-4 bg-leaf-800 rounded-2xl shrink-0">
              <ShieldCheck className="w-12 h-12 text-leaf-300" />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-bold font-display text-leaf-50">
                Safety-First Agronomy Guarantee
              </h3>
              <p className="text-sm text-leaf-200 leading-relaxed">
                CropSage AI strictly filters out banned pesticides, avoids commercial brand
                names, enforces organic practice boundaries, and provides direct escalation to your
                local Krishi Vigyan Kendra (KVK) and Kisan Call Centre (1800-180-1551).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-4 sm:px-8 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-800 text-center md:text-left">
          <div>
            <span className="font-display font-extrabold text-lg text-white">CropSage AI</span>
            <p className="mt-1 text-stone-400">
              Empowering Indian agriculture through responsible AI engineering.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-stone-400">
            <Link to="/login" className="hover:text-white">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-white">
              Create Account
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 text-center text-stone-500 space-y-2">
          <p>
            Disclaimer: AI-generated guidance. Verify with your local KVK or agriculture officer
            before applying chemicals.
          </p>
          <p>© {new Date().getFullYear()} CropSage AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
