import { PARTNER_ACTIVATION_CONTACT_URL } from "@/config/links";

export function SpotContactGuidance() {
  return <>
    A matching Partner ID is in the Spot config. {PARTNER_ACTIVATION_CONTACT_URL ? <>
      <a href={PARTNER_ACTIVATION_CONTACT_URL} target="_blank" rel="noopener noreferrer" className="text-(--link) underline underline-offset-2">Contact the team</a> to confirm it belongs to your setup.
    </> : "If you provided contact details, the team can follow up there to confirm it belongs to your setup."}
  </>;
}
