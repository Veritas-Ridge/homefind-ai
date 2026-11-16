# Follow Up Boss API: Expert Guide for HomeFind AI

Source: every page of https://docs.followupboss.com (193 pages, pulled 2026-11-16 via `llms.txt`).
Full endpoint by endpoint detail (every param, body field, enum, example) lives in `api-reference-full.md` next to this file.

---

## 1. The essentials

* **Base URL:** `https://api.followupboss.com/v1` (HTTPS only, v1 is the only version)
* **Format:** JSON in, JSON out. Dates are ISO 8601, always UTC.
* **Two auth modes (never mix them up):**
  * API key: HTTP **Basic**, key as username, blank password. `Authorization: Basic base64("<key>:")`
  * OAuth: HTTP **Bearer** with an access token.
* **System headers on every request:** `X-System: <name>` and `X-System-Key: <key>` from https://apps.followupboss.com/system-registration.
  * The API key says *which user/account*. The system headers say *which app is calling*.
  * Without a valid system key: half the rate limit, and several endpoints refuse you outright.
* **Key = user permissions.** An agent key only sees that agent's contacts. Use the **owner** key for full access, webhooks, and account settings.
* **Roles:** Owner (everything) › Admin/Broker (everything but webhooks) › Agent (own + collaborator contacts) › Lender (even less).
* **Expired accounts:** key still works, `POST /events` still accepted, most other calls return 403.

## 2. The golden rule: send leads through `POST /events`

`POST /people` only creates a record. `POST /events` is what makes FUB *act*:

* Dedupes by email/phone and updates the existing contact
* Routes to the right agent per Lead Flow (round robin, first to claim, ponds)
* Notifies the agent by email/text
* Starts action plans and automations
* Logs the activity on the timeline and dashboard

**Event types:** `Registration`, `Inquiry`, `Seller Inquiry`, `Property Inquiry`, `General Inquiry`, `Viewed Property`, `Saved Property`, `Visited Website`, `Incoming Call`, `Unsubscribed`, `Property Search`, `Saved Property Search`, `Visited Open House`, `Viewed Page`

* `Inquiry` auto converts to `Property Inquiry` (when `property` is present) or `General Inquiry`.
* **Action plans fire only on:** Registration, Seller Inquiry, Property Inquiry, General Inquiry, Visited Open House.
* **Automations 2.0 fire only on:** Registration, Property Inquiry, Seller Inquiry, General Inquiry.
* Viewed/Saved Property, Searches, Viewed Page = timeline intel only (no automation).

**Response codes:**

* `201`: new person created
* `200`: existing person updated
* `204`: accepted but ignored (that source's lead flow is archived)
* `404`: you passed `person.id` and it doesn't exist

**The response body is the person, not the event.** You get the FUB person `id` right there.

**Body cheat sheet:**

* `source` (brand, e.g. domain without www), `system` (your software), `type`, `message`, `description`
* `person`: `id`, `firstName`, `lastName`, `stage`, `source`, `sourceUrl`, `contacted`, `price`, `assignedTo` / `assignedUserId`, `assignedLenderName` / `assignedLenderId`, `emails[]`, `phones[]`, `addresses[]`, `tags[]`, any `customXxx` field
* `property`: `street`, `city`, `state`, `code`, `mlsNumber`, `price`, `forRent`, `url`, `type`, `bedrooms`, `bathrooms`, `area`, `lot`
* `propertySearch`: `type`, `neighborhood`, `city`, `state`, `code` (string or array of zips), `min/maxPrice`, `min/maxBedrooms`, `min/maxBathrooms`
* `campaign`: `source` (required), `medium`, `term`, `content`, `campaign`. **Needed for leads to show in FUB marketing reports.**
* `pageTitle`, `pageUrl`, `pageReferrer`, `pageDuration`: for `Viewed Page`
* `occurredAt`: anything older than 1 day counts as **historical** and triggers no workflows (great for backfills)

## 3. Every resource at a glance

| Area | Endpoints | Notes |
| :--- | :--- | :--- |
| **Events** | `GET/POST /events`, `GET /events/:id` | GET filters: `personId`, `type`, `hasProperty`, `propertyAddress`. GET limit is only 20 req/10s. |
| **People** | `GET/POST /people`, `GET/PUT/DELETE /people/:id` | See §4 |
| | `GET /people/checkDuplicate?email=&phone=` | Works even for contacts your key can't see. Returns `found`, `matchedBy`, `assignedTo`. |
| | `GET /people/unclaimed`, `POST /people/claim`, `POST /people/ignoreUnclaimed` | First to Claim flow. Claim returns 409 if someone beat you. |
| **Relationships** | `/peopleRelationships` CRUD | Spouse etc. Or just add `relationships` to `fields` on `/people`. |
| **Attachments** | `/personAttachments` CRUD | Registered systems only. Links to externally hosted files only. |
| **Notes** | `POST /notes`, `GET/PUT/DELETE /notes/:id` | `isHtml` supported. GET supports `includeThreadedReplies`, `includeReactions`. **10 req/10s.** |
| **Calls** | `GET/POST /calls`, `GET/PUT /calls/:id` | Log external calls: `outcome` = Interested, Not Interested, Left Message, No Answer, Busy, Bad Number. |
| **Texts** | `GET/POST /textMessages`, `GET /textMessages/:id` | POST only *logs* a text (sends nothing). Registered systems only. Content often hidden for privacy. |
| **Emails (marketing)** | `/emCampaigns` (GET/POST/PUT), `/emEvents` (GET/POST) | Log blasts + delivered/open/click/bounce/unsubscribe/spamreport/dropped. Up to 1000 events per POST. |
| **Tasks** | `/tasks` CRUD | Types: Follow Up, Call, Text, Email, Appointment, Showing, Closing, Open House, Thank You. Supports `dueDateTime` + `remindSecondsBefore`. |
| **Appointments** | `/appointments` CRUD, `/appointmentTypes`, `/appointmentOutcomes` | `sendInvitation=true` emails invitees. Calendar sync only if a synced FUB user is an invitee. |
| **Deals** | `/deals` CRUD, `/dealAttachments`, `/dealCustomFields` | Price, commission splits, key dates (earnest money, due diligence, walkthrough, possession). Empty `userIds` hides the deal from agents. |
| **Pipelines** | `/pipelines` CRUD | Stages nested inside. Stage objects without `id` get created as new. |
| **Stages** (contact) | `/stages` CRUD | Protected stages can't be renamed/deleted. Delete requires `assignStageId`. |
| **Custom fields** | `/customFields` CRUD | Types: text, date, number, dropdown. API name = `custom` + PascalCase label (e.g. `customCloseDate`). **Case sensitive.** Owner only to edit. |
| **Smart Lists** | `GET /smartLists`, `/smartLists/:id` | Pass `all=true` or `fub2=true` or you only get classic lists. Then `GET /people?smartListId=` |
| **Action Plans** | `GET /actionPlans`, `/actionPlansPeople` (GET/POST/PUT) | Apply/pause plans per person. Slated for deprecation (Automations 2.0). |
| **Automations 2.0** | `GET /automations(/:id)`, `/automationsPeople` (GET/POST/PUT) | Manually trigger an automation for a person, pause/resume. Registered systems only. |
| **Templates** | `/templates` CRUD + `POST /templates/merge`, `/textMessageTemplates` CRUD + merge | `GET /templates/:id?mergePersonId=` returns a fully merged email. |
| **Users** | `GET /users`, `GET/DELETE /users/:id`, `GET /me`, `GET /identity` | `fields=calling` for phone setup. `role` is Agent, Broker, or Lender (`isOwner` distinguishes owner). |
| **Routing** | `/groups` CRUD + `/groups/roundRobin`, `/ponds` CRUD, `/teams` CRUD, `GET /teamInboxes` | Groups = round robin or first to claim (claim window 1 to 30 min). |
| **Timeframes** | `GET /timeframes` | 0 to 3 months, etc. Set on person via `timeframeId`. |
| **Webhooks** | `/webhooks` CRUD, `GET /webhookEvents/:id` | See §6 |
| **Reactions / Threaded Replies** | `/reactions/...`, `GET /threadedReplies/:id` | Beta. Emoji reactions and replies on notes. |
| **Rate limit** | `GET /rateLimit/usage`, `GET /rateLimit/limits` | Registered systems: 24h usage, peak hour, current ceilings. |
| **Inbox Apps** | `/inboxApps/...` | Partner only. Plug a messaging channel into the FUB inbox (see §8). |
| **OAuth apps** | `POST/PUT /oauthApps`, `DELETE /oauthApps/revokeAccess` | See §7 |

## 4. People: the details that bite

* **`GET /people` hides fields by default.** Use `fields=` (e.g. `id,name,emails,stage,customBudget`). `allFields` for dev only, `allCustom` for all custom fields. Add `relationships` to include spouse etc.
* **Trash is excluded** unless `includeTrash=true`. Unclaimed excluded unless `includeUnclaimed=true`.
* **Rich filters:** `email`, `phone`, `name` (fuzzy), `stage`, `source`, `assignedUserId`, `assignedPondId`, `contacted`, `priceAbove/Below`, `tags` (OR), `smartListId`, `lastActivityAfter/Before`, any `customXxx`.
  * Date custom fields: `YYYY-MM-DD` (on/after), `,YYYY-MM-DD` (on/before), `A,B` (range).
* **Sort by engagement:** `lastActivity`, `lastCommunication`, `lastLeadActivity`, `lastIdxVisit`, `propertiesViewed`, `propertiesSaved`, `pagesViewed`, `textsReceived`, `callsDuration`, `nextTask`, custom fields, and more. Prefix `-` for descending.
* **Buyer vs seller:** sellers carry a `Seller` tag. No tag means buyer.
* **`PUT /people/:id` gotchas:**
  * `tags` **overwrites** all tags unless `?mergeTags=true`
  * `phones` and `emails` **overwrite** the whole list (send the full set)
  * `contacted: true` **pauses action plans**
  * Set a custom field to `null` to clear it
  * `source` / `sourceUrl` can only be set at creation
  * PUT on people is limited to **25 req/10s**
* **`POST /people?deduplicate=true`** returns the existing match (200) instead of creating a duplicate.
* **New person lag:** right after creation, a person may not be reachable by other endpoints until lead routing assigns them. Notes/tasks fired instantly can fail. Add a short delay or retry.

## 5. Paging, filtering, limits, errors

* **Paging:** `limit` (max 100, default 10). Default order is newest id first. **Use `next` / `_metadata.nextLink`**, not `offset`; deep offsets get rejected.
* **Universal filters:** `ids=1,2,3`, `idGreaterThan/idLessThan`, `createdAfter/Before`, `updatedAfter/Before`, `sort=-field`, `fields=`.
  * Note: a person's `updated` doesn't change when a note/call/text is added (those are separate records).
* **Rate limits** (sliding 10 second window, per context):

| Context | Registered | Unregistered |
| :--- | :--- | :--- |
| `POST /events` | unlimited | unlimited |
| `GET /events` | 20 | 10 |
| global (everything else) | 250 | 125 |
| `PUT /people` | 25 | 25 |
| `/notes` | 10 | 10 |

* Watch headers `X-RateLimit-Limit/Remaining/Window/Context`. On 429, obey `Retry-After` (seconds), even if Remaining > 0.
* **Errors:** 400 (bad request, JSON `errorMessage`), 403 (no access / expired account), 404, 429, 5xx. Retry 5xx and 429 with truncated exponential backoff plus jitter (cap 32 to 64s).

## 6. Webhooks (stop polling)

* **Owner key + registered system required.** Max **2 webhooks per event per system**. HTTPS URLs only.
* **Payload is a pointer, not data:** `{eventId, eventCreated, event, resourceIds[], uri, data?}`. You GET the `uri` to fetch the changes.
* **Events:**
  * People: `peopleCreated`, `peopleUpdated`, `peopleDeleted`, `peopleTagsCreated` (includes tag names), `peopleStageUpdated` (includes stage name), `peopleRelationshipCreated/Updated/Deleted`
  * Activity: `notes*`, `emails*`, `textMessages*`, `calls*`, `tasks*`, `appointments*` (FUB created only), `eventsCreated`
  * Marketing: `emEventsOpened`, `emEventsClicked`, `emEventsUnsubscribed`
  * Deals and config: `deals*`, `pipeline*`, `pipelineStage*`, `stage*` (stage *definitions*, not a lead's stage), `customFields*`, `dealCustomFields*`
  * Beta: `reactionCreated/Deleted`, `threadedReply*`
* `peopleUpdated` fires on name, emails, phones, address, price, background, agent, lender, contacted, stage, source, tags, custom fields, relationships. Fetch with `fields=allFields` to see custom fields.
* **Respond 2xx within 10 seconds.** Otherwise retries at +1, +5, +5, +10, +30 min (keeps trying up to 8 hours).
* **Verify:** header `FUB-Signature` = `HMAC_SHA256(key = X-System-Key, msg = base64(rawBody))`, hex.
* Return `406` or `410` to have FUB auto delete a webhook. FUB auto disables webhooks failing >50% over 48h that don't recover within a week.
* Missed something? `GET /webhookEvents/:id` replays an event.
* Best practice: receiver just stores the event row; a separate worker fetches and reconciles.

## 7. OAuth (only if we ever serve multiple brokerages)

* Create client: `POST /v1/oauthApps` with system headers and `redirectUris` (no localhost). `clientSecret` shown once.
* Consent: `GET https://app.followupboss.com/oauth/authorize?response_type=auth_code&client_id=…&redirect_uri=…&state=…`
* Exchange: `POST https://app.followupboss.com/oauth/token` (Basic client_id:secret, form encoded, `grant_type=authorization_code`)
* Lifetimes: auth code 15 min single use, access token 60 min, refresh token lives forever unless unused for 90 days.
* Call API with `Authorization: Bearer <token>`. Revoke with `DELETE /v1/oauthApps/revokeAccess`.

## 8. Embedded Apps and Inbox Apps

* **Embedded App:** our HTTPS page loads in an iframe on the FUB contact screen.
  * FUB passes `context` (base64 JSON: account, user, person with emails/phones/stage) and `signature` = `hex(HMAC_SHA256(secret, context))`.
  * Include `https://eia.followupboss.com/embeddedApps-v1.0.0.js`, drop `X-Frame-Options`.
  * Must handle debug states: working, account_not_found, user_not_found, person_not_found, unauthorized.
  * Requires approval (embedded-app-approval@followupboss.com).
* **Inbox Apps:** put a chat channel (like our AI chat) inside the FUB inbox as a real conversation, with agent replies coming back by webhook (`inboxAppReply`). Partner program only (api@followupboss.com).

## 9. Merge fields

* Contact: `%contact_name%`, `%contact_first_name%`, `%contact_last_name%`, `%contact_email%`, `%contact_phone%`, `%contact_address%`, `%contact_street%`, `%contact_city%`, `%contact_state%`, `%contact_zipcode%`, `%contact_country%`, `%contact_rels_first_name%`
* Agent: `%agent_name%`, `%agent_first_name%`, `%agent_last_name%`, `%agent_email%`, `%agent_phone%`
* Other: `%inquiry_address%`, `%source_name%`, `%greeting_time%`, `%lender_first_name%`

## 10. Terms of use worth remembering

* Must register the system and send `X-System-Key` on every call.
* Don't keep FUB data longer than the integration needs.
* **No use of FUB data for AI/ML model training**, research, or product development (§2.l). Using it to serve the customer in real time is fine.
* Don't expose the API key in the browser.

---

## 11. Audit of HomeFind AI's current FUB integration

**What we do well**

* Outbox pattern (`fub_events` table + `processFubEvents`) with backoff: exactly what FUB recommends.
* All lead activity goes through `POST /events`, never `POST /people`.
* Treats 200, 201, and 204 as final; retries 429 and 5xx.

**Gaps and fixes (ranked)**

1. **System key looks like a placeholder.** `_shared/fub.ts` falls back to `X-System-Key: crandell-real-estate` and `postDailyActivitySummary` hardcodes it. Real keys come from system registration. With an invalid key we get half the rate limit and can't use webhooks, text logging, attachments, Automations 2.0, or rate limit monitoring. Confirm `FUB_SYSTEM` / `FUB_SYSTEM_KEY` secrets are set to real registered values and remove the hardcoded copy.
2. **Extra lookup after every event.** `lookupPersonId` calls `GET /people?email=` after sending. The `POST /events` response already *is* the person, so read `id` from it. Saves a call and avoids the new person lag (§4) where the lookup can come back empty.
3. **Send `person.id` once we know it.** When `profiles.fub_contact_id` exists, include it so FUB matches directly instead of by email.
4. **Contact sync is effectively a stub.** `syncFollowUpBossContacts` reads one page of 100, uses a nonexistent `order=desc` param (FUB uses `sort=-created`), omits system headers, and stores only a count. `syncToFollowUpBoss` is an unimplemented scaffold.
5. **No webhooks.** We never hear back from FUB. Subscribing to `peopleUpdated`, `peopleStageUpdated`, `peopleTagsCreated`, `peopleDeleted` would keep agent assignment, stage, and tags in sync in our DB (and let the AI chat know who the buyer's agent is).
6. **Daily summary notes ignore the notes limit.** The bulk loop posts notes back to back; the notes context allows 10 per 10s. A 429 is logged as done and the summary is lost. Throttle and retry on 429.
7. **No UTM capture.** We never send the `campaign` object, so FUB's marketing/source reports can't attribute HomeFind leads to ads or channels.

**Status (branch `claude/sleepy-wright-ujdbh2`)**

* Fixed 1 to 7 above. All FUB calls now go through `fubFetch` in `_shared/fub.ts` (system headers, 429 `Retry-After`, 5xx backoff, notes spacing).
* Webhooks: `fubWebhook` (receiver, verifies `FUB-Signature`), `processFubWebhooks` (cron worker), `fubWebhooks` (status / register / unregister). Data lands in `fub_contacts` (per app user: agent, stage, tags, contacted) and `fub_users` (agents).
* Attribution uses the `profiles.attribution` approach from `claude/awesome-gauss-shvn6b`, sent as the FUB `campaign` block.
* Needed in Supabase secrets: `FOLLOW_UP_BOSS_API_KEY` (account **owner** key), `FUB_SYSTEM`, `FUB_SYSTEM_KEY` (from system registration). The admin dashboard's "Follow Up Boss Webhooks" card shows what's missing.

**Biggest leverage opportunities**

* **`Viewed Page` + `campaign` data:** full website journey and ad attribution in FUB.
* **Webhooks to mirror agent assignment and stage** in Supabase so the app can personalize ("Your agent Jane…").
* **Create tasks for agents** (`POST /tasks` with `dueDateTime` + reminder) on hot lead signals instead of only notes.
* **Custom fields** (e.g. `customHomeFindBudget`, `customHomeFindLastSearch`, `customAIChatSummary`) so agents can filter and build Smart Lists on our data.
* **Deals:** auto create a deal in a buyer pipeline when a tour request comes in.
* **Automations 2.0 trigger** (`POST /automationsPeople`) to kick off a specific drip when someone saves a search.
* **Log our saved search alert emails** as `emCampaigns` + `emEvents` so opens and clicks show on the FUB timeline.
* **Embedded App:** a HomeFind panel inside FUB showing a contact's saved homes, searches, and AI chat history.
