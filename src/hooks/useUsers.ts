import { useQuery } from "@tanstack/react-query";
import { getPractitioners } from "@/services/userService/userService";

// Query keys factory
export const userKeys = {
  all: ["users"] as const,
  practitioners: () => [...userKeys.all, "practitioners"] as const,
  practitionersList: (params: any) =>
    [...userKeys.practitioners(), params] as const,
};

// Get practitioners (Admin only)
export const usePractitioners = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}) => {
  return useQuery({
    queryKey: userKeys.practitionersList(params),
    queryFn: async () => {
      const response = await getPractitioners(params || {});
      return response.data;
    },
  });
};
