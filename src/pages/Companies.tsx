import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Search, Building2, ArrowRight, Loader, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { fetchAllCompanies } from "@/lib/companyService";
import type { Company } from "@/lib/companyService";

const Companies = () => {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllCompanies();
        setCompanies(data);
      } catch (err) {
        console.error("Error loading companies:", err);
        setError("Failed to load companies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-20 relative z-10">
        {/* Premium Header Section */}
        <div className="mb-10 sm:mb-16 relative animate-in fade-in slide-in-from-top duration-500">
          {/* Gradient line accent */}
          <div className="h-1 w-20 sm:w-32 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full mb-4 sm:mb-6 animate-pulse" />
          
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5 mb-4">
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/25 to-purple-500/15 backdrop-blur-xl border border-blue-400/30 shadow-xl flex-shrink-0">
              <Briefcase className="h-6 sm:h-8 w-6 sm:w-8 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                <h1 className="font-display text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Companies
                </h1>
                <Sparkles className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-400 opacity-70" />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Explore top placement companies and interview patterns
              </p>
            </div>
          </div>
        </div>

        {/* Premium Search Bar with Animation */}
        <div className="relative mb-10 sm:mb-14 group animate-in fade-in slide-in-from-bottom duration-700">
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/20 rounded-2xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-xl rounded-2xl border border-blue-400/40 p-1 overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex items-center px-6 py-4">
              <Search className="h-5 w-5 text-blue-400 mr-4 transition-all duration-300 group-focus-within:scale-110" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies by name..."
                className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground caret-blue-400 selection:bg-blue-500/30"
              />
            </div>
          </div>
        </div>

        {/* Loading State - Premium */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-16 h-16 mb-6 animate-in fade-in zoom-in duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin" />
              <Loader className="absolute inset-0 m-auto h-8 w-8 text-blue-300 animate-spin" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Loading premium companies...</p>
            <p className="text-muted-foreground text-sm mt-2">This will just take a moment</p>
          </div>
        ) : error ? (
          <div className="animate-in fade-in duration-500 mb-8">
            <div className="rounded-2xl border border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl p-6">
              <p className="text-red-400 font-semibold text-lg">{error}</p>
              <p className="text-red-400/70 text-sm mt-2">Please try again or contact support if the issue persists.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm mb-5 animate-in zoom-in">
              <Building2 className="h-14 w-14 text-muted-foreground opacity-40" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">No companies found</p>
            <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or browse all companies</p>
          </div>
        ) : (
          <div>
            {/* Grid with staggered animations - Mobile responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((company, index) => (
                <Link
                  key={company.id}
                  to={`/companies/${company.id}`}
                  className="group relative h-full animate-in fade-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHoveredId(company.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Premium Hover Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 ${
                    hoveredId === company.id ? "opacity-100" : ""
                  } transition-opacity duration-500 blur-xl`} />
                  
                  {/* Premium Card */}
                  <div className={`glass-card p-5 sm:p-7 h-full flex flex-col relative overflow-hidden transition-all duration-500 ${
                    hoveredId === company.id ? "shadow-2xl -translate-y-2 sm:-translate-y-2" : ""
                  }`}>
                    {/* Multi-layer gradient corners */}
                    <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 group-hover:scale-150 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-tr from-purple-400/15 to-transparent rounded-full -ml-8 sm:-ml-12 -mb-8 sm:-mb-12 group-hover:scale-125 transition-transform duration-500" />

                    {/* Header with Icon - Enhanced */}
                    <div className="flex items-start justify-between mb-4 sm:mb-5 relative z-10">
                      <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/40 to-blue-600/30 backdrop-blur-md border border-blue-400/40 transition-all duration-500 flex-shrink-0 ${
                        hoveredId === company.id ? "from-blue-500/60 to-purple-500/40 scale-110" : ""
                      }`}>
                        <Building2 className="h-5 sm:h-6 w-5 sm:w-6 text-blue-200" />
                      </div>
                      <div className={`p-1.5 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-md opacity-0 scale-75 ${
                        hoveredId === company.id ? "opacity-100 scale-100" : ""
                      } transition-all duration-300 translate-x-2 group-hover:translate-x-0 hidden sm:flex`}>
                        <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 text-purple-300" />
                      </div>
                    </div>

                    {/* Company Name - Premium Typography */}
                    <h3 className={`font-display text-lg sm:text-2xl font-bold text-foreground mb-2 relative z-10 transition-all duration-300 line-clamp-2 ${
                      hoveredId === company.id ? "text-transparent bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text" : ""
                    }`}>
                      {company.name}
                    </h3>

                    {/* Rounds Pipeline - with icon accent */}
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 relative z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                      {company.selection_rounds.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm border border-purple-400/30">
                          <GraduationCap className="h-3 sm:h-4 w-3 sm:w-4 text-purple-400 flex-shrink-0" />
                          <span className="text-xs font-medium">{company.selection_rounds.slice(0, 2).join(" → ")}{company.selection_rounds.length > 2 ? "..." : ""}</span>
                        </span>
                      ) : (
                        "Interview details pending"
                      )}
                    </p>

                    {/* Premium Stats Section with Glassmorphism */}
                    <div className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/10 backdrop-blur-md border border-blue-400/30 relative z-10 transition-all duration-300 mb-4 ${
                      hoveredId === company.id ? "from-blue-500/25 to-purple-500/20 border-blue-400/50" : ""
                    }`}>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Min CGPA Required</p>
                      <p className="font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">
                        {company.min_cgpa}
                      </p>
                    </div>

                    {/* Required Skills - Enhanced */}
                    {company.required_skills && company.required_skills.length > 0 && (
                      <div className="mt-auto relative z-10">
                        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider opacity-70 text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                          Key Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {company.required_skills.slice(0, 2).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/25 px-2 sm:px-3 py-1 text-xs font-semibold text-purple-200 border border-purple-400/30 hover:border-purple-300 hover:from-purple-500/40 transition-all shadow-lg"
                            >
                              {skill}
                            </span>
                          ))}
                          {company.required_skills.length > 2 && (
                            <span className="rounded-full bg-gradient-to-r from-pink-500/30 to-orange-500/20 px-2 sm:px-3 py-1 text-xs font-semibold text-pink-200 border border-pink-400/30 shadow-lg">
                              +{company.required_skills.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Premium CTA - Appears on Hover */}
                    <div className={`mt-4 pt-4 border-t border-blue-400/20 opacity-0 translate-y-3 ${
                      hoveredId === company.id ? "opacity-100 translate-y-0" : ""
                    } transition-all duration-300 relative z-10 hidden sm:block`}>
                      <div className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text flex items-center gap-2">
                        Explore Further <ArrowRight className="h-4 w-4 text-blue-300 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Premium Results Counter */}
            <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 animate-in fade-in duration-700">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-blue-500/50 hidden sm:block" />
              <p className="text-muted-foreground text-xs sm:text-sm font-medium text-center">
                Showing <span className="font-bold text-blue-300">{filtered.length}</span> of{" "}
                <span className="font-bold text-purple-300">{companies.length}</span> companies
              </p>
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-purple-500/50 hidden sm:block" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Companies;
