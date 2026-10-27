import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { UploadFolder } from "@/lib/cloudinary"

/**
 * Uploads one image and resolves to its hosted URL.
 *
 * `folder` decides where it is filed in Cloudinary and defaults to
 * `hairstyles`, which is where the customer booking flow has always put its
 * reference photos. The dashboard passes `services` or `stylists` so the
 * salon's own pictures do not end up mixed in with them.
 */
export function useUploadImage(folder?: UploadFolder) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      if (folder) formData.append("folder", folder)
      const { data } = await apiClient.post<{ url: string }>("/upload", formData)
      return data.url
    },
  })
}
