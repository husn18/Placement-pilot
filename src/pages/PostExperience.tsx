import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { createExperience } from "@/lib/experienceService";
import { logUserActivity } from "@/lib/historyService";
import { Star } from "lucide-react";

const difficulties = ["Easy", "Medium", "Hard"];

const PostExperience = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: "",
    role: "",
    difficulty: "Medium",
    rounds: "",
    tips: "",
    strengths: "",
    mistakes: "",
    preparationStrategy: "",
    confidenceLevel: 3,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate form
      if (
        !form.company ||
        !form.role ||
        !form.rounds ||
        !form.tips ||
        !form.preparationStrategy
      ) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      if (!user?.id) {
        setError("You must be logged in to post an experience");
        setIsSubmitting(false);
        return;
      }

      if (!user?.name || user.name.trim() === "") {
        setError("Your profile name is missing. Please update your profile before posting an experience");
        setIsSubmitting(false);
        return;
      }

      // Create experience
      const experience = await createExperience(user.id, user.name, {
        company: form.company,
        role: form.role,
        difficulty: form.difficulty as "Easy" | "Medium" | "Hard",
        rounds: form.rounds.split(",").map((r) => r.trim()),
        tips: form.tips,
        strengths: form.strengths || undefined,
        mistakes: form.mistakes || undefined,
        preparation_strategy: form.preparationStrategy,
        confidence_level: form.confidenceLevel,
      });

      // Log activity to history
      if (experience?.id) {
        await logUserActivity(
          user.id,
          "experience_post",
          `Posted experience at ${form.company} for ${form.role} role`,
          experience.id
        );
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Experience creation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to post experience";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Post Experience</h1>
          <p className="text-muted-foreground text-sm mt-1">Share your interview experience to help others</p>
          <div className="mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-600">
              💡 Your post will be pending verification. An admin will review and verify your experience before it appears publicly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600">
              Experience posted successfully! Redirecting to dashboard...
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Company *
              </label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Google"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                required
                disabled={isSubmitting || success}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Role Offered *
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="SDE Intern"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                required
                disabled={isSubmitting || success}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Difficulty</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                disabled={isSubmitting || success}
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confidence (1-5)</label>
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, confidenceLevel: n })}
                    disabled={isSubmitting || success}
                    className="disabled:opacity-50"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= form.confidenceLevel
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Rounds (comma-separated) *
            </label>
            <input
              name="rounds"
              value={form.rounds}
              onChange={handleChange}
              placeholder="OA, Tech 1, Tech 2, HR"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
              disabled={isSubmitting || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tips & Advice *
            </label>
            <textarea
              name="tips"
              value={form.tips}
              onChange={handleChange}
              rows={3}
              placeholder="What should others focus on?"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
              required
              disabled={isSubmitting || success}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Strengths
              </label>
              <textarea
                name="strengths"
                value={form.strengths}
                onChange={handleChange}
                rows={2}
                placeholder="What went well?"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
                disabled={isSubmitting || success}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mistakes
              </label>
              <textarea
                name="mistakes"
                value={form.mistakes}
                onChange={handleChange}
                rows={2}
                placeholder="What could be improved?"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
                disabled={isSubmitting || success}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Preparation Strategy *
            </label>
            <textarea
              name="preparationStrategy"
              value={form.preparationStrategy}
              onChange={handleChange}
              rows={2}
              placeholder="How did you prepare?"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
              required
              disabled={isSubmitting || success}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : success ? "Posted Successfully!" : "Submit Experience"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default PostExperience;
