import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { saveEligibilityCheck, logUserActivity } from "@/lib/historyService";
import { fetchAllCompanies } from "@/lib/companyService";
import { Target, CheckCircle, XCircle, AlertTriangle, Loader, Zap, Filter } from "lucide-react";

const allBranches = ["CSE", "ECE", "ME", "CE", "EE", "IT", "PIE", "CHE"];
const allSkills = ["DSA", "System Design", "React", "Node.js", "Python", "Java", "SQL", "OOP", "ML", "Puzzles", "C++", "Database Management", "Financial Markets Knowledge", "Analytics", "Business Acumen", "Communication", "Leadership", "Presentation"];

const EligibilityChecker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cgpa, setCgpa] = useState("");
  const [branch, setBranch] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const checkEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    const cgpaVal = parseFloat(cgpa);

    try {
      setLoading(true);
      
      // Fetch companies from Supabase
      const companies = await fetchAllCompanies();

      const res = companies.map((company) => {
        const cgpaMatch = cgpaVal >= company.min_cgpa;
        const branchMatch = company.eligible_branches.includes(branch);
        
        // Calculate skill match percentage
        const matchedSkills = company.required_skills.filter((s: string) => skills.includes(s));
        const skillMatch = company.required_skills.length > 0 
          ? (matchedSkills.length / company.required_skills.length) * 100 
          : 0;
        
        const missingSkills = company.required_skills.filter((s: string) => !skills.includes(s));
        
        // Eligible only if CGPA and branch match
        const eligible = cgpaMatch && branchMatch;
        
        // Overall match score calculation
        const overallMatch = Math.round(
          (skillMatch + (cgpaMatch ? 50 : 0) + (branchMatch ? 50 : 0)) / 2
        );

        return {
          id: company.id,
          name: company.name,
          description: company.description,
          minCgpa: company.min_cgpa,
          minCGPA: company.min_cgpa, // Keep both for compatibility
          branches: company.eligible_branches,
          eligible_branches: company.eligible_branches,
          skills: company.required_skills,
          selection_rounds: company.selection_rounds,
          cgpaMatch,
          branchMatch,
          skillMatch: Math.round(skillMatch),
          missingSkills,
          eligible,
          overallMatch,
        };
      });

      // Sort by eligibility first, then by overall match
      res.sort((a, b) => {
        if (a.eligible !== b.eligible) {
          return a.eligible ? -1 : 1; // Eligible first
        }
        return b.overallMatch - a.overallMatch;
      });

      setResults(res);
      setLoading(false);

      // Save the check result to database if user is logged in
      if (user?.id) {
        setIsSaving(true);
        try {
          const savedCheck = await saveEligibilityCheck(
            user.id,
            cgpaVal,
            branch,
            skills,
            res
          );

          if (savedCheck) {
            // Log the activity
            await logUserActivity(
              user.id,
              "eligibility_check",
              `Checked eligibility for ${branch} branch with CGPA ${cgpaVal}`,
              savedCheck.id
            );
          }
        } catch (err) {
          console.error("Error saving eligibility check:", err);
        } finally {
          setIsSaving(false);
        }
      }
    } catch (err) {
      console.error("Error checking eligibility:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10 sm:mb-12 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex-shrink-0">
              <Target className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Eligibility Checker
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                Discover which companies you're a perfect match for
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={checkEligibility}
          className="glass-card p-6 sm:p-8 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 shadow-lg shadow-cyan-500/5 mb-10"
        >
          <div className="space-y-6">
            {/* Profile Section */}
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground mb-5">
                <Filter className="h-5 w-5 text-cyan-400" />
                Your Profile
              </h2>

              {/* Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* CGPA Input */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
                    CGPA
                  </label>
                  <input
                    type="number"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g., 8.5"
                    step="0.01"
                    min="0"
                    max="10"
                    className="w-full rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Branch Select */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-lg border-2 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-purple-400/5 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500/50 transition-all appearance-none cursor-pointer hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-purple-500/15 hover:to-purple-400/10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a78bfa' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px',
                    }}
                    required
                  >
                    <option value="" className="bg-background text-muted-foreground">Select your branch</option>
                    {allBranches.map((b) => (
                      <option key={b} value={b} className="bg-background text-foreground font-medium">{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground mb-5">
                <Zap className="h-5 w-5 text-pink-400" />
                Your Skills
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-4 py-2.5 text-xs font-semibold transition-all duration-200 border ${
                      skills.includes(skill)
                        ? "bg-gradient-to-r from-pink-500/20 to-pink-500/10 text-pink-400 border-pink-500/40 shadow-lg shadow-pink-500/10 transform scale-105"
                        : "bg-secondary/50 text-muted-foreground border-secondary hover:text-foreground hover:border-secondary/70 hover:bg-secondary/70"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving || loading}
            className="w-full mt-8 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 py-3.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Analyzing companies...</span>
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                <span>{isSaving ? "Saving your profile..." : "Check My Eligibility"}</span>
              </>
            )}
          </button>
        </motion.form>

        {results && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            {/* Results Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Your Matches
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  <span className="text-emerald-400 font-semibold">{results.filter(r => r.eligible).length}</span> eligible •{" "}
                  <span className="text-cyan-400 font-semibold">{results.length}</span> total companies
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-6 sm:p-7 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                    r.eligible
                      ? "border-emerald-500/30 hover:border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-background"
                      : "border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-background"
                  }`}
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-5 pb-4 border-b border-border/30">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                        r.eligible
                          ? "bg-emerald-500/20"
                          : "bg-amber-500/20"
                      }`}>
                        {r.eligible ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-foreground">{r.name}</h3>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div
                        className={`text-2xl sm:text-3xl font-black ${
                          r.overallMatch >= 70
                            ? "text-emerald-400"
                            : r.overallMatch >= 40
                            ? "text-amber-400"
                            : "text-destructive"
                        }`}
                      >
                        {r.overallMatch}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">Match Score</p>
                    </div>
                  </div>

                  {/* Criteria Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5 p-4 rounded-lg bg-background/50 border border-border/30">
                    {/* CGPA Check */}
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Min CGPA</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-lg font-bold ${r.cgpaMatch ? "text-emerald-400" : "text-destructive"}`}>
                          {r.minCgpa}
                        </span>
                        {r.cgpaMatch ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>

                    {/* Branch Check */}
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Branch</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-lg font-bold ${r.branchMatch ? "text-emerald-400" : "text-destructive"}`}>
                          {r.branchMatch ? "✓" : "✗"}
                        </span>
                        {r.branchMatch ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>

                    {/* Skills Match */}
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Skills</p>
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            r.skillMatch >= 70
                              ? "text-emerald-400"
                              : r.skillMatch >= 40
                              ? "text-amber-400"
                              : "text-destructive"
                          }`}
                        >
                          {r.skillMatch}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Rounds */}
                  {r.selection_rounds && r.selection_rounds.length > 0 && (
                    <div className="mb-5 pb-5 border-b border-border/30">
                      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                        <span className="inline-block w-1 h-1 rounded-full bg-cyan-400"></span>
                        Selection Process
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {r.selection_rounds.map((round: string) => (
                          <span
                            key={round}
                            className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/20"
                          >
                            {round}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eligibility Message */}
                  <div className="space-y-2">
                    {!r.eligible && (
                      <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0"></span>
                        <div className="text-xs text-destructive font-medium">
                          {!r.cgpaMatch && !r.branchMatch ? (
                            <span>
                              Not eligible: Your CGPA {cgpa} is below {r.minCgpa} and {branch} is not in eligible branches
                            </span>
                          ) : !r.cgpaMatch ? (
                            <span>Not eligible: Your CGPA {cgpa} is below {r.minCgpa}</span>
                          ) : (
                            <span>Not eligible: {branch} is not in eligible branches</span>
                          )}
                        </div>
                      </div>
                    )}

                    {r.missingSkills.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                        <div className="text-xs text-amber-400 font-medium">
                          <span className="block">Missing skills: </span>
                          <span className="text-amber-300 block mt-1">{r.missingSkills.join(", ")}</span>
                        </div>
                      </div>
                    )}

                    {r.eligible && r.missingSkills.length === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                        <div className="text-xs text-emerald-400 font-bold">
                          ✓ Perfect match! You meet all criteria for this company
                        </div>
                      </div>
                    )}

                    {r.eligible && r.missingSkills.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                        <div className="text-xs text-emerald-400 font-bold">
                          ✓ Eligible! Level up with: <span className="text-emerald-300 block mt-1">{r.missingSkills.join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EligibilityChecker;
