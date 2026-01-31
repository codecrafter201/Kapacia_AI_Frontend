import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPractitioners,
  getAllUsers,
  createUserByAdmin,
  updateUserCredentials,
  toggleUserStatus,
  updateProfile,
  updatePassword,
} from "@/services/userService/userService";

// Query keys factory
export const userKeys = {
  all: ["users"] as const,
  allUsers: () => [...userKeys.all, "all"] as const,
  practitioners: () => [...userKeys.all, "practitioners"] as const,
  practitionersList: (params: any) =>
    [...userKeys.practitioners(), params] as const,
  allUsersList: (params: any) => [...userKeys.allUsers(), params] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

// Get all users (Admin only)
export const useAllUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  role?: string;
}) => {
  return useQuery({
    queryKey: userKeys.allUsersList(params),
    queryFn: async () => {
      const response = await getAllUsers(params || {});
      return response.data;
    },
  });
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

// Create user mutation (Admin only)
export const useCreateUserByAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await createUserByAdmin(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user lists
      queryClient.invalidateQueries({ queryKey: userKeys.allUsers() });
      queryClient.invalidateQueries({ queryKey: userKeys.allUsersList({}) });
    },
  });
};

// Update user credentials mutation (Admin only)
export const useUpdateUserCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await updateUserCredentials(userId, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user lists and detail
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.allUsers() });
      queryClient.invalidateQueries({ queryKey: userKeys.allUsersList({}) });
    },
  });
};

// Toggle user status mutation (Admin only)
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      active,
    }: {
      userId: string;
      active: boolean;
    }) => {
      const response = await toggleUserStatus(userId, { active });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user lists and detail
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.allUsers() });
      queryClient.invalidateQueries({ queryKey: userKeys.allUsersList({}) });
    },
  });
};

// Update user profile mutation (name, email)
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Update user password mutation
export const useUpdatePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { currentPassword?: string; password: string; confirmPassword: string }) => {
      const response = await updatePassword(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
