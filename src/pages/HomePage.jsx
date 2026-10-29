
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
  FiTarget,
  FiBarChart2,
} from "react-icons/fi";

import logo from "../../src/assets/bia.png";

function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: FiUsers,
      title: "Lead Management",
      description:
        "Organize enquiries, manage follow-ups, and keep track of potential students in one place.",
    },
    {
      icon: FiTarget,
      title: "Student Management",
      description:
        "Keep student information organized and make everyday academy operations simpler.",
    },
    {
      icon: FiBarChart2,
      title: "Performance Tracking",
      description:
        "Monitor progress, review activities, and make informed decisions using your dashboard.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-200/30 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 top-40 h-[32rem] w-[32rem] rounded-full bg-indigo-200/30 blur-3xl" />

      {/* Header */}
      {/* <header className="relative z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
       
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
            aria-label="Being Iban Academy home"
          >
            <img
              src={logo}
              alt="Being Iban Academy"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </button>

    
          <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-blue-800 sm:text-sm">
              Academy Management Portal
            </span>
          </div>

     
          <button
            type="button"
            onClick={() => navigate("/counsellor/login")}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700 sm:hidden"
          >
            Sign In
          </button>
        </div>
      </header> */}

      {/* Main content */}
      <main className="relative z-10">
        {/* Hero section */}
        <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-20 lg:px-12 lg:pb-16 lg:pt-16">
          <div className=" items-center">
            {/* Left content */}
            <div className="text-center">


              {/* Main heading */}
              <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Welcome to
                <br />

                <span className="bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Being Iban Academy
                </span>
              </h1>



              {/* Login buttons */}
              <div className="mx-auto mt-9 grid max-w-xl gap-4 sm:grid-cols-2">
                {/* Counsellor login */}
                <button
                  type="button"
                  onClick={() => navigate("/counsellor/login")}
                  className="group flex min-h-[76px] cursor-pointer items-center justify-between gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-left text-white shadow-xl shadow-blue-600/20 transition duration-200 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <FiUsers size={22} />
                    </span>

                    <span>
                      <span className="block text-sm font-bold">
                        Login as a
                      </span>
                      <span className="mt-0.5 block text-base font-bold">
                        Counsellor
                      </span>
                    </span>
                  </span>

                  <FiArrowRight
                    size={20}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                  />
                </button>

                {/* Admin login */}
                <button
                  type="button"
                  onClick={() => navigate("/admin/login")}
                  className="group flex min-h-[76px] cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-2 text-left shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
                      <FiShield size={22} />
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-slate-500">
                        Login as an
                      </span>
                      <span className="mt-0.5 block text-base font-bold text-slate-900">
                        Admin
                      </span>
                    </span>
                  </span>

                  <FiArrowRight
                    size={20}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                  />
                </button>
              </div>
            </div>

            {/* Right visual panel */}

          </div>
        </section>

        {/* Features section */}
        <section className="border-t border-slate-200/70 bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Built for your workflow
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                A smarter way to manage your academy
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Access the tools you need to keep your academy's daily
                operations organized.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 sm:p-7"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}

      <footer className="relative z-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left lg:px-12">
          <p className="text-sm font-semibold text-slate-700">
            Being Iban Academy
          </p>

          <div className="flex flex-col items-center gap-2 text-xs text-slate-400 sm:items-end">
            <p>
              © {new Date().getFullYear()} Being Iban Academy. All rights reserved.
            </p>

            <p>
              Developed by{" "}
              <a
                href="https://beingibandigital.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-700 transition hover:text-amber-900"
              >
                Being Iban Digital
              </a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;
