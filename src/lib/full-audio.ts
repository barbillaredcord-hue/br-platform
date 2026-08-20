export const FULL_AUDIO_BUCKET = "beat-full";
export const FULL_AUDIO_URL_TTL_SECONDS = 60;

export type StorageObjectLocation = {
  bucket: string;
  path: string;
};

export function toStorageObjectReference(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

export function getStorageObjectLocation(value: string): StorageObjectLocation | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("storage://")) {
    const [bucket, ...parts] = value.slice("storage://".length).split("/");
    const path = parts.join("/");
    return bucket && path ? { bucket, path } : null;
  }

  try {
    const url = new URL(value);
    const marker = ["/storage/v1/object/public/", "/storage/v1/object/sign/", "/storage/v1/object/authenticated/"]
      .find((item) => url.pathname.startsWith(item));

    if (!marker) {
      return null;
    }

    const [bucket, ...parts] = url.pathname.slice(marker.length).split("/");
    const path = parts.join("/");
    return bucket && path ? { bucket, path } : null;
  } catch {
    return null;
  }
}
