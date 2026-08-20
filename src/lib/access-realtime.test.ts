import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { createAccessRefreshScheduler, getAccessRealtimeTopic, isAccessRealtimeTopicForUser, reconcileAccessState, reconcileFullPlayback } from "./access-realtime.ts";

const userId = "11111111-1111-4111-8111-111111111111";

test("el canal queda aislado por usuario", () => {
  const topic = getAccessRealtimeTopic(userId);

  assert.equal(topic, `br-access:${userId}`);
  assert.equal(isAccessRealtimeTopicForUser(topic, userId), true);
  assert.equal(
    isAccessRealtimeTopicForUser(
      topic,
      "22222222-2222-4222-8222-222222222222",
    ),
    false,
  );
});

test("coalesce eventos cercanos y cleanup cancela pendientes", async () => {
  let refreshCount = 0;
  const scheduler = createAccessRefreshScheduler(() => {
    refreshCount += 1;
  }, 10);

  scheduler.schedule();
  scheduler.schedule();
  scheduler.schedule();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(refreshCount, 1);

  scheduler.schedule();
  scheduler.dispose();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(refreshCount, 1);
});

test("conserva el estado si getUser falla y reconcilia después", async () => {
  let available = false;
  let currentState = "estado previo";
  const auth = {
    getUser: async () => {
      if (!available) {
        throw new TypeError("Failed to fetch");
      }
      return "estado actualizado";
    },
  };
  const refresh = async () => {
    await reconcileAccessState(
      () => auth.getUser(),
      (nextState) => {
        currentState = nextState;
      },
    );
  };
  const scheduler = createAccessRefreshScheduler(refresh, 5);

  scheduler.schedule();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(currentState, "estado previo");

  available = true;
  scheduler.schedule();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(currentState, "estado actualizado");
  scheduler.dispose();
});

test("Player abandona full privado al perder acceso", () => {
  assert.equal(
    reconcileFullPlayback({
      mode: "full",
      isPublicFull: false,
      isAdmin: false,
      hasAccess: false,
      canPreview: true,
    }),
    "preview",
  );

  assert.equal(
    reconcileFullPlayback({
      mode: "full",
      isPublicFull: false,
      isAdmin: false,
      hasAccess: false,
      canPreview: false,
    }),
    "stop",
  );
});

test("Player conserva full público, admin o acceso vigente", () => {
  for (const input of [
    { isPublicFull: true, isAdmin: false, hasAccess: false },
    { isPublicFull: false, isAdmin: true, hasAccess: false },
    { isPublicFull: false, isAdmin: false, hasAccess: true },
  ]) {
    assert.equal(
      reconcileFullPlayback({
        mode: "full",
        canPreview: true,
        ...input,
      }),
      "keep",
    );
  }
});
