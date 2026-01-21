import { useState, useRef } from "react";
import { X, Upload as UploadIcon, File as FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUploadFile } from "@/hooks/useFiles";
import { useQueryClient } from "@tanstack/react-query";

interface FileUploadData {
  file: File;
  description: string;
  linkOption: "case" | "session";
  tags: string[];
  extractText: boolean;
  applyPiiMasking: boolean;
  caseId?: string;
}

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  onUploadSuccess?: (fileData: FileUploadData) => void;
}

export const UploadFileModal = ({
  isOpen,
  onClose,
  caseId,
  onUploadSuccess,
}: UploadFileModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [linkOption, setLinkOption] = useState<"case" | "session">("case");
  const [tags, setTags] = useState("");
  const [extractText, setExtractText] = useState(true);
  const [applyPiiMasking, setApplyPiiMasking] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadFile();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const validateFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload PDF, DOCX, or TXT files.");
      return false;
    }

    if (file.size > maxSize) {
      alert("File size exceeds 10 MB limit.");
      return false;
    }

    return true;
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    if (!caseId) {
      alert("caseId is required to upload a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("caseId", caseId);
    if (fileDescription) formData.append("description", fileDescription);
    if (linkOption) formData.append("linkOption", linkOption);
    if (tags) formData.append("tags", tags);
    formData.append("extractText", String(extractText));
    formData.append("applyPiiMasking", String(applyPiiMasking));

    try {
      const response = await uploadMutation.mutateAsync(formData);
      if (onUploadSuccess) {
        onUploadSuccess({
          file: selectedFile,
          description: fileDescription,
          linkOption,
          tags: tags.split(" ").filter((t) => t.trim()),
          extractText,
          applyPiiMasking,
          caseId,
          response,
        });
      }
      await qc.invalidateQueries({ queryKey: ["timelinesummary"] });
      handleClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Failed to upload file. Please try again.";
      alert(message);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileDescription("");
    setTags("");
    setLinkOption("case");
    setExtractText(true);
    setApplyPiiMasking(true);
    onClose();
  };

  const getFileType = (file: File) => {
    if (file.type.includes("pdf")) return "PDF Document";
    if (file.type.includes("word")) return "DOCX Document";
    if (file.type.includes("text")) return "TXT Document";
    return "Document";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="relative bg-white shadow-xl rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-gray-200 border-b">
          <h2 className="font-normal text-md text-secondary sm:text-xl">
            Upload File
          </h2>
          <button
            onClick={handleClose}
            className="bg-primary/10 p-1 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {!selectedFile ? (
            /* Upload Area */
            <div className="p-6 border-2 border-blue-200 rounded-lg">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2  border-dashed rounded-lg p-8 text-center ${
                  isDragging
                    ? "border-primary bg-primary/20"
                    : "border-primary/60 bg-primary/2"
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <UploadIcon className="w-12 h-12 text-primary" />
                  <div>
                    <p className="mb-2 text-md text-secondary">
                      Drag & drop files here
                    </p>
                    <p className="mb-3 text-secondary text-xs">or</p>
                    <Button
                      onClick={handleChooseFile}
                      variant="link"
                      className="border border-primary/10 font-medium"
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
              </div>
              <div className="mt-4 text-xs text-accent-foreground">
                <p>Accepted formats: PDF, DOCX, TXT</p>
                <p>Maximum file size: 10 MB</p>
              </div>
            </div>
          ) : (
            /* File Details */
            <>
              {/* Selected File */}
              <div className="p-4 border border-border rounded-lg">
                <h3 className="mb-3 font-normal text-primary text-sm">
                  SELECTED FILE
                </h3>
                <div className="flex items-start gap-3 bg-primary/5 p-3 md:p-4 rounded-2xl">
                  <FileIcon className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-secondary text-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-accent text-xs">
                      Size: {formatFileSize(selectedFile.size)}
                    </p>
                    <p className="text-accent text-xs">
                      Type: {getFileType(selectedFile)}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-destructive hover:text-destructive/80 text-sm cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* File Details Section */}
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <h3 className="text-primary text-sm">FILE DETAILS</h3>

                {/* File Description */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <label className="block mb-2 text-accent text-sm">
                    File Description (optional):
                  </label>
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Previous psychiatric evaluation from 2022. Patient diagnosed with GAD, treated with Sertraline (discontinued)..."
                    className="bg-primary/5 px-3 py-2 border border-primary/20 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full min-h-25 text-gray-700 text-sm"
                  />
                </div>

                {/* Link to Session */}
                <div>
                  <label className="block mb-2 text-accent text-sm">
                    Link to specific session (optional):
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={linkOption === "case"}
                        onChange={() => setLinkOption("case")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 text-sm">
                        No, attach to case only
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={linkOption === "session"}
                        onChange={() => setLinkOption("session")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 text-sm">
                        Yes, link to:
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block mb-2 text-accent text-sm">
                    Tags (optional):
                  </label>
                  <Input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="#previous-diagnosis #medication-history"
                    className="bg-primary/5 border border-primary/20 w-full text-accent text-sm"
                  />
                </div>
              </div>

              {/* Privacy & Indexing */}
              <div className="space-y-3 p-4 border border-border rounded-lg">
                <h3 className="text-primary text-sm">PRIVACY & INDEXING</h3>

                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extractText}
                      onChange={() => setExtractText(!extractText)}
                      className="mt-1 rounded focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        {/* <CheckCircle2 className="w-4 h-4 text-ring" /> */}
                        <span className="text-secondary text-sm">
                          Extract text and index for search (RAG)
                        </span>
                      </div>
                      <p className="mt-1 text-accent text-xs">
                        Allows AI to answer questions about this document
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyPiiMasking}
                      onChange={() => setApplyPiiMasking(!applyPiiMasking)}
                      className="mt-1 rounded focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        {/* <CheckCircle2 className="w-4 h-4 text-ring" /> */}
                        <span className="text-secondary text-sm">
                          Apply PII masking before indexing
                        </span>
                      </div>
                      <p className="mt-1 text-accent text-xs">
                        Masks identifiers (NRIC, phone) in indexed text
                      </p>
                    </div>
                  </label>

                  <div className="flex items-center bg-[#F2933911] p-2 rounded-full text-[#F29339] text-xs">
                    <span className="">⚠</span>
                    <p className="text-xs">
                      Original file is always stored as-is (no masking)
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-gray-200 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className={`${
              !selectedFile || uploadMutation.isPending
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            } text-white`}
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
          </Button>
        </div>
      </div>
    </div>
  );
};
