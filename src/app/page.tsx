
import ConverterInterface from "@/components/ConverterInterface";
import { FileUp, Wand2, PackageCheck, FileDown } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              XLSX to QTI Converter <span className="text-slate-400 font-normal">for Canvas LMS</span>
            </h1>
          </div>
          <div className="text-sm text-slate-500">
            Powered by <a href="https://elearningmaker.cc" target="_blank" className="hover:text-primary transition-colors">eLearningMaker</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">
              ដំណោះស្រាយក្នុងការផ្ទេរលំហាត់ដោយស្វ័យកម្ម
            </h2>
            <p className="text-lg text-slate-600">
              បំប្លែងហ្វាល់ Excel .xlsx ទៅជាហ្វាល់ TQI សម្រាប់បញ្ចូលសំណួរទៅក្នុងប្រព័ន្ធគ្រប់គ្រងការសិក្សា
            </p>
          </div>

          <a
            href="/Template.xlsx"
            download="Quiz_Template.xlsx"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-primary hover:border-primary/20 transition-all"
          >
            <FileDown className="w-5 h-5" />
            ទាញយកគំរូ (Download Template)
          </a>
        </div>

        {/* QTI Converter */}
        <section id="qti-converter" className="space-y-4">
          <ConverterInterface />
        </section>

      </main>

      {/* Footer */}
      {/* Footer / Founder Profile */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center space-y-6">

          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-md">
            <img
              src="/profile.webp"
              alt="សុង សិរីឧត្តម"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">Sereyutdam Song</h3>
            <p className="text-slate-500 font-medium">Founder of eLearningmaker.cc</p>
          </div>

          <div className="flex gap-4">
            <a
              href="https://utdamsong.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-sky-700 font-medium transition-colors"
            >
              utdamsong.com
            </a>
            <span className="text-slate-300">|</span>
            <a
              href="https://elearningmaker.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-sky-700 font-medium transition-colors"
            >
              elearningmaker.cc
            </a>
          </div>

          <div className="text-slate-400 text-sm pt-6">
            &copy; {new Date().getFullYear()} eLearningMaker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
