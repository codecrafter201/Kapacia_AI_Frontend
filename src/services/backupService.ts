import { GetApiData } from "../utils/http-client";

/**
 * Backup all system data
 */
export const backupAllData = async (): Promise<Blob> => {
  const url = "/backup";
  const response = await GetApiData(url, "GET");
  
  // Convert the parsed JSON object back to a formatted string
  const jsonString = JSON.stringify(response.data, null, 2);
  
  return new Blob([jsonString], { type: "application/json" });
};
