import { generateAuthenticationOptions } from "@simplewebauthn/server";
import {
  getCredential,
  setAuthenticationChallenge,
} from "@/lib/card/webauthn-store";

export async function GET() {
  const credential = getCredential();

  if (!credential) {
    return Response.json(
      { error: "No credential registered" },
      { status: 409 }
    );
  }

  const rpID = process.env.BR_CARD_RP_ID || "localhost";

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: [
      {
        id: credential.id,
      },
    ],
    userVerification: "required",
  });

  setAuthenticationChallenge(options.challenge);

  return Response.json(options);
}
