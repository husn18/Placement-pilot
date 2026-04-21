import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { getAllExperiencesWithUsers, toggleLike, checkIfUserLiked } from "@/lib/experienceService";
import { sendChatRequest, checkChatRequestExists } from "@/lib/chatRequestService";
import { Star, Heart, MessageCircle, Loader, CheckCircle, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Experiences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [liking, setLiking] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState<Set<string>>(new Set());
  const [chatRequests, setChatRequests] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      const data = await getAllExperiencesWithUsers();
      setExperiences(data);
      
      // Check which posts user has liked
      if (user?.id) {
        const liked = new Set<string>();
        for (const exp of data) {
          const hasLiked = await checkIfUserLiked(exp.id, user.id);
          if (hasLiked) {
            liked.add(exp.id);
          }
        }
        setLikedPosts(liked);
      }
      
      setLoading(false);
    };

    fetchExperiences();
  }, [user?.id]);

  const handleToggleLike = async (experienceId: string) => {
    if (!user?.id) {
      alert("Please log in to like posts");
      return;
    }

    try {
      setLiking(prev => new Set([...prev, experienceId]));
      
      await toggleLike(experienceId, user.id);
      
      // Update local state
      setLikedPosts(prev => {
        const updated = new Set(prev);
        if (updated.has(experienceId)) {
          updated.delete(experienceId);
        } else {
          updated.add(experienceId);
        }
        return updated;
      });
      
      // Update like count in experiences
      setExperiences(prev => 
        prev.map(exp => 
          exp.id === experienceId 
            ? { 
                ...exp, 
                likes: likedPosts.has(experienceId) 
                  ? (exp.likes || 0) - 1 
                  : (exp.likes || 0) + 1 
              }
            : exp
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Failed to update like");
    } finally {
      setLiking(prev => {
        const updated = new Set(prev);
        updated.delete(experienceId);
        return updated;
      });
    }
  };

  const handleConnect = async (experienceId: string, receiverId: string, receiverName: string) => {
    if (!user?.id) {
      alert("Please log in to connect with users");
      return;
    }

    if (user.id === receiverId) {
      alert("You cannot connect with yourself");
      return;
    }

    try {
      setConnecting(prev => new Set([...prev, experienceId]));

      // Check if request already exists
      const existingRequest = await checkChatRequestExists(user.id, receiverId);
      if (existingRequest && existingRequest.status !== 'rejected') {
        alert("You have already sent a connect request to this user");
        return;
      }

      // Send chat request
      await sendChatRequest(user.id, receiverId, experienceId);
      alert(`Connect request sent to ${receiverName}! Go to PrepTalk to view your requests.`);
      
      // Redirect to PrepTalk
      navigate("/preptalk");
    } catch (err: any) {
      console.error("Error sending connect request:", err);
      alert(err?.message || "Failed to send connect request");
    } finally {
      setConnecting(prev => {
        const updated = new Set(prev);
        updated.delete(experienceId);
        return updated;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10 sm:mb-12 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex-shrink-0">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Interview Experiences
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                Learn from real placement interviews and connect with peers who've been through it
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 animate-in fade-in duration-500">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin" />
              <Loader className="absolute inset-0 m-auto h-8 w-8 text-blue-300 animate-spin" />
            </div>
          </div>
        ) : experiences.length === 0 ? (
          <div className="glass-card p-12 sm:p-16 text-center animate-in fade-in duration-500 rounded-lg border border-primary/10 bg-gradient-to-br from-primary/5 to-background">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-primary/70" />
            </div>
            <p className="text-muted-foreground text-lg">
              No interview experiences shared yet.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Be the first to share your placement journey!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {experiences.map((exp) => {
              const userInfo = exp.users || {};
              const displayName = exp.user_name || userInfo.name || "Anonymous";
              const displayBranch = userInfo.branch || "N/A";
              const isLiked = likedPosts.has(exp.id);
              const isLiking = liking.has(exp.id);
              
              return (
                <div key={exp.id} className="glass-card p-6 sm:p-7 rounded-lg border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom duration-500">
                  {/* Header Section */}
                  <div className="mb-5 pb-4 border-b border-border/50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-1">
                          {exp.company}
                        </h3>
                        <p className="text-sm font-semibold text-muted-foreground mb-3">
                          {exp.role}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="inline-block">by <span className="font-medium text-foreground">{displayName}</span></span>
                          <span>•</span>
                          <span className="inline-block"><span className="font-medium text-foreground">{displayBranch}</span></span>
                          <span>•</span>
                          <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {exp.verified && (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                          ✓ Verified
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                          exp.difficulty === "Hard"
                            ? "bg-destructive/15 text-destructive border-destructive/20"
                            : exp.difficulty === "Medium"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {exp.difficulty} Difficulty
                      </span>
                      {exp.confidence_level && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/20">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">
                            {exp.confidence_level}/5
                          </span>
                        </div>
                      )}
                      {!exp.verified && (
                        <span className="text-xs text-muted-foreground italic px-2 py-1 rounded bg-secondary/50">
                          Pending verification
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="space-y-4 mb-5">
                    {/* Tips */}
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="inline-block w-1 h-1 rounded-full bg-cyan-400"></span>
                        Key Tips
                      </h4>
                      <p className="text-sm text-foreground/85 leading-relaxed">{exp.tips}</p>
                    </div>

                    {/* Rounds */}
                    {(exp.rounds || []).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
                          <span className="inline-block w-1 h-1 rounded-full bg-purple-400"></span>
                          Interview Rounds
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(exp.rounds || []).map((round: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-full bg-gradient-to-r from-purple-500/10 to-purple-500/5 px-3.5 py-1.5 text-xs text-foreground font-medium border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                            >
                              {round}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Mistakes Grid */}
                    {(exp.strengths || exp.mistakes) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {exp.strengths && (
                          <div className="p-3.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              What Went Well
                            </h4>
                            <p className="text-xs text-foreground/75 leading-relaxed">
                              {exp.strengths}
                            </p>
                          </div>
                        )}
                        {exp.mistakes && (
                          <div className="p-3.5 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                            <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive"></span>
                              Areas for Improvement
                            </h4>
                            <p className="text-xs text-foreground/75 leading-relaxed">
                              {exp.mistakes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preparation Strategy */}
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="inline-block w-1 h-1 rounded-full bg-pink-400"></span>
                        Preparation Strategy
                      </h4>
                      <p className="text-sm text-foreground/85 leading-relaxed">{exp.preparation_strategy}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-border/50 flex items-center gap-2.5">
                    <button
                      onClick={() => handleToggleLike(exp.id)}
                      disabled={isLiking}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                        isLiked
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                          : "bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground border border-secondary"
                      } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={user ? (isLiked ? "Unlike" : "Like") : "Login to like"}
                    >
                      <Heart
                        className={`h-4 w-4 transition-all ${isLiked ? "fill-current scale-105" : ""}`}
                      />
                      <span className="font-semibold">{exp.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => handleConnect(exp.id, exp.user_id, exp.user_name || userInfo.name || "User")}
                      disabled={connecting.has(exp.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-xs transition-all duration-200 border ${
                        connecting.has(exp.id)
                          ? "opacity-60 cursor-not-allowed bg-secondary text-muted-foreground border-secondary"
                          : "bg-gradient-to-r from-primary/20 to-accent/20 text-primary hover:from-primary/30 hover:to-accent/30 border border-primary/30 hover:border-primary/50"
                      }`}
                      title="Connect with this user for chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-semibold">
                        {connecting.has(exp.id) ? "Connecting..." : "Connect"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Experiences;
