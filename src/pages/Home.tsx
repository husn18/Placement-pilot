import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Star, Heart, Loader, Trash2, CheckCircle, Target, BookOpen, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllExperiences, deleteExperiencePost, toggleLike, checkIfUserLiked } from "@/lib/experienceService";
import { useAuth } from "@/context/AuthContext";

interface Experience {
  id: string;
  user_id: string;
  company: string;
  role: string;
  difficulty: string;
  rounds: string[];
  tips: string;
  preparation_strategy: string;
  confidence_level: number | null;
  likes?: number;
  created_at: string;
  verified: boolean;
}

const Home = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllExperiences();
        // Show only 5 most recent experiences on home page
        const recentExperiences = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5);
        setExperiences(recentExperiences);
        
        const initialLikes: Record<string, number> = {};
        recentExperiences.forEach((exp) => {
          initialLikes[exp.id] = exp.likes || 0;
        });
        setLikes(initialLikes);

        if (user?.id) {
          const initialLiked: Record<string, boolean> = {};
          for (const exp of recentExperiences) {
            const hasLiked = await checkIfUserLiked(exp.id, user.id);
            initialLiked[exp.id] = hasLiked;
          }
          setLiked(initialLiked);
        }
      } catch (err) {
        console.error("Error loading experiences:", err);
        setError("Failed to load experiences. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadExperiences();
  }, [user?.id]);

  const handleLike = async (id: string) => {
    if (!user?.id) {
      alert("Please log in to like posts");
      return;
    }

    try {
      setLikingId(id);
      const isCurrentlyLiked = !!liked[id];
      setLiked((prev) => ({
        ...prev,
        [id]: !isCurrentlyLiked,
      }));
      setLikes((l) => ({
        ...l,
        [id]: l[id] + (isCurrentlyLiked ? -1 : 1),
      }));
      await toggleLike(id, user.id);
    } catch (err) {
      console.error("Error toggling like:", err);
      setLiked((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      alert("Failed to update like. Please try again.");
    } finally {
      setLikingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteExperiencePost(id);
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
      alert("Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-12">
        {/* Welcome Section */}
        {user ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-10 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 shadow-lg shadow-primary/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Welcome back, {user.user_metadata?.full_name || "Student"}! 👋
                </h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Explore real interview experiences and prepare for your placements with insights from peers.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 mb-10 rounded-xl text-center border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 shadow-lg shadow-primary/10"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Your Gateway to Placement Success 🚀
            </h1>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-sm sm:text-base">
              Learn from real interview experiences, check your eligibility, and prepare smarter with Placement Pilot.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Sign In <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border-2 border-primary/40 text-primary px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/10 hover:border-primary transition-all duration-300"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {/* Feature Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group cursor-pointer transform hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 group-hover:from-cyan-500/30 transition-colors">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground text-lg">Check Eligibility</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Find companies you're eligible for based on CGPA and branch.
                </p>
                <Link
                  to="/eligibility"
                  className="text-xs text-cyan-400 font-semibold mt-3 inline-block hover:text-cyan-300 transition-colors group/link flex items-center gap-1"
                >
                  Check now <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group cursor-pointer transform hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 group-hover:from-purple-500/30 transition-colors">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground text-lg">Browse Experiences</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Read verified interview experiences from students like you.
                </p>
                <Link
                  to="/experiences"
                  className="text-xs text-purple-400 font-semibold mt-3 inline-block hover:text-purple-300 transition-colors group/link flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 rounded-lg border border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 group cursor-pointer transform hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-500/10 group-hover:from-pink-500/30 transition-colors">
                <CheckCircle className="h-6 w-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground text-lg">Prepare & Share</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Share your interview experiences and help peers prepare.
                </p>
                {user && (
                  <Link
                    to="/post-experience"
                    className="text-xs text-pink-400 font-semibold mt-3 inline-block hover:text-pink-300 transition-colors group/link flex items-center gap-1"
                  >
                    Share experience <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Experiences Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Latest Interview Experiences
              </h2>
              <p className="text-sm text-muted-foreground mt-2">Most recent insights from your peers</p>
            </div>
            <Link
              to="/experiences"
              className="text-sm text-primary font-semibold hover:text-accent transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/10"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Experience Feed */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-8 w-8 text-primary animate-spin mb-3" />
                <p className="text-muted-foreground">Loading experiences...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-destructive">{error}</p>
              </div>
            ) : experiences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 glass-card p-8 sm:p-12 rounded-lg border border-primary/10 bg-gradient-to-br from-primary/5 to-background">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <BookOpen className="h-12 w-12 text-primary/70" />
                </div>
                <p className="text-muted-foreground mb-6 text-center">No experiences shared yet. Be the first to share your journey!</p>
                {user && (
                  <Link
                    to="/post-experience"
                    className="text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Share your experience
                  </Link>
                )}
              </div>
            ) : (
              experiences.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 sm:p-6 rounded-lg border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group"
                >
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-primary">
                        {exp.company.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-display font-semibold text-foreground text-base">{exp.company}</h3>
                            {exp.verified && (
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                                ✓ Verified
                              </span>
                            )}
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                                exp.difficulty === "Hard"
                                  ? "bg-destructive/15 text-destructive"
                                  : exp.difficulty === "Easy"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {exp.difficulty}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{exp.role}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{exp.tips}</p>

                      {/* Rounds */}
                      {exp.rounds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                          {exp.rounds.slice(0, 3).map((round, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1.5 rounded-full bg-secondary/50 text-muted-foreground font-medium border border-secondary hover:border-primary/30 transition-colors"
                            >
                              {round}
                            </span>
                          ))}
                          {exp.rounds.length > 3 && (
                            <span className="text-xs px-2.5 py-1.5 rounded-full text-muted-foreground font-medium">
                              +{exp.rounds.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-5">
                          <button
                            onClick={() => handleLike(exp.id)}
                            disabled={likingId === exp.id}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50 group/like"
                          >
                            {likingId === exp.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart
                                className={`h-4 w-4 transition-all duration-200 ${
                                  liked[exp.id]
                                    ? "text-red-500 fill-red-500 scale-110"
                                    : "group-hover/like:scale-110 group-hover/like:text-red-500"
                                }`}
                              />
                            )}
                            <span className="text-xs font-semibold">{likes[exp.id] || 0}</span>
                          </button>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold">{exp.confidence_level || 0}/5</span>
                          </div>
                        </div>

                        {user && user.id === exp.user_id && (
                          <button
                            onClick={() => handleDelete(exp.id)}
                            disabled={deletingId === exp.id}
                            className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 hover:bg-destructive/10 px-2 py-1 rounded"
                            title="Delete this post"
                          >
                            {deletingId === exp.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
