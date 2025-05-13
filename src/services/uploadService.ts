
export const uploadFile = async (file: File): Promise<{ success: boolean; public_url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const apiUrl = import.meta.env.VITE_API_URL ?? "http://176.119.254.185:8000/api/upload";

  const res = await fetch(apiUrl, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `Upload failed: ${res.statusText}`);
  }

  return res.json();
}; 
