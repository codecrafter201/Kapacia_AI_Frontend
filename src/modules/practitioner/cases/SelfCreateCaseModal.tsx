import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSelfCase } from "@/hooks/useCases";
import { toast } from "react-toastify";

interface SelfCreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfCreateCaseModal = ({
  isOpen,
  onClose,
}: SelfCreateCaseModalProps) => {
  const [caseName, setCaseName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const createSelfCase = useCreateSelfCase();

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleCreate = async () => {
    if (!caseName.trim()) {
      toast.error("Please enter a case name");
      return;
    }

    try {
      await createSelfCase.mutateAsync({
        displayName: caseName.trim(),
        tags,
        remarks: remarks.trim(),
      });

      toast.success("Case created and assigned to you");
      setCaseName("");
      setRemarks("");
      setTags([]);
      setTagInput("");
      onClose();
    } catch (err: any) {
      console.error("Failed to create self case", err);
      toast.error(err?.response?.data?.message || "Failed to create case");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-3">
      <div className="relative bg-white shadow-xl rounded-xl w-full max-w-lg">
        <div className="flex justify-between items-center px-5 py-4 border-border border-b">
          <div>
            <p className="text-md text-primary uppercase tracking-wide">
              Create Case
            </p>
            <p className="mt-1 text-accent text-xs">
              Status will be Active and assigned only to you.
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-primary/10 p-2 rounded-full text-primary hover:text-primary/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <label className="text-primary text-sm">Case name</label>
            <Input
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="e.g. John Doe - CBT"
              className="bg-primary/5 border-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-primary text-sm">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks"
              rows={3}
              className="bg-primary/5 px-3 py-2 border-0 rounded-md w-full text-accent text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-primary text-sm">Tags (optional)</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag"
                className="bg-primary/5 border-0"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-full text-primary text-xs"
                  >
                    #{tag}
                    <button
                      type="button"
                      className="text-primary/70 hover:text-primary"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-border border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createSelfCase.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="text-white"
            disabled={createSelfCase.isLoading}
          >
            {createSelfCase.isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create case"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
