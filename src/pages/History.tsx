import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getUserEligibilityHistory, getUserActivityHistory, EligibilityCheckResult } from "@/lib/historyService";
import { getUserExperiences, Experience, deleteExperiencePost } from "@/lib/experienceService";
import { Clock, Target, FileText, Trash2, Loader } from "lucide-react";

interface HistoryItem {
  id: string;
  type: "eligibility_check" | "experience_post" | "activity";
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

const History = () => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "eligibility" | "experience">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllHistory = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const items: HistoryItem[] = [];

        // Fetch eligibility checks
        const checks = await getUserEligibilityHistory(user.id);
        checks.forEach((check) => {
          items.push({
            id: check.id || "",
            type: "eligibility_check",
            title: `${check.branch} Branch Eligibility Check`,
            description: `CGPA: ${check.cgpa} • ${check.skills?.length || 0} skills selected`,
            timestamp: check.created_at || "",
            data: check,
          });
        });

        // Fetch experiences
        const experiences = await getUserExperiences(user.id);
        experiences.forEach((exp) => {
          items.push({
            id: exp.id,
            type: "experience_post",
            title: `${exp.company} - ${exp.role}`,
            description: `${exp.difficulty} difficulty • ${exp.verified ? "✓ Verified" : "Pending verification"}`,
            timestamp: exp.created_at,
            data: exp,
          });
        });

        // Sort by timestamp (newest first)
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setHistoryItems(items);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, [user?.id]);

  const filteredItems = historyItems.filter((item) => {
    if (filter === "all") return true;
    if (filter === "eligibility") return item.type === "eligibility_check";
    if (filter === "experience") return item.type === "experience_post";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "eligibility_check":
        return <Target className="h-5 w-5 text-primary" />;
      case "experience_post":
        return <FileText className="h-5 w-5 text-accent" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "eligibility_check":
        return "border-primary/20 bg-primary/5";
      case "experience_post":
        return "border-accent/20 bg-accent/5";
      default:
        return "border-border";
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    if (item.type === "experience_post") {
      if (!window.confirm("Are you sure you want to delete this post? It will be archived but cannot be recovered.")) {
        return;
      }

      try {
        setDeletingId(item.id);
        await deleteExperiencePost(item.id);
        // Remove from local state
        setHistoryItems((prev) => prev.filter((i) => i.id !== item.id));
        alert("Post deleted successfully!");
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post. Please try again.");
      } finally {
        setDeletingId(null);
      }
    } else if (item.type === "eligibility_check") {
      alert("Eligibility checks cannot be deleted yet.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Your History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View all your eligibility checks and experience posts
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          {["all", "eligibility", "experience"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" && "All"}
              {f === "eligibility" && "Eligibility Checks"}
              {f === "experience" && "Experience Posts"}
            </button>
          ))}
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              No history yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {filter === "all"
                ? "Your eligibility checks and experience posts will appear here"
                : filter === "eligibility"
                ? "Run your first eligibility check to see it here"
                : "Post your first interview experience to see it here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id || index}
                className={`glass-card p-4 border-l-4 transition-all hover:border-primary/50 ${getColor(item.type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.timestamp).toLocaleDateString()} at{" "}
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {item.type === "eligibility_check" && (
                      <button className="px-3 py-1.5 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        View Results
                      </button>
                    )}
                    {item.type === "experience_post" && (
                      <button className="px-3 py-1.5 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                        View Post
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={item.type === "experience_post" ? "Delete post" : "Cannot delete"}
                    >
                      {deletingId === item.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredItems.length > 0 && (
          <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredItems.length}</span> of{" "}
              <span className="font-semibold text-foreground">{historyItems.length}</span> total items
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
