import { GetApiData } from "../../utils/http-client";

// Get all practitioners (Admin only)
export const getPractitioners = function (params = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.active !== undefined) queryParams.append("active", params.active);

  const query = queryParams.toString();
  return GetApiData(
    `/user/practitioners${query ? `?${query}` : ""}`,
    "GET",
    null,
    true
  );
};
