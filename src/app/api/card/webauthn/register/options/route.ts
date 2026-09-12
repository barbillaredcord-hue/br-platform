import { generateRegistrationOptions } from "@simplewebauthn/server";
import { setRegistrationChallenge } from "@/lib/card/webauthn-store";

export async function GET() {
  const rpID = process.env.BR_CARD_RP_ID || "localhost";
  const rpName = "BR Studios";
  const userID = new TextEncoder().encode("br-card-admin-this-mac");

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "BR Card Admin",
    userID,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  });

  setRegistrationChallenge(options.challenge);

  return Response.json(options);
}
