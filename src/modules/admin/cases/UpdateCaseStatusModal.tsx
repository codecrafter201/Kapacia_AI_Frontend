import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import { useUpdateCase } from "@/hooks/useCases";

interface UpdateCaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string | undefined;
  currentStatus: string;
  caseName: string;
  currentTags?: string[];
  currentRemarks?: string;
}

export const UpdateCaseStatusModal = ({
  isOpen,
  onClose,
  caseId,
  currentStatus,
  caseName,
  currentTags = [],
  currentRemarks = "",
}: UpdateCaseStatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [updatedName, setUpdatedName] = useState(caseName);
  const [tagsInput, setTagsInput] = useState(currentTags.join(", "));
  const [remarks, setRemarks] = useState(currentRemarks);
  const updateCaseMutation = useUpdateCase();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Case ID is missing",
      });
      return;
    }

    const parsedTags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const nameChanged = updatedName.trim() !== caseName.trim();
    const statusChanged = selectedStatus !== currentStatus;
    const remarksChanged = (remarks || "").trim() !== (currentRemarks || "").trim();
    const tagsChanged =
      JSON.stringify(parsedTags) !== JSON.stringify(currentTags || []);

    if (!nameChanged && !statusChanged && !remarksChanged && !tagsChanged) {
      Swal.fire({
        icon: "info",
        title: "No Changes",
        text: "Please update at least one field",
      });
      return;
    }

    try {
      await updateCaseMutation.mutateAsync({
        caseId,
        data: {
          displayName: updatedName.trim(),
          status: selectedStatus,
          tags: parsedTags,
          remarks: remarks.trim(),
        },
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Case status updated successfully",
        showConfirmButton: false,
        timer: 1500,
      });

      onClose();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update case status",
      });
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50">
      <div className="bg-white shadow-xl mx-4 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="font-semibold text-secondary text-xl">
            Update Case Status
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                Case
              </label>
              <input
                type="text"
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full text-sm"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. anxiety, cbt"
                className="px-3 py-2 border border-gray-300 focus:border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full text-sm"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="px-3 py-2 border border-gray-300 focus:border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full text-sm resize-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                Current Status
              </label>
              <p className="text-accent text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    currentStatus === "Active"
                      ? "bg-ring/10 text-ring"
                      : currentStatus === "Closed"
                        ? "bg-gray-100 text-gray-600"
                        : currentStatus === "OnHold"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                  }`}
                >
                  {currentStatus === "OnHold" ? "On Hold" : currentStatus}
                </span>
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full"
                required
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="OnHold">On Hold</option>
                <option value="Unapproved">Unapproved</option>
              </select>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Changing the case status will affect the
                practitioner's ability to record sessions and upload files.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 bg-gray-50 px-6 py-4 border-t rounded-b-lg">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={updateCaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCaseMutation.isPending}
              className="bg-primary hover:bg-primary/80 text-white"
            >
              {updateCaseMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
