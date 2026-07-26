import { Client } from "@hubspot/api-client";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/contacts/models/Filter";

/**
 * HubSpot contact upsert, ported from contact-capture.php.
 *
 * Preserves the PHP's semantics deliberately, including the odd one: when no API
 * token is configured, `contactExists` returns TRUE so the create is skipped.
 * That makes an unconfigured environment a no-op instead of an error, which is
 * what the PHP relied on (the real token was commented out in config.php).
 */
function client(): Client | null {
  const token = process.env.HUBSPOT_API_TOKEN;
  if (!token) return null;
  return new Client({ accessToken: token });
}

export function hubspotConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_API_TOKEN);
}

async function contactExists(email: string): Promise<boolean> {
  const hubspot = client();
  if (!hubspot) return true; // no token => pretend it exists => skip create

  try {
    const res = await hubspot.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: FilterOperatorEnum.Eq,
              value: email,
            },
          ],
        },
      ],
      properties: ["email"],
      limit: 1,
    });
    return (res.total ?? 0) > 0;
  } catch (err) {
    // On an API error, assume it exists so we don't create duplicates.
    console.error("[hubspot] search failed:", err);
    return true;
  }
}

/**
 * Creates the contact if absent.
 *
 * Note the search-then-create is inherently racy: two simultaneous submissions
 * both see "absent" and both create. HubSpot dedupes on email at the object
 * level, so the loser gets a 409 which is swallowed below. Accepting the race is
 * cheaper than a distributed lock for this volume.
 *
 * Callers should invoke this via `after()` so it never blocks the response.
 */
export async function upsertContact(
  email: string,
  firstName?: string,
): Promise<void> {
  const hubspot = client();
  if (!hubspot) {
    console.warn("[hubspot] HUBSPOT_API_TOKEN not set; skipping", email);
    return;
  }

  if (await contactExists(email)) return;

  try {
    await hubspot.crm.contacts.basicApi.create({
      properties: {
        email,
        ...(firstName ? { firstname: firstName } : {}),
      },
      associations: [],
    });
  } catch (err) {
    console.error("[hubspot] create failed:", err);
  }
}
