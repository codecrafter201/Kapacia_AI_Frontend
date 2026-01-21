import { GetApiData } from "@/utils/http-client";

export const uploadFile = (formData: FormData) =>
  GetApiData(`/file/upload`, "POST", formData, true);

export const getFilesByCase = (caseId: string) =>
  GetApiData(`/file/case/${caseId}`, "GET", null, true);

export const deleteFile = (fileId: string) =>
  GetApiData(`/file/${fileId}`, "DELETE", null, true);
