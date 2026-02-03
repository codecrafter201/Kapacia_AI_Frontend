import { useState } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCase } from "@/hooks/useCases";
import { usePractitioners } from "@/hooks/useUsers";
import { toast } from "react-toastify";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess?: (caseData: CreateCaseData) => void;
}

interface CreateCaseData {
  caseName: string;
  assignedPractitioner: string;
  supervisorEmail?: string;
  supervisorPassword?: string;
  supervisor?: string;
  tags: string[];
}

interface Practitioner {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

// interface Supervisor {
//   id: string;
//   name: string;
//   currentCount: number;
// }

export const CreateCaseModal = ({
  isOpen,
  onClose,
  onCreateSuccess,
}: CreateCaseModalProps) => {
  const [caseName, setCaseName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [assignedPractitioner, setAssignedPractitioner] = useState("");
  const [status, setStatus] = useState("Active");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags] = useState([
    "anxiety",
    "english",
    "cbt",
    "depression",
    "trauma",
    "ocd",
  ]);
  const [tagInput, setTagInput] = useState("");

  // Use the create case mutation
  const createCaseMutation = useCreateCase();

  // Fetch practitioners from API
  const { data: practitionersData, isLoading: loadingPractitioners } =
    usePractitioners({
      active: true,
      limit: 100,
    });

  const practitioners: Practitioner[] = practitionersData?.practitioners || [];

  //   const supervisors: Supervisor[] = [
  //     { id: "1", name: "Dr. Lim Cen", currentCount: 3 },
  //     { id: "2", name: "Dr. Rachel Lee", currentCount: 0 },
  //   ];

  //   const handleTagToggle = (tag: string) => {
  //     setTags((prev) =>
  //       prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  //     );
  //   };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleCreate = async () => {
    if (!caseName || !assignedPractitioner) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createCaseMutation.mutateAsync({
        displayName: caseName,
        assignedTo: assignedPractitioner,
        tags: tags,
        status: status,
        remarks: remarks.trim(),
      });

      toast.success("Case created successfully!");

      if (onCreateSuccess) {
        onCreateSuccess({
          caseName,

          assignedPractitioner,
          tags,
        });
      }

      // Reset form
      setCaseName("");
      setRemarks("");
      setAssignedPractitioner("");
      setStatus("Active");
      setTags([]);
      setTagInput("");

      onClose();
    } catch (error: any) {
      console.error("Failed to create case:", error);
      toast.error(error?.response?.data?.message || "Failed to create case");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="relative bg-white shadow-xl rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-gray-200 border-b">
          <h2 className="text-md text-secondary md:text-xl">Create New Case</h2>
          <button
            onClick={onClose}
            className="bg-primary/10 p-2 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Case Name */}
          <div className="p-4 border border-border rounded-lg">
            <label className="block mb-3 text-primary text-sm">Case Name</label>
            <Input
              type="text"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="Case Name"
              className="bg-primary/5 border-0 w-full text-accent text-sm"
            />
            {/* </div> */}
          </div>

          <div className="p-4 border border-border rounded-lg">
            <label className="block mb-3 text-primary text-sm">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks"
              rows={3}
              className="bg-primary/5 px-3 py-2 border-0 rounded-lg w-full text-accent text-sm resize-none"
            />
          </div>

          {/* Assign Practitioner */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">ASSIGN</h3>
            <div className="space-y-2 p-4 border border-border rounded-lg">
              <p className="mb-2 font-medium text-sm text-accent-foreground">
                Select Practitioners:
              </p>
              {loadingPractitioners ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="ml-2 text-accent text-sm">
                    Loading practitioners...
                  </span>
                </div>
              ) : practitioners.length === 0 ? (
                <p className="py-4 text-accent text-sm text-center">
                  No active practitioners found
                </p>
              ) : (
                practitioners.map((practitioner) => (
                  <label
                    key={practitioner._id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      checked={assignedPractitioner === practitioner._id}
                      onChange={() => setAssignedPractitioner(practitioner._id)}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-secondary text-sm">
                        {practitioner.name}
                      </span>
                      <span className="text-accent text-xs">
                        {practitioner.email}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Status Selection */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">STATUS</h3>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-primary/5 px-3 py-2.5 border-0 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary w-full text-accent text-sm appearance-none"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="OnHold">On Hold</option>
                <option value="Unapporved">Unapproved</option>
              </select>
              <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Supervision Assignment */}
          {/* <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">
              SUPERVISION ASSIGNMENT (PRACTITIONER ONLY)
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="bg-primary/5 px-3 py-2 border-0 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary w-full text-accent text-sm appearance-none"
                >
                  <option value="">Assign supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {supervisor && (
                <>
                  <Input
                    type="email"
                    value={supervisorEmail}
                    onChange={(e) => setSupervisorEmail(e.target.value)}
                    placeholder="enter email address"
                    className="bg-primary/5 border-0 w-full text-accent text-sm"
                  />
                  <Input
                    type="password"
                    value={supervisorPassword}
                    onChange={(e) => setSupervisorPassword(e.target.value)}
                    placeholder="temporary password"
                    className="bg-primary/5 border-0 w-full text-accent text-sm"
                  />
                </>
              )}

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="mb-2 font-medium text-accent">
                  Available Supervisors:
                </p>
                <ul className="space-y-1 text-accent text-xs">
                  {supervisors.map((sup) => (
                    <li key={sup.id}>
                      • {sup.name} (Currently Supervising {sup.currentCount}{" "}
                      Practitioners)
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-primary text-xs">
                  • No Supervisor required (for senior Practitioners)
                </p>
              </div>
            </div>
          </div> */}

          {/* Tags */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">TAGS</h3>
            <div className="space-y-3">
              {/* Dropdown for predefined tags */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    const selectedTag = e.target.value;
                    if (selectedTag && !tags.includes(selectedTag)) {
                      setTags([...tags, selectedTag]);
                      e.target.value = "";
                    }
                  }}
                  className="bg-primary/5 px-3 py-2 border-0 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary w-full text-accent text-sm appearance-none"
                  defaultValue=""
                >
                  <option value="">Select from predefined tags</option>
                  {availableTags
                    .filter((tag) => !tags.includes(tag))
                    .map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                </select>
                <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Input for custom tags */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Or type custom tag and press Enter"
                  className="flex-1 bg-primary/5 border-0 text-accent text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!tagInput.trim()}
                  className="px-4 text-white text-sm"
                >
                  Add
                </Button>
              </div>

              {/* Display selected tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-primary text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary/60 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-gray-200 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-700"
            disabled={createCaseMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="text-white"
            disabled={createCaseMutation.isPending}
          >
            {createCaseMutation.isPending ? "Creating..." : "Create Case"}
          </Button>
        </div>
      </div>
    </div>
  );
};
