import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, X } from "lucide-react";
import { addCompany, getCompanies, deleteCompany, type Company } from "@/lib/adminService";

const AddCompany = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    min_cgpa: "0",
    selection_rounds: [] as string[],
    eligible_branches: [] as string[],
    required_skills: [] as string[],
  });

  const [roundInput, setRoundInput] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const branches = [
    "CSE",
    "ECE",
    "EE",
    "ME",
    "CE",
    "BT",
    "CH",
    "MT",
    "IT",
    "MME",
    "MMT",
  ];

  const commonSkills = [
    "C++",
    "Java",
    "Python",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Git",
    "Data Structures",
    "Algorithms",
    "OOP",
  ];

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const fetchedCompanies = await getCompanies();
      setCompanies(fetchedCompanies);
    } catch (err) {
      console.error("Error loading companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }

    const cgpa = parseFloat(formData.min_cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      newErrors.min_cgpa = "CGPA must be between 0 and 10";
    }

    if (formData.selection_rounds.length === 0) {
      newErrors.selection_rounds = "At least one selection round is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddRound = () => {
    if (roundInput.trim() && !formData.selection_rounds.includes(roundInput.trim())) {
      setFormData({
        ...formData,
        selection_rounds: [...formData.selection_rounds, roundInput.trim()],
      });
      setRoundInput("");
    }
  };

  const handleRemoveRound = (round: string) => {
    setFormData({
      ...formData,
      selection_rounds: formData.selection_rounds.filter((r) => r !== round),
    });
  };

  const handleToggleBranch = (branch: string) => {
    setFormData({
      ...formData,
      eligible_branches: formData.eligible_branches.includes(branch)
        ? formData.eligible_branches.filter((b) => b !== branch)
        : [...formData.eligible_branches, branch],
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await addCompany({
        name: formData.name,
        description: formData.description || undefined,
        min_cgpa: parseFloat(formData.min_cgpa),
        selection_rounds: formData.selection_rounds,
        eligible_branches: formData.eligible_branches,
        required_skills: formData.required_skills,
      });

      if (result.success) {
        setSuccessMessage(`✓ Company "${result.company?.name}" added successfully!`);
        // Reset form
        setFormData({
          name: "",
          description: "",
          min_cgpa: "0",
          selection_rounds: [],
          eligible_branches: [],
          required_skills: [],
        });
        setShowForm(false);
        // Reload companies
        await loadCompanies();
      } else {
        setErrorMessage(result.error || "Failed to add company");
      }
    } catch (err) {
      console.error("Error adding company:", err);
      setErrorMessage("An error occurred while adding the company");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (window.confirm(`Are you sure you want to delete "${companyName}"?`)) {
      setIsLoading(true);
      try {
        const result = await deleteCompany(companyId);
        if (result.success) {
          setSuccessMessage(`Company "${companyName}" deleted successfully`);
          await loadCompanies();
        } else {
          setErrorMessage(result.error || "Failed to delete company");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Company Management</h1>
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

        {/* Add Company Form Section */}
        {showForm && (
          <div className="glassmorphic-card p-8 rounded-lg border border-border mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Add New Company</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-secondary rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name
                      ? "border-destructive focus:ring-destructive/50"
                      : "border-border focus:ring-primary/50"
                  } bg-card`}
                  placeholder="e.g., Google, Microsoft, Amazon"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card"
                  placeholder="Brief description about the company and role"
                />
              </div>

              {/* Minimum CGPA */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum CGPA *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.min_cgpa}
                  onChange={(e) =>
                    setFormData({ ...formData, min_cgpa: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.min_cgpa
                      ? "border-destructive focus:ring-destructive/50"
                      : "border-border focus:ring-primary/50"
                  } bg-card`}
                />
                {errors.min_cgpa && (
                  <p className="mt-1 text-xs text-destructive">{errors.min_cgpa}</p>
                )}
              </div>

              {/* Selection Rounds */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Selection Rounds *
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={roundInput}
                    onChange={(e) => setRoundInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddRound()}
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card"
                    placeholder="e.g., Online Assessment, Technical Interview"
                  />
                  <button
                    type="button"
                    onClick={handleAddRound}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.selection_rounds.map((round) => (
                    <div
                      key={round}
                      className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1 flex items-center gap-2"
                    >
                      <span className="text-sm text-primary">{round}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(round)}
                        className="text-primary hover:text-primary/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.selection_rounds && (
                  <p className="mt-2 text-xs text-destructive">{errors.selection_rounds}</p>
                )}
              </div>

              {/* Eligible Branches */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Eligible Branches
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {branches.map((branch) => (
                    <label key={branch} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.eligible_branches.includes(branch)}
                        onChange={() => handleToggleBranch(branch)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground">{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <select
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card"
                  >
                    <option value="">Select or type skill</option>
                    {commonSkills.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card"
                    placeholder="Custom skill"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill) => (
                    <div
                      key={skill}
                      className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 flex items-center gap-2"
                    >
                      <span className="text-sm text-blue-700">{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition font-medium"
                >
                  {isLoading ? "Adding Company..." : "Add Company"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-secondary transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Company Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
          >
            <Plus className="h-5 w-5" />
            Add New Company
          </button>
        )}

        {/* Companies List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Companies ({companies.length})
          </h2>

          {isLoading && !companies.length ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-lg border border-border">
              <p className="text-muted-foreground">No companies added yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="glass-card p-6 rounded-lg border border-border hover:border-primary/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {company.name}
                      </h3>
                      {company.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {company.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        disabled={isLoading}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Minimum CGPA</p>
                      <p className="text-muted-foreground">{company.min_cgpa}</p>
                    </div>

                    <div>
                      <p className="font-medium text-foreground">Selection Rounds</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {company.selection_rounds.map((round) => (
                          <span
                            key={round}
                            className="px-2 py-1 text-xs bg-primary/10 border border-primary/30 text-primary rounded"
                          >
                            {round}
                          </span>
                        ))}
                      </div>
                    </div>

                    {company.eligible_branches.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground">Eligible Branches</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {company.eligible_branches.map((branch) => (
                            <span
                              key={branch}
                              className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-700 rounded"
                            >
                              {branch}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {company.required_skills.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground">Required Skills</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {company.required_skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    Added: {new Date(company.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddCompany;
