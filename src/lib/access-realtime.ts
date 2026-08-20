import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const accessTopicPrefix = "br-access:";

type AccessRefreshScheduler = {
  schedule: () => void;
  dispose: () => void;
};

type SubscribeToAccessChangesInput = {
  supabase: SupabaseClient;
  userId: string;
  onChange: () => void;
  onStatus?: (status: string) => void;
};

export type FullPlaybackReconciliation = "keep" | "preview" | "stop";

export function isTransientAccessNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === "AuthRetryableFetchError") {
    return true;
  }

  return (
    (error.name === "TypeError" || error.name === "FetchError") &&
    /failed to fetch|fetch failed|network request failed|networkerror|load failed/i.test(
      error.message,
    )
  );
}

export async function reconcileAccessState<T>(
  load: () => Promise<T>,
  apply: (value: T) => void | Promise<void>,
) {
  try {
    const value = await load();
    await apply(value);
    return true;
  } catch (error) {
    if (isTransientAccessNetworkError(error)) {
      return false;
    }

    throw error;
  }
}

export function getAccessRealtimeTopic(userId: string) {
  return `${accessTopicPrefix}${userId}`;
}

export function isAccessRealtimeTopicForUser(
  topic: string,
  userId: string,
) {
  return Boolean(userId) && topic === getAccessRealtimeTopic(userId);
}

export function reconcileFullPlayback(input: {
  mode: "preview" | "full";
  isPublicFull: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  canPreview: boolean;
}): FullPlaybackReconciliation {
  if (
    input.mode !== "full" ||
    input.isPublicFull ||
    input.isAdmin ||
    input.hasAccess
  ) {
    return "keep";
  }

  return input.canPreview ? "preview" : "stop";
}

export function createAccessRefreshScheduler(
  refresh: () => void | Promise<void>,
  delayMs = 75,
): AccessRefreshScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let queued = false;
  let disposed = false;

  const run = async () => {
    timer = null;
    if (disposed) {
      return;
    }

    if (inFlight) {
      queued = true;
      return;
    }

    inFlight = true;
    try {
      await refresh();
    } catch (error) {
      if (!isTransientAccessNetworkError(error)) {
        throw error;
      }
    } finally {
      inFlight = false;
      if (queued && !disposed) {
        queued = false;
        schedule();
      }
    }
  };

  const schedule = () => {
    if (disposed) {
      return;
    }

    if (inFlight) {
      queued = true;
      return;
    }

    if (timer) {
      return;
    }

    timer = setTimeout(() => {
      void run();
    }, delayMs);
  };

  return {
    schedule,
    dispose: () => {
      disposed = true;
      queued = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

export async function subscribeToAccessChanges({
  supabase,
  userId,
  onChange,
  onStatus,
}: SubscribeToAccessChangesInput) {
  await supabase.realtime.setAuth();

  const channel: RealtimeChannel = supabase
    .channel(getAccessRealtimeTopic(userId), {
      config: { private: true },
    })
    .on("broadcast", { event: "INSERT" }, onChange)
    .on("broadcast", { event: "UPDATE" }, onChange)
    .on("broadcast", { event: "DELETE" }, onChange)
    .subscribe((status) => onStatus?.(status));

  return () => supabase.removeChannel(channel);
}
