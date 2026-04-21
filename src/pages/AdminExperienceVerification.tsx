import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Trash2, X, AlertCircle } from "lucide-react";
import {
  getPendingExperiences,
  getVerifiedExperiences,
  verifyExperience,
  deleteExperience,
  type Experience,
} from "@/lib/adminService";

const AdminExperienceVerification = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingExperiences, setPendingExperiences] = useState<Experience[]>([]);
  const [verifiedExperiences, setVerifiedExperiences] = useState<Experience[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    setIsLoading(true);
    try {
      const [pending, verified] = await Promise.all([
        getPendingExperiences(),
        getVerifiedExperiences(),
      ]);
      setPendingExperiences(pending);
      setVerifiedExperiences(verified);
    } catch (err) {
      console.error("Error loading experiences:", err);
      setErrorMessage("Failed to load experiences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (experienceId: string, companyName: string) => {
    setIsLoading(true);
    try {
      const result = await verifyExperience(experienceId);
      if (result.success) {
        setSuccessMessage(`✓ Experience for "${companyName}" verified successfully!`);
        await loadExperiences();
      } else {
        setErrorMessage(result.error || "Failed to verify experience");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (experienceId: string, companyName: string) => {
    if (window.confirm(`Are you sure you want to delete the ${companyName} experience?`)) {
      setIsLoading(true);
      try {
        const result = await deleteExperience(experienceId);
        if (result.success) {
          setSuccessMessage(`Experience for "${companyName}" deleted successfully`);
          await loadExperiences();
        } else {
          setErrorMessage(result.error || "Failed to delete experience");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const experiences = activeTab === "pending" ? pendingExperiences : verifiedExperiences;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="p-2 hover:bg-secondary rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-foreground">Experience Verification</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-700 hover:text-green-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="text-red-700 hover:text-red-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending ({pendingExperiences.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("verified")}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === "verified"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({verifiedExperiences.length})
            </div>
          </button>
        </div>

        {/* Experiences List */}
        {isLoading && !experiences.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading experiences...</p>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg border border-border">
            <p className="text-muted-foreground">
              {activeTab === "pending"
                ? "No pending experiences to verify"
                : "No verified experiences yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((experience) => (
              <div
                key={experience.id}
                className="glass-card p-6 rounded-lg border border-border hover:border-primary/50 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {experience.company}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {experience.role}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          experience.difficulty === "Easy"
                            ? "bg-green-100 text-green-700"
                            : experience.difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {experience.difficulty}
                      </span>
                    </div>
                    {experience.user_name && (
                      <p className="text-sm text-muted-foreground">By: {experience.user_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {activeTab === "pending" && (
                      <button
                        onClick={() => handleVerify(experience.id, experience.company)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(experience.id, experience.company)}
                      disabled={isLoading}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Rounds */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Selection Rounds</p>
                    <div className="flex flex-wrap gap-1">
                      {experience.rounds.map((round) => (
                        <span
                          key={round}
                          className="px-2 py-1 text-xs bg-primary/10 border border-primary/30 text-primary rounded"
                        >
                          {round}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Level */}
                  {experience.confidence_level && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        Confidence Level
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full ${
                                i < experience.confidence_level
                                  ? "bg-yellow-400"
                                  : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {experience.confidence_level}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">Interview Tips</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{experience.tips}</p>
                </div>

                {/* Preparation Strategy */}
                {experience.preparation_strategy && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Preparation Strategy
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {experience.preparation_strategy}
                    </p>
                  </div>
                )}

                {/* Strengths and Mistakes */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {experience.strengths && (
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">Strengths</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {experience.strengths}
                      </p>
                    </div>
                  )}
                  {experience.mistakes && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">Mistakes to Avoid</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {experience.mistakes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <span>👍 {experience.likes} likes</span>
                    <span>Posted: {new Date(experience.created_at).toLocaleDateString()}</span>
                  </div>
                  {experience.verified && (
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminExperienceVerification;
