

=================== https://docs.followupboss.com/docs/email-marketing-integration-guide.md

# Email Marketing Integration Guide

How to integrate your email marketing system with Follow Up Boss

\##When user creates a new email to send

Make this API call when user creates a new email in your system. This can be a one-off email blast or automated drip email.

```
POST https://api.followupboss.com/v1/emCampaigns
{
    "origin": "Curaytor",
    "originId": "912",
    "name": "Can I help",
    "subject": "Can I help?",
    "bodyHtml": "I saw you're browsing our website, can I help with..."
}
```

Set `origin` field with the name of your email system and `originId` with your internal ID assigned to the new email.

You will get a response that looks like this:

```
201 OK
{
    "id": 102,
    "origin": "Curaytor",
    "originId": "912",
    "name": "Can I help",
    "subject": "Can I help?",
    "bodyHtml": "I saw you're browsing our website, can I help with..."
}
```

`id` field in the response is Follow Up Boss ID of the campaign. **This value is important**, save it in your system as you will need it later to update Follow Up Boss on emails sent, opens, clicks, etc.

You can use merge fields in the `subject` and `bodyHtml`:

%contact\_name% - full name of the recipient
%contact\_first\_name% - first name of the recipient
%contact\_last\_name% - last name of the recipient
%contact\_email% - email address of the recipient
%contact\_phone% - phone number of the recipient
%contact\_address% - full address of the recipient
%contact\_street% - street address of the recipient
%contact\_city% - city of the recipient
%contact\_state% - state of the recipient
%contact\_zipcode% - zip code of the recipient
%contact\_country% - country of the recipient
%agent\_name% - full name of the sender (user in FUB)
%agent\_first\_name% - first name of the sender (user in FUB)
%agent\_last\_name% - last name of the sender (user in FUB)
%agent\_email% - email address of the sender (user in FUB)
%agent\_phone% - phone number of the sender (user in FUB)
%inquiry\_address% - address of the last property the recipient inquired about
%source\_name% - lead source name of the recipient

Those merge fields will be replaced with their actual values when email is displayed in Follow Up Boss. If your system uses different convention for naming merge fields, replace them to match the fields listed above.

After you created an email marketing campaign it won't be visible in the Follow Up Boss UI yet until you start sending email marketing events for that campaign (see below).

\##When user edits an email in your system

Use this endpoint to update Follow Up Boss when a user edits marketing email in your system, for example changes email subject or body. This is more relevant for automated drip emails but may be applicable to one-off email blasts too when user saves email as a draft and later edits it before sending out.

```
PUT https://api.followupboss.com/v1/emCampaigns/:id
{
    "name": "How can I help",
    "subject": "How can I help?",
    "bodyHtml": "I saw you're browsing our website, how can I help with..."
}
```

`:id` parameter is the value of `id` field you received in the response when creating that email marketing campaign with `POST /emCampaigns`.

\##When your system sends out email to recipients

Notify Follow Up Boss about marketing emails sent out by marking this API request:

```
POST https://api.followupboss.com/v1/emEvents
{"emEvents": [
    {
        "type": "delivered",
        "occurred": "2017-04-09T16:10:59Z",
        "recipient": "john.smith@gmail.com",
        "campaignId": 102,
        "userId": 3
    },
    {
        "type": "delivered",
        "occurred": "2017-04-09T16:11:00Z",
        "recipient": "mary.anderson@gmail.com",
        "campaignId": 102,
        "userId": 3
    },
    ...
]}
```

`campaignId` field contains `id` value you received in the response when creating that email marketing campaign with `POST /emCampaigns`.

`userId` is an optional field that allows you to specify the ID of the user in Follow Up Boss that email was sent from. This is useful to display email correctly in Follow Up Boss including replacing merge fields with correct user name, email, etc. This field is optional and defaults to the current authenticated user (the user whose API key is being used to authenticate API request).

This endpoint allows sending multiple events in a batch request, you can send up to 100 events per API request. When sending an email to a large number of recipients, we recommend breaking down the list of recipients into batches of 100 and send each batch in a separate POST request.

Marketing emails will be visible in Follow Up Boss under Timeline on the Person screen:


\##When your system detects clicks, opens, unsubscribes, etc.

Notify Follow Up Boss about events related to marketing emails sent out such as opens, clicks, unsubscribes, bounces and spam reports.

```
POST https://api.followupboss.com/v1/emEvents
{"emEvents": [
    {
        "type": "open",
        "occurred": "2017-04-09T16:10:59Z",
        "recipient": "john.smith@gmail.com",
        "campaignId": 102
    },
    {
        "type": "click",
        "occurred": "2017-04-09T16:11:00Z",
        "recipient": "mary.anderson@gmail.com",
        "campaignId": 102,
        "url": "https://google.com"
    },
    ...
]}
```

`campaignId` field contains `id` value you received in the response when creating that email marketing campaign with `POST /emCampaigns`.

`type` field can be one of the following values:

`delivered` - Email was sent out to a recipient.
`open` - Recipient opened the email.
`click` - Recipient clicked on a link in the email.
`bounced` - Email bounced, it means recipient's email server rejected the email. This is a generic bounce event, use it if your system doesn't distinguish between soft and hard bounces.
`soft-bounce` - Email bounced temporarily.
`hard-bounce` - Email bounced permanently.
`unsubscribe` - Recipient unsubscribed from further emails.
`spamreport` - Recipient reported email as spam.
`dropped` - Sending email wasn't attempted because of the previous history with recipient (bounced, unsubscribed, etc).

You can batch your events and send up to 1000 events in one API request.

Opens, clicks will be visible in Follow Up Boss next to the marketing email under timeline on the Person screen:


\##Getting people from Follow Up Boss

Once user enables integration in your system you can pull existing people from Follow Up Boss into your application with `GET https://api.followupboss.com/v1/people`. To sync new and updated people we recommend using [webhooks](https://docs.followupboss.com/reference#webhooks-2).

=================== https://docs.followupboss.com/docs/getting-started-with-oauth.md

# Getting Started

Follow Up Boss APIs support the [OAuth 2.0 protocol](https://www.rfc-editor.org/rfc/rfc6749). Integration Partners can create an OAuth Client Application to securely obtain authorization consent and perform delegated actions on behalf of a FUB user.

## Prerequisites

You will need a few items before creating an OAuth Client App.

1. **Registered System:** FUB requires API clients to register their system for source attribution. Therefore, OAuth Client Apps are associated with Registered Systems to extend this source attribution functionality. If you don't already have a Registered System, you can [create one here](https://apps.followupboss.com/system-registration).
2. **Redirect URI(s):** FUB uses the [OAuth 2.0 Authorization Code Grant Flow](https://www.rfc-editor.org/rfc/rfc6749#section-4.1) to issue access tokens. After obtaining user consent, we create an authorization code and forward it to one of a given set of redirect URIs. These redirect URIs *MUST BE* publicly accessible and accept `HTTP GET` requests.

## Creating an OAuth Client App

Once you've registered your system, you can then make a request to create a new OAuth Client App. Simply use the `POST` method and provide your `X-System` and `X-System-Key` in the request header. In the request body, provide your `redirectUris`(as an array). A new OAuth Client will be created for you.

```curl
curl --location --request POST 'https://api.followupboss.com/v1/oauthApps' \
--header 'x-System: <your-registed-x-system-name>' \
--header 'X-System-Key: <your-registered-x-system-key>' \
--header 'Content-Type: application/json' \
--data '{
    "redirectUris": ["http://www.yoursite.com/oauth/redirect"],
}'
```

Example output from the request

```json
{
    "id": 12,
    "name": "Test OAuth Client",
    "redirectUris": [
        "http://www.yoursite.com/oauth/redirect"
    ],
    "clientId": "<REDACTED>",
    "clientSecret": "<REDACTED>",
    "status": 1,
    "createdAt": "2025-01-27T24:59:59Z",
    "updatedAt": "2025-01-27T24:59:59Z"
}
```

> ❗️ Store Credentials Securely
>
> The `clientSecret` field, which is required to use an OAuth Client App, is only returned by the API when the application is initially created. It is not accessible in responses to other requests nor by support representatives after that point. Be sure to store it safely and securely.

> ❗️ Localhost Redirects Not Allowed
>
> Because OAuth requires our systems to be able to access your redirect URI(s) as noted above, you will not be able to use localhost-based addresses for a redirect URI. If this is required for your development purposes, we recommend searching for a public-facing service that will allow for a redirect to your local machine.

<br />

## Updating an OAuth Client App

Once you've created your OAuth Client, you can updated the `redirectUris` when you need to by using the `PUT` method with your `X-System` and `X-System-Key` in the request header. The same rules for not allowing `localhost` as a redirect apply as well.

```curl
curl --location --request PUT 'https://api.followupboss.com/v1/oauthApps' \
--header 'x-system: <your-registed-x-system-name>' \
--header 'X-System-Key: <your-registered-x-system-key>' \
--header 'Content-Type: application/json' \
--data '{
    "redirectUris": ["https://www.reddit.com", "https://www.google.com"]
}'
```

Example output from the request

```json
{
    "clientId": "efa7d5c9e49ea983046f0768562ef849bea2298f176a564462c5849c04ace35f",
    "redirectUris": [
        "https://www.reddit.com",
        "https://www.google.com"
    ]
}
```

=================== https://docs.followupboss.com/docs/inbox-apps-attachments.md

# Attachments

> 📘 **Attachment support is optional.**
>
> Attachments are an optional feature and disabled by default. Please let us know at <api@followupboss.com> if you would like attachment support enabled for your Inbox App.

Inbox Apps have the ability to send and receive attachments. Partners can utilize the Inbox App API to include attachments which are visible in the FUB Inbox and lead timeline.

## Supported attachments

Attachment support is currently limited to the following MIME Types. Additional MIME Types may be supported in the future based on customer and partner feedback.

* `image/png`
* `image/jpg`
* `image/jpeg`
* `image/gif`
* `application/pdf`

## Including attachments with a message

To include an attachment with a message you are sending to Follow Up Boss, include the `attachments` object in your [add message request](https://docs.followupboss.com/reference/inbox-apps-add-message) with the filename and fully qualified URL where the attachment can be accessed.

### Durability

Follow Up Boss will download and re-host attachments in perpetuity, requiring only a short TTL (we recommend 20 minutes) for the URL provided by you.

## Receiving attachments from Follow Up Boss

When attachments are enabled for your Inbox App and a user sends an attachment from Follow Up Boss, we will include an `attachments` object in the `inboxAppReply` webhook payload. This payload includes the filename, a signed URL with a 20 minute TTL, and a mime type.

See [Inbox App Webhooks](https://docs.followupboss.com/docs/inbox-apps-webhooks) for more information.

=================== https://docs.followupboss.com/docs/inbox-apps-conversation-lifecycle.md

# Conversation Lifecycle

## Creating a conversation

An Inbox App conversation is created in Follow Up Boss when you send a message to the [Create Message API endpoint](https://docs.followupboss.com/reference/inbox-apps-add-message) with a new `externalConversationId`. The External Conversation ID is a unique ID generated by you per-conversation and used to link messages together within the same conversation.

### Choosing the right inbox

> 📘 **Ownership can only be set for new conversations.**
>
> Once a conversation is created it's ownership can not be changed and any subsequent messages including an `owner` object will be rejected.

Depending on the scope of your Inbox App installation, conversations can be added to a specific user's inbox (in the case of a user scoped installation) or to any user or Team Inbox (in the case of an account scoped installation.) Once a conversation is created in an inbox, only assignment of that conversation can be changed - not ownership.

You will specify the owning inbox of the conversation using the `owner` object when sending the first message in a new conversation. You can use [`GET /users`](https://docs.followupboss.com/reference/users-get) and [`GET /teamInboxes`](https://docs.followupboss.com/reference/teaminboxes) to determine available user and Team Inboxes to create conversations in.

### Specifying the person (lead)

When you create a new conversation you are required to specify the `person` on the other end of the conversation. If known, this can be a FUB Person ID. If unknown, this can be any combination of name, email, or phone.

If a Person ID is not provided, we will always attempt to match the provided information to a known lead in FUB so it is considered best practice to provide as much information as possible.

#### Updating the person

> 📘 **Persons matched to a lead in Follow Up Boss become immutable.**
>
> Once a person has been matched to a lead in Follow Up Boss, it becomes immutable and any subsequent updates including the `person` object will be rejected.

If your application learns more information about a person - for example if you started the conversation only knowing their email and later learned their name, you can [update the conversation](https://docs.followupboss.com/reference/inbox-apps-update-conversation) with a new `person` object.

### Adding the message

The new conversation is started by adding a message with a new `externalConversationId`. Below is a minimal new message example, see the [add message documentation](https://docs.followupboss.com/reference/inbox-apps-add-message) for a full list of available fields.

```json
{
  "externalConversationId": "",
  "externalMessageId": "",
  "message": "An example message.",
  "isIncoming": true,
  "sender": {
    "personId": 123,
  },
  "person": {
    "id": 123,
  },
  "owner": {
    "userId": 1
  }
}
```

## Updating a message

Outgoing messages (messages with a `false` `isIncoming` value) can be updated with a delivery status and, in the case of delivery failures, an error message. See the [Delivery Status guide](https://docs.followupboss.com/docs/inbox-apps-delivery-status) for more information.

## Updating a conversation

Conversations can be updated using the [Update Conversation API endpoint](https://docs.followupboss.com/reference/inbox-apps-update-conversation) to perform the following actions:

* Change the subject of the conversation.
* Archiving or unarchiving the conversation.
* Assigning or un-assigning the conversation.
* Updating the associated person (until a valid Person ID is associated, after which is becomes immutable.)

## Receiving replies from Follow Up Boss

Users can reply to Inbox App conversations directly from Follow Up Boss. When this happens, we'll send an `inboxAppReply` webhook to your Subscription URL. See the [Webhooks guide](https://docs.followupboss.com/docs/inbox-apps-webhooks) for more information.

=================== https://docs.followupboss.com/docs/inbox-apps-delivery-status.md

# Delivery Status

Outgoing messages, whether originating from your application (e.g. an AI chatbot reply) or from Follow Up Boss, can be [updated by you](https://docs.followupboss.com/reference/inbox-apps-update-message) with a delivery status. All messages start as Sent by default, and can be updated by your application to the following subsequent statuses.

* Delivered
* Read
* Not Delivered

## Appearance in Follow Up Boss

To minimize clutter, Delivered and Read are only displayed on the most recent message of that type. Not Delivered is always displayed on all messages that fail to be delivered.


## Mutability

Read and Not Delivered are immutable statuses - once set to this status the message delivery status can not be changed. If a message is set to Delivered, it can only be further updated to Read.

## Error messages

When updating a message to Not Delivered, you can include an additional `deliveryStatusErrorMessage` which is displayed to the FUB user in a tooltip. This is useful for indicating the specific reason a message could not be delivered - for example if a text message is filtered as spam.


=================== https://docs.followupboss.com/docs/inbox-apps-installation-lifecycle.md

# Installation Lifecycle

Inbox Apps are installed by making an authenticated API request to the Inbox Apps Installation endpoint, providing the scope and the Subscription URL.

### Scopes

> 📘 Account scopes require the account owner's API key.
>
> If you wish to install your Inbox App with an account-wide scope, you must install the app using the account owner's API key. API keys from users can only be used for installations scoped to that user.

Inbox Apps can be scoped to a single user, or to the entire account. An Inbox App with an account scope has the ability to create conversations in all Team Inboxes as well as all User Inboxes. An Inbox App with a user scope can only create conversations in that user's Inbox.

### Subscription URL

During installation you will provide a Subscription URL. This URL will be used by Follow Up Boss to send your application webhooks when a user replies to an Inbox App conversation from within FUB, or when certain Inbox App or conversation events occur such as a conversation being read or archived.

Subscription URLs may be unique to each Inbox App installation, or you can use the same Subscription URL across many installations and accounts.

## Installation Lifecycle

### Collect an API Key

You will need a valid API Key to install and use Inbox Apps. You can collect this from the user at the time they are installing the app, or may reuse one you have obtained for a broader integration.

An account owner's API key can be used to install an Inbox App account-wide, or for any active user. A user's API key can only be used to install an Inbox App for that user. It may be helpful to query [`GET /v1/me`](https://docs.followupboss.com/reference/me) to determine what type of API key you have been provided.

### Request Installation

You can initiate an installation by making request to [`POST /v1/inboxApps/install`](https://docs.followupboss.com/reference/inbox-apps-install) with the following payload.

```json
{
  "publishedInboxAppId": 1,
  "userId": 1,
  "subscriptionUrl": "https://example.test/inbox-app-reply"
}
```

[block:parameters]
{
  "data": {
    "h-0": "**Property**",
    "h-1": "Description",
    "0-0": "`publishedInboxAppId`",
    "0-1": "Your Published Inbox App ID.  \n_(This is provided by FUB when you begin developing your Inbox App.)_",
    "1-0": "`userId`",
    "1-1": "The FUB User to scope the Inbox App for, or `0` for an account-wide scope.",
    "2-0": "`subscriptionUrl`",
    "2-1": "The URL you want to receive webhooks for replies to Inbox App conversations at."
  },
  "cols": 2,
  "rows": 3,
  "align": [
    "left",
    "left"
  ]
}
[/block]

### Confirm Subscription URL Validity

Follow Up Boss will **synchronously** make a POST request to your specified `subscriptionUrl` with the following payload. You **must** respond with a HTTP 200 OK status code to indicate your receipt.

```json
{
  "test": 1
}
```

If you fail to respond with HTTP 200 OK in a timely manner, we will reject your `POST /v1/inboxApps/install` request with HTTP 400 Bad Request.

### Installation complete

Once we receive an HTTP 200 OK response from your `subscriptionUrl` we will install and activate your Inbox App, responding to your install request with HTTP 201 Created and your newly installed [Inbox App ID](https://docs.followupboss.com/docs/inbox-apps-terminology#inbox-app).

### Reinstalling an Inbox App

If you attempt to perform an installation for an Inbox App that has previously been installed and is currently deactivated, we will reactivate the existing Inbox App ID instead of creating a new one. Your Subscription URL will be updated according to the one included in the new install request.

## Installing from Follow Up Boss

> 📘 Inbox Apps are only available in FUB once published.
>
> Inbox Apps in development or private beta will not be visible on the in-app Integrations page.

Inbox Apps can also be installed from Follow Up Boss. When you begin developing your Inbox App you will give us a **Installation Redirect URL**.

If a user installs an Inbox App from Follow Up Boss, we will redirect them to your Installation Redirect URL with a `fubUserId` query parameter, where you can complete installation following the standard installation lifecycle described above. If the requested installation scope is account-wide, `fubUserId` will be `0`.

## Deactivating an Inbox App

Users can deactivate (called "Uninstall" in-app) an Inbox App from Follow Up Boss, at which point you will no longer be able to create new conversations or add messages or notes to conversations, and users will not be able to reply to any existing conversations.

You can also proactively deactivate an Inbox App using our [Deactivate Inbox App API](https://docs.followupboss.com/reference/inbox-apps-deactivate). This is useful in cases where a user unsubscribes from your service, or requests that you turn off your Inbox App for their account.

### Deactivation Webhook

Whenever an Inbox App is deactivated - whether by the user or by using the Deactivate API - Follow Up Boss will send an [`inboxAppDeactivated` webhook](https://docs.followupboss.com/docs/inbox-apps-webhooks#inboxappdeactivated) to that app's Subscription URL.

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppDeactivated",
  "data": {
    "inboxAppId": 1
  }
}
```

| Property     | Description        |
| :----------- | :----------------- |
| `inboxAppId` | Your Inbox App ID. |

=================== https://docs.followupboss.com/docs/inbox-apps-overview.md

# Getting Started


Inbox Apps introduce a unique integration opportunity by allowing you to seamlessly integrate your third-party communication platform into Follow Up Boss. Text-based communication platforms like instant messaging and texting can be integrated directly into Follow Up Boss as a first-class communication medium, elevating a real estate team's communication capabilities to deliver top-notch client services faster than ever.

## First steps

> ℹ️ Inbox Apps are only available to integration partners at this time.
>
> Inbox Apps are only available to established integration partners at this time. A self-service option to support individual real estate teams with in-house developers is coming in the future.

Whether you're investigating the value of an Inbox Apps integration for your platform or if you're ready to start building your proof-of-concept, we're here to help you get started.

If you have gotten this far and without speaking to our product team yet, that would be a great first step to review your use case and make sure Inbox Apps are the right fit for your product. Reach out to <api@followupboss.com> today to schedule a call with a Follow Up Boss Product Manager.

## Checklist for getting started

Here's everything you need to get started building Inbox Apps. Reach out to the FUB Product Manager supporting your Inbox Apps implementation with the below information and we can get you started with your Inbox App.

* **Designated Testing Account:** You'll need a designated account for development and testing. [Sign up here](https://app.followupboss.com/signup/v2) if you don't have one already, and your FUB Product Manager can convert it to a complimentary testing account.

* **Registered System:** Inbox App integrations are required to use Registered System `X-System` and `X-System-Key` headers. If you don't already have a Registered System, you can [create one here](https://apps.followupboss.com/system-registration).

* **Installation Redirect URL:** When a Follow Up Boss user requests to install your Inbox App from the FUB Integrations page, we'll redirect them to your Installation Redirect URL to complete the setup process.

* **App Name & Icon:** We'll need a display name for your Inbox App, as well as an icon. An SVG is preferred, but a large PNG can also be accepted. Your icon will be displayed across the Follow Up Boss application in sizes ranging from 14px to 64px, and in both squircle and round formats.

## Developing your Inbox App

Once you've received your Published Inbox App ID from Follow Up Boss, you can use it to begin development and testing in your designated testing account. See the [Installation Lifecycle](https://docs.followupboss.com/docs/inbox-apps-installation-lifecycle) and [Conversation Lifecycle](https://docs.followupboss.com/docs/inbox-apps-conversation-lifecycle) pages to learn more about installing your app, creating conversations, and adding messages.

## Moving into beta

Once your app is approaching the finish line, you can move it into beta and begin installing it in a limited number of customer accounts.

We'll need some final information as part of this process to make sure your Integration page in FUB looks great. Please provide the following information to the FUB Product Manager supporting your integration, along with a list of mutual customer accounts you would like enabled for beta.

* **(1) Hero Image:** A 516x280px hero image used on our Integrations page.

* **(2) Company Description:** A brief description of the services your company provides.

* **(3) Inbox App Description:** A description of your Inbox App. We support limited markdown (text formatting, headers, etc.) in this area, but no images or videos at this time.

* **(4) Learn More URL:** A link where customers can learn more about your Inbox App.


## Releasing your Inbox App

Once you have completed beta testing, let the FUB Product Manager supporting your integration know and we will work with you to prepare your Inbox App for publishing.

=================== https://docs.followupboss.com/docs/inbox-apps-rich-objects.md

# Rich Objects

> 📘 **Rich Objects are in early access**
>
> Rich Objects are only available on web during early access. Rich Object support in FUB's iOS and Android mobile applications is coming soon.

Rich Objects enable integration partners to include rich and interactive content to Inbox App messages.

## Including Rich Objects with a message

To include a Rich Object with your message, include the `richObjects` array in your [add message request](https://docs.followupboss.com/reference/inbox-apps-add-message) with the fully qualified URL where the Rich Object can be accessed. Follow Up Boss will download and verify the Rich Object before accepting your request, and then may re-fetch it again many times in the future according to the caching TTL you specify.

### Verifying requests

Follow Up Boss includes `FUB-Signature-Timestamp` and `FUB-Signature` headers each time we fetch a Rich Object from your systems, which you can use to verify the request is authentic and originates from FUB.

To verify a signature, concatenate the `FUB-Signature-Timestamp` and the fully qualified URL of the Rich Object with a colon then Base64 the resulting string and compare it against a SHA246 hash encoded using your System Key.

```php
function isGenuineRequest(
    string $richObjectUrl,
    string $fubSignatureTimestamp,
    string $fubSignature 
): bool {
    $encoded = base64_encode("{$fubSignatureTimestamp}:{$richObjectUrl}");
    $calculatedHash = hash_hmac('sha256', $encoded, 'YOUR-X-SYSTEM-KEY');

    return $calculatedHash === $fubSignature;
}
```

## Transport wrapper

All Rich Objects are required to be wrapped in a "transport wrapper" which defines specific attributes about the Rich Object such as how long Follow Up Boss should cache it for, what Title and URL we should use as a fallback if the cache expires and we are unable to refetch it, etc.

```json
{
    "url": "https://example.com/richObject/a-b-c",
    "ttl": 300,
    "fallbackTitle": "123 Main Street",
    "fallbackUrl": "https://example.com/properties/123-main-street",
    "data": {}
}
```

| Property        | Type      | Required | Description                                                                                                         |
| :-------------- | :-------- | :------- | :------------------------------------------------------------------------------------------------------------------ |
| `url`           | `string`  | Yes      | URL where FUB can fetch the Rich Object.                                                                            |
| `ttl`           | `integer` | Yes      | Duration in seconds that FUB can cache the Rich Object data. Can be set to `-1` to allow FUB to cache it forever.   |
| `fallbackTitle` | `string`  | Yes      | Fallback title FUB should use to display the Rich Object if the cache has expired and we are unable to re-fetch it. |
| `fallbackUrl`   | `string`  | Yes      | Fallback URL FUB should link the user to if the cache has expired and we are unable to re-fetch it.                 |
| `data`          | `object`  | Yes      | Rich Object data (see below.)                                                                                       |

## Rich Object Types

### Link

Link Rich Objects are generic and highly flexible objects that can be used for many types of information.


```json
{
    "type": "link",
    "url": "https://example.com/portal/baa",
    "title": "Buyer Agency Agreement",
    "description": "Signed Buyer Agency Agreement from Beth Buyer.",
    "image": "https://example.com/images/baa.png"
}
```

| Property      | Type     | Required | Description                                            |
| :------------ | :------- | :------- | :----------------------------------------------------- |
| `type`        | `string` | Yes      | Always `link`.                                         |
| `url`         | `string` | Yes      | URL to link the user to when they tap the Rich Object. |
| `title`       | `string` | Yes      | Title to display on the Rich Object.                   |
| `description` | `string` | No       | Description to show on the Rich Object.                |
| `image`       | `string` | No       | Preview image to show on the Rich Object.              |

<br />

### Property

Property Rich Objects are used for representing a listing from an IDX.


```json
{
    "type": "property",
    "url": "https://example.com/properties/123-main-street",
    "image": "https://example.com/images/123-main-street.png",
    "price": 399000,
    "street": "123 Main Street",
    "city": "Anyville",
    "state": "CA",
    "code": "90001",
    "bedrooms": "3",
    "bathrooms": "2.5",
    "area": "1700",
    "propertyType": "Home for Sale",
    "mls": {
        "mlsId": "12345678",
        "mlsLogo": "https://example.com/images/foobarmls.png",
        "mlsAttributionString": "Example Realty of California MLS ID #12-34567"
    }
}
```

| Property       | Type      | Required | Description                                            |
| :------------- | :-------- | :------- | :----------------------------------------------------- |
| `type`         | `string`  | Yes      | Always `property`.                                     |
| `url`          | `string`  | Yes      | URL to link the user to when they tap the Rich Object. |
| `image`        | `string`  | No       | Preview image to show on the Rich Object.              |
| `price`        | `integer` | Yes      | Property price.                                        |
| `street`       | `string`  | Yes      | Property street address.                               |
| `city`         | `string`  | Yes      | Property city.                                         |
| `state`        | `string`  | Yes      | Property state abbreviation.                           |
| `code`         | `string`  | Yes      | Property postal code.                                  |
| `bedrooms`     | `string`  | Yes      | Property bedrooms.                                     |
| `bathrooms`    | `string`  | Yes      | Property bathrooms.                                    |
| `area`         | `string`  | Yes      | Property area (square footage.)                        |
| `propertyType` | `string`  | Yes      | Property type.                                         |
| `mls`          | `object`  | No       | MLS Attribution                                        |

#### MLS Attribution

| Property               | Type     | Required | Description             |
| :--------------------- | :------- | :------- | :---------------------- |
| `mlsId`                | `string` | No       | MLS ID of the property. |
| `mlsLogo`              | `string` | No       | MLS logo.               |
| `mlsAttributionString` | `string` | No       | Other MLS attribution.  |

=================== https://docs.followupboss.com/docs/inbox-apps-webhooks.md

# Webhooks

Follow Up Boss sends a webhook to the Subscription URL you provided when installing your app when certain activity happens in an Inbox App conversation within Follow Up Boss.

## `inboxAppReply`

Sent when a user replies to an Inbox App conversation from Follow Up Boss.

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppReply",
  "data": {
    "inboxAppId": 1,
    "externalConversationId": "exampleExtConversationId",
    "body": "An example message.",
    "messageId": 1,
    "userData": {
      "id": 1
    },
    "attachments": [
      {
        "filename": "example.pdf",
        "url": "https://followupboss.test/example.pdf",
        "mimeType": "application/pdf"
      }
    ]
  }
}
```

| Property                 | Description                                                                                                                                |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `inboxAppId`             | Your Inbox App ID.                                                                                                                         |
| `externalConversationId` | The unique identifier for the conversation.                                                                                                |
| `body`                   | The user's message.                                                                                                                        |
| `messageId`              | The FUB ID of the reply. This can be used for [updating delivery statuses](https://docs.followupboss.com/docs/inbox-apps-delivery-status). |
| `userData`               | The FUB user that sent the message.                                                                                                        |
| `attachments`            | An array of attachments the user is sending.                                                                                               |

| `userData` Property | Description                               |
| :------------------ | :---------------------------------------- |
| `id`                | The ID of the user that sent the message. |

| `attachments` Property | Description                                 |
| :--------------------- | :------------------------------------------ |
| `filename`             | The name of the file, for display purposes. |
| `url`                  | The URL where the file can be retrieved.    |
| `mimeType`             | The MIME type of the file.                  |

***

## `inboxAppConversationRead`

Sent when a user reads an Inbox App conversation. Mirrors the unread gleam behavior in Follow Up Boss.

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppConversationRead",
  "data": {
    "externalConversationId": "exampleExtConversationId",
    "fubConversationId": 1,
    "inboxAppId": 1,
    "userId": 1,
    "lastExternalMessageId": "exampleExtMessageId",
    "lastFubMessageId": 123
  }
}
```

| Property                 | Description                                                                                                                                                                                                                                            |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `externalConversationId` | The unique identifier for the conversation.                                                                                                                                                                                                            |
| `fubConversationId`      | The FUB ID of the Inbox App conversation.                                                                                                                                                                                                              |
| `inboxAppId`             | Your Inbox App ID.                                                                                                                                                                                                                                     |
| `userId`                 | The user that read the conversation.                                                                                                                                                                                                                   |
| `lastExternalMessageId`  | The most recent External Message ID that has been read by the user. All messages prior to and including this one should be considered read when this webhook is received. This may be null in cases where the most recent message originated from FUB. |
| `lastFubMessageId`       | The most recent FUB Message ID that has been read by the user. All messages prior to and including this one should be considered read when this webhook is received.                                                                                   |

## `inboxAppConversationArchived`

Sent when a conversation is archived (closed.)

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppConversationArchived",
  "data": {
    "externalConversationId": "exampleExtConversationId",
    "fubConversationId": 1,
    "inboxAppId": 1
  }
}
```

| Property                 | Description                                 |
| :----------------------- | :------------------------------------------ |
| `externalConversationId` | The unique identifier for the conversation. |
| `fubConversationId`      | The FUB ID of the Inbox App conversation.   |
| `inboxAppId`             | Your Inbox App ID.                          |

## `inboxAppConversationUnarchived`

Sent when a conversation is unarchived (re-opened.)

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppConversationUnarchived",
  "data": {
    "externalConversationId": "exampleExtConversationId",
    "fubConversationId": 1,
    "inboxAppId": 1
  }
}
```

| Property                 | Description                                 |
| :----------------------- | :------------------------------------------ |
| `externalConversationId` | The unique identifier for the conversation. |
| `fubConversationId`      | The FUB ID of the Inbox App conversation.   |
| `inboxAppId`             | Your Inbox App ID.                          |

## `inboxAppConversationAssigned`

Sent when a conversation is assigned to another User or Shared Inbox.

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppConversationAssigned",
  "data": {
    "externalConversationId": "exampleExtConversationId",
    "fubConversationId": 1,
    "inboxAppId": 1,
    "assignedUserId": 0,
    "assignedSharedInboxId": 1
  }
}
```

| Property                 | Description                                                                |
| :----------------------- | :------------------------------------------------------------------------- |
| `externalConversationId` | The unique identifier for the conversation.                                |
| `fubConversationId`      | The FUB ID of the Inbox App conversation.                                  |
| `inboxAppId`             | Your Inbox App ID.                                                         |
| `assignedUserId`         | User the conversation is assigned to, or `0` if not assigned to a user.    |
| `assignedSharedInboxId`  | Inbox the conversation is assigned to, or `0` if not assigned to an Inbox. |

## `inboxAppDeactivated`

Sent when an Inbox App is deactivated (uninstalled) from the Follow Up Boss integrations page.

```json
{
  "eventId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "eventCreated": "2024-01-01T12:00:00+00:00",
  "event": "inboxAppDeactivated",
  "data": {
    "inboxAppId": 1
  }
}
```

| Property     | Description        |
| :----------- | :----------------- |
| `inboxAppId` | Your Inbox App ID. |

=================== https://docs.followupboss.com/docs/lead-provider-integration-guide.md

# Lead Provider Integration Guide

How to integrate a lead generation system with Follow Up Boss

This guide is for developers who aim to integrate a lead generation system such as an IDX website with Follow Up Boss.

\##Sending leads to Follow Up Boss

To send a lead into Follow Up Boss use [POST /events](/reference#events-post) method. This will ensure that all appropriate automations are triggered in Follow Up Boss, for example the lead is assigned to the right agent and they are notified about it.

Do not use /people endpoint to send new leads into Follow Up Boss, as it won't trigger automations in FUB, can cause duplicates and other adverse effects.

A minimalistic example of sending a lead:

```
POST https://api.followupboss.com/v1/events
{
    "source": "MyAwesomeWebsite.com",
    "system": "AwesomeSiteBuilder",
    "type": "General Inquiry",
    "message": "Looking for a house under $500k in the East Boston area",
    "person": {
        "firstName": "John",
        "lastName": "Smith",
        "emails": [{"value": "john@gmail.com"}],
        "phones": [{"value": "555-555-5555"}]
    }
}
```

See a list of all fields available in our [API reference](https://docs.followupboss.com/v1.0/reference#events-post).
See [code examples on GitHub](https://github.com/FollowUpBoss/fub-api-examples).

\##Key events to send to Follow Up Boss

* Registration
* Inquiry
* Saved property
* Viewed Property
* Property search

See a list of all events available in [the API reference](/v1.0/reference#events-post).

\##Extra information to send

* Assigned agent ('assignedTo' field)
* PPC data ('campaign' section)
* Your system name e.g. "AwesomeSiteBuilder" ('system' field)
* Link to lead in your system ('sourceUrl' field)

\##Extra things to check

* Is API key secure and not exposed in browser
* Using events not people API
* Source should be the domain of the website without "[www](http://www).", e.g. myawesomewebsite.com

=================== https://docs.followupboss.com/docs/oauth-authentication-and-authorization.md

# Authentication & Authorization

# Step 1: Requesting User Consent

The first step in the OAuth flow is to obtain the User's consent. The requesting application should redirect the FUB User to the following URL to obtain consent:

```
GET https://app.followupboss.com/oauth/authorize
    ?response_type=auth_code
    &client_id=<your_client_id>
    &redirect_uri=<your_redirect_uri>
    &state=<opaque_state_value>
    &prompt=login
```

| Parameter                      | Description                                                                                                                                                                                                                                                                          |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **response\_type** *\<string>* | This parameter tells the authorization server which grant to use. Currently, it only supports `response_type=auth_code` for the Authorization Code Grant Flow.                                                                                                                       |
| **client\_id** *\<string>*     | The unique ID, issued by FUB, representing your OAuth Client App.                                                                                                                                                                                                                    |
| **redirect\_uri** *\<string>*  | This is the redirect URL specified when creating your OAuth Client App. After completing the authorization process, FUB will redirect the User to this URL. Be sure to [URL encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) the value of this parameter. |
| **state** *\<string>*          | This is an opaque value provided by the requesting system to prevent [CSRF attacks](https://owasp.org/www-community/attacks/csrf) and to maintain the state between requests and callbacks.                                                                                          |
| **prompt** *\<string>*         | This parameter controls the behavior of the user interface during the authorization flow. Currently, it only supports `prompt=login` which will require the User to re-login before authorizing the OAuth Client App.                                                                |

# Step 2: Receiving Authorization Grant

After obtaining consent, FUB will redirect the User back to the provided `redirect_uri` with the following query parameters:

```
GET https://<your_redirect_uri>
    ?response=<approved|denied>
    &code=<auth_code>
    &state=<state_value_from_request>
```

[block:parameters]
{
  "data": {
    "h-0": "Parameter",
    "h-1": "Description",
    "0-0": "**response** _\\<string>_",
    "0-1": "The value for this parameter will be `approved` if the FUB User consented and `denied` if they denied consent.",
    "1-0": "**code** _\\<string>_",
    "1-1": "This is the authorization code (`auth_code`) that will be used by your OAuth Client App to redeem User tokens.  \n_Note: This parameter is omitted when consent is denied._",
    "2-0": "**state** _\\<string>_",
    "2-1": "The value for this parameter will be the same as the `state` value provided when requesting the User's consent."
  },
  "cols": 2,
  "rows": 3,
  "align": [
    "left",
    "left"
  ]
}
[/block]

> 🚧 Consent denied workflow
>
> FUB does not provide any formal recommendations for handling consent denials. The user experience and messaging when a User denies consent is the responsibility of the system acting on behalf of the OAuth Client App.

# Step 3: Exchanging `auth_code` for tokens

Perform the following request to exchange the `auth_code` for tokens:

```
POST https://app.followupboss.com/oauth/token
```

Your request must be Authenticated with [HTTP Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) over HTTPS. Construct the authentication string by [Base64](https://en.wikipedia.org/wiki/Base64)-encoding your OAuth Client App's Client ID and Secret.

```http http
Authorization: Basic base64("<client_id>:<client_secret>")
```

All parameters must be sent as URL-encoded form data (`application/x-www-form-urlencoded`).

[block:parameters]
{
  "data": {
    "h-0": "Parameter",
    "h-1": "Description",
    "0-0": "**grant_type** _\\<string>_",
    "0-1": "This parameter tells the authorization server the type of grant you are trying to redeem.  \nSupported values:  \n  \n- `authorization_code` (for this Use Case)\n- `refresh_token`",
    "1-0": "**code** _\\<string>_",
    "1-1": "This is the authorization code (`auth_code`) that was provided in the previous response.",
    "2-0": "**redirect_uri** _\\<string>_",
    "2-1": "This is the redirect URL specified when creating your OAuth Client App. We only use this value as an additional verification factor. Be sure to [URL encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)  the value of this parameter.",
    "3-0": "**state** _\\<string>_",
    "3-1": "This is an opaque value provided by the requesting system to prevent [CSRF attacks](https://owasp.org/www-community/attacks/csrf)  and to maintain the state between requests and callbacks."
  },
  "cols": 2,
  "rows": 4,
  "align": [
    "left",
    "left"
  ]
}
[/block]

A successful response will include the Access & Refresh tokens representing the FUB User. The [Token Exchange Response](https://docs.followupboss.com/docs/oauth-token-exchange-response) section details the response payload structure for successful and failed responses.

> 🚧 Deprecated GET endpoint
>
> While the previously defined GET endpoint remains available for existing integrations, new integrations and existing integrations wishing to make the switch over should use the POST endpoint instead to follow proper OAuth protocols.
>
> ```
> GET https://app.followupboss.com/oauth/token
>     ?grant_type=auth_code
>     &code=<auth_code>
>     &redirect_uri=<your_redirect_uri>
>     &state=<opaque_state_value>
> ```

# Step 4: Making Authenticated API Requests

🎉 Your OAuth Client App is ready to perform authenticated API Requests against the FUB API.

To perform authenticated requests, your request must be Authenticated with HTTP Bearer/Token Authentication over HTTPS.

```http
Authorization: Bearer <valid_access_token>
```

For a complete list of available endpoints, refer to the [Follow Up Boss API Reference](https://docs.followupboss.com/reference/getting-started)

# Step 5: Refreshing an Access Token

Access Tokens are short-lived tokens (See [Token Lifetimes](https://docs.followupboss.com/docs/oauth-token-lifetimes) to learn more). Perform the following request to obtain a new Access Token:

```
POST https://app.followupboss.com/oauth/token
```

Your request must be Authenticated with [HTTP Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) over HTTPS. Construct the authentication string by `base64 encoding` your OAuth Client App's Client ID and Secret.

```http
Authorization: Basic base64("<client_id>:<client_secret>")
```

All parameters must be sent as URL-encoded form data (`application/x-www-form-urlencoded`).

[block:parameters]
{
  "data": {
    "h-0": "Parameter",
    "h-1": "Description",
    "0-0": "**grant_type** _\\<string>_",
    "0-1": "This parameter tells the authorization server the type of grant you are trying to redeem.  \nSupported values:  \n  \n- `authorization_code`\n- `refresh_token` (for this Use Case)",
    "1-0": "**refresh_token** _\\<string>_",
    "1-1": "This is the FUB User's refresh token, which will be used to generate a new access token."
  },
  "cols": 2,
  "rows": 2,
  "align": [
    "left",
    "left"
  ]
}
[/block]

A successful response will include the Access & Refresh tokens representing the FUB User. The [Token Exchange Response](https://docs.followupboss.com/docs/oauth-token-exchange-response) section details the response payload structure for successful and failed responses.

> 🚧 Deprecated GET endpoint
>
> While this GET endpoint remains available for existing integrations, new integrations should use the POST endpoint instead.
>
> ```
> GET https://app.followupboss.com/oauth/token
>     ?grant_type=refresh_token
>     &refresh_token=<refresh_token>
> ```

# Step 6: Revoking User Access for an OAuth Client App

Use this endpoint to revoke the authenticated User's Access and Refresh Tokens for the OAuth app associated with the X-System making the request.

Simply use the DELETE method and provide your X-System and X-System-Key in the request header, along with a valid [User Access Token](https://docs.followupboss.com/docs/oauth-authentication-and-authorization#step-4-making-authenticated-api-requests).

```
curl --request DELETE 'https://api.followupboss.com/v1/oauthApps/revokeAccess' \
--header 'Authorization: Basic <valid_access_token>' \
--header 'X-System: <your-registered-x-system-name>' \
--header 'X-System-Key: <your-registered-x-system-key>'
```

Example output from the request

```json
{
  "success": true
}
```

If the OAuth Client App is not connected for the authenticated user, the API will return an error.

```json
{
  "errorMessage": "OAuth application not found or not connected."
}
```

> ❗️ **Revoking access is irreversible**
>
> If the user wants to reconnect the application, they must complete the OAuth authorization flow again

=================== https://docs.followupboss.com/docs/oauth-error-codes.md

# Error Codes

This page contains the list of possible OAuth 2.0 error codes grouped by HTTP Status Codes.

# `400 Bad Request`

* `invalid_grant` - The provided authorization grant is invalid, expired, or revoked
* `unsupported_grant_type` - The grant type is missing or not supported
* `invalid_client` - Client authentication failed (invalid or missing credentials)
* `invalid_request` - The request is missing required parameters or is malformed

# `401 Unauthorized`

* `invalid_grant` - The provided authorization grant is invalid, expired, or revoked

# `403 Forbidden`

* `unauthorized_client` - The client is not authorized to access this resource

# `404 Not Found`

* `invalid_grant` - The provided authorization grant is invalid, expired, or revoked

# `500 Server Error`

* `server_error` - An unexpected server-side error occurred

<br />

> 🚧 Legacy Error Codes
>
> The error codes shown below are maintained only for existing integrations. New integrations should use the error codes described above.

# `400 Bad Request`

```
code-exchange-failed
missing-grant-type-param
missing-authorization-header
missing-required-params
invalid-authorization-header
invalid-grant-type
invalid-refresh-token
invalid-access-token
invalid-auth-code
invalid-redirect-uri
invalid-oauth-app
```

# `401 Unauthorized`

```
expired-refresh-token
expired-access-token
expired-auth-code
```

# `403 Forbidden`

```
resource-restricted
```

# `404 Not Found`

```
inactive-account
invalid-account
account-not-found
user-not-found
```

=================== https://docs.followupboss.com/docs/oauth-token-exchange-response.md

# Token Exchange Response

# Success Response

All successful responses (HTTP Status Code `200 Success`) will include `access` and `refresh` tokens.

```json
{
  "access_token": "<string>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "<string>"
}
```

| Parameter                           | Description                           |
| :---------------------------------- | :------------------------------------ |
| **access\_token** *\<string>*       | Access Token                          |
| **token\_type** *\<string>*         | Access Token Type (Default: `Bearer`) |
| **expires\_in** *\<int>*            | Access Token TTL                      |
| **data.refresh\_token** *\<string>* | Refresh Token                         |

<br />

> 🚧 Legacy Response Format
>
> The response format shown below is only maintained for existing integrations using the deprecated `GET /oauth/token` endpoint. New integrations using the recommended `POST /oauth/token` endpoint will receive the standard OAuth response format described above.
>
> ```json
> {
>   "success": true,
>   "data": {
>     "access_token": "<string>",
>     "token_type": "bearer",
>     "refresh_token": "<string>",
>     "ttl": "<string>",
>     "issued_at": "<string>",
>     "expires_at": "<string>"
>   }
> }
> ```
>
> | Parameter                           | Description                                                                         |
> | :---------------------------------- | :---------------------------------------------------------------------------------- |
> | **success** *\<bool>*               | Boolean value representing the success/failure state of the request                 |
> | **data** *\<object>*                | The data object containing the Access & Refresh tokens, along with their properties |
> | **data.access\_token** *\<string>*  | Access Token                                                                        |
> | **data.token\_type** *\<string>*    | Access Token Type (Default: `bearer`)                                               |
> | **data.refresh\_token** *\<string>* | Refresh Token                                                                       |
> | **data.ttl** *\<string>*            | Access Token TTL                                                                    |
> | **data.issued\_at** *\<string>*     | Access Token issue date in format: `Y-m-d\TH:i:s\Z`                                 |
> | **data.expires\_at** *\<string>*    | Access Token expiry date in format: `Y-m-d\TH:i:s\Z`                                |

<br />

# Error Response

All error responses will contain the following standardized error payload:

```json
{
  "error": "<string>",
  "error_description": "<string>"
}
```

| Parameter                                  | Description                                                                                                                                                                         |
| :----------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **error** *\<string>*                      | A standardized OAuth 2.0 error code. Possible values include: `server_error`, `invalid_client`, `invalid_grant`, `unauthorized_client`, `unsupported_grant_type`, `invalid_request` |
| **error\_description** *\<array\[string]>* | A human-readable message explaining the error in more detail.                                                                                                                       |

<br />

> 🚧 Legacy Response Format
>
> The response format shown below is only maintained for existing integrations using the deprecated `GET /oauth/token` endpoint. New integrations using the recommended `POST /oauth/token` endpoint will receive the standard OAuth response format described above.
>
> ```json
> {
>   "success": false,
>   "errorMessage": "<string>",
>   "errorDetails": "<array[string]>",
>   "errorCode": "<string>"
> }
> ```
>
> | Parameter                            | Description                                                                                                                                                                                              |
> | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **success** *\<bool>*                | Boolean value representing the success/failure state of the request. This will equal `false` for all error responses                                                                                     |
> | **errorMessage** *\<string>*         | A generalized human-readable message describing the error (i.e., `Redirect URI is invalid`,  `Missing required params`,  `Invalid grant type`).                                                          |
> | **errorDetails** *\<array\[string]>* | OPTIONAL. This field contains additional human-readable messages providing further context. For example, when parameters are missing, this property will contain the list of missing parameters.         |
> | **errorCode** *\<string>*            | The `errorCode` property will contain a machine-readable string describing the error. Refer to the [Error Codes](https://docs.followupboss.com/docs/oauth-error-codes) page for a comprehensive list of all possible error code values. |

=================== https://docs.followupboss.com/docs/oauth-token-lifetimes.md

# Token Lifetimes

# Auth Code

Auth codes are one-time use codes. Therefore, they expire **immediately after use** or within **15 minutes** when unused.

# Access Token

Access Tokens are short-lived tokens that expire **60 minutes** after being issued.

# Refresh Token

Refresh Tokens are granted when exchanging an Auth Code. They are intended to be lifetime tokens that can be used to request access tokens. As a result, they only expire if **unused for 90 days**.

=================== https://docs.followupboss.com/docs/start-here-brand-new-integration.md

# Start Here (Brand New Integration)

From registering your system, creating a trial account, authenticating requests to sending in your first contact.

This guide will walk you through everything to get started up to pushing a contact into Follow Up Boss.

* Registering your system key for request HTTP headers
* Using HTTP Basic Auth to send Follow Up Boss User's API Key
* Creating a trial Follow Up Boss account so that you can see the result of your API requests in Follow Up Boss
* Sending in a contact to Follow Up Boss

### Registering your system key

Every request to the API should include the registered 'X-System' and 'X-System-Key' headers. These headers are unique to your system and should be the same for every API request regardless of the Follow Up User's API Key.\
Register your system here: [Registration](https://apps.followupboss.com/system-registration)

The HTTP headers in the API requests should look like this:

```
X-System: AwesomeWebsiteBuilder
X-System-Key: 560270f7914b5b4a5f4dc1793ebc2796
```

> 📘 System Headers vs API Key
>
> Both are required in every HTTP API request. The System Headers identify (you) the system sending the request. The API Key identifies the Follow Up Boss user and account.

Additional details about system key are here: [Identification](https://docs.followupboss.com/reference/identification)

### Sending Follow Up Boss User's API Key

Every user in Follow Up Boss has a unique API Key that can be obtained from "Admin" -> "API" screen. External applications use API Key to get authenticated and read/update data in Follow Up Boss on the user's behalf.

![](https://files.readme.io/d02d7a1-Screenshot_2023-03-17_at_12.21.43_PM.png "Screenshot 2023-03-17 at 12.21.43 PM.png")

Authentication is done with HTTP Basic Authentication over HTTPS. **Use API Key as the username and leave the password blank** (or you can put any value as password if your HTTP client requires it).

Example of sending an API Key (fka\_0qaLqXMChGLM4y27M4fJ9yYoajevmePhPU) in a Curl Request:

```
curl https://api.followupboss.com/me
   -u "fka_0qaLqXMChGLM4y27M4fJ9yYoajevmePhPU:"
```

> ❗️ HTTPS Only
>
> Follow Up Boss API is available via HTTPS only. This ensures that API Key is always encrypted during transmission. API Key provides the same privileges as the user's login credentials and should be handled securely.

For more details about API Key and role permission levels: [Authentication](https://docs.followupboss.com/reference/authentication)

### Creating a trial Follow Up Boss account

Create a trial account here: [https://app.followupboss.com/signup](https://app.followupboss.com/signup])\
This is a 14 day free trial account. When you are confident with your intention to build an integration or need more time to decide you can email <product@followupboss.com> to request an extension or conversion to a dev account which never expires.

![](https://files.readme.io/07be833-Screenshot_2023-03-17_at_1.13.37_PM.png "Screenshot 2023-03-17 at 1.13.37 PM.png")

This is a full-featured account so you will be able to experience Follow Up Boss as any customer would.

### Generate an API Key in your Follow Up Boss account

Go to Admin -> API and Generate a new key. You customer will go here to generate an API Key to provide to you. The name would likely be the name of your service.

![](https://files.readme.io/a503bfb-Screenshot_2023-03-17_at_1.17.27_PM.png "Screenshot 2023-03-17 at 1.17.27 PM.png")

> 🚧 API Key only displayed once when created.
>
> Make sure to copy the API key at the time it is created. You will not be able to retrieve it later. You will be able to generate another key if it is lost.

With your system registered, trial account created and API Key generated, you are ready to make your first API Request.

## Sending in a contact to Follow Up Boss

The events endpoint is the preferred way to send in contacts. Leads are typically generated from a specific marketing event (Showing request, Home Search Registration etc...) so the events endpoint captures the lead contact data as well as the event data.

```
POST https://api.followupboss.com/v1/events
{
    "source": "MyAwesomeWebsite.com",
    "system": "AwesomeSiteBuilder",
    "type": "General Inquiry",
    "message": "Looking for a house under $500k in the East Boston area",
    "person": {
        "firstName": "John",
        "lastName": "Smith",
        "emails": [{"value": "john@gmail.com"}],
        "phones": [{"value": "555-555-5555"}]
    }
}
```

You should receive a 200 status code if successful.\
Go to People in Follow Up Boss to see the contact.

![](https://files.readme.io/0c9d411-Screenshot_2023-03-17_at_1.30.33_PM.png "Screenshot 2023-03-17 at 1.30.33 PM.png")

Click on the contact name to see their details. The event will be displayed in the timeline.

![](https://files.readme.io/37d5af5-Screenshot_2023-03-17_at_1.31.57_PM.png "Screenshot 2023-03-17 at 1.31.57 PM.png")

Congrats on integrating with Follow Up Boss. Discover what else is possible by reading about all the API endpoints, webhooks and embedded apps.

* [Endpoint Reference](https://docs.followupboss.com/reference/getting-started)
* [Webhooks](https://docs.followupboss.com/reference/webhooks-guide)
* [Embedded App](https://docs.followupboss.com/reference/embedded-apps)

=================== https://docs.followupboss.com/reference/actionplans-get.md
# /actionPlans

Get a list of Action Plans.

> 🚧 Deprecation Notice: Upcoming Automations 2.0 Changes
>
> This endpoint is planned for deprecation as part of the Automations 2.0 rollout. While no date has been set, we will provide a clear migration path shortly to ensure a smooth transition.

### GET /actionPlans  — Get a list of Action Plans.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `sort` (string): Sort Action Plans by a given field. (e.g., "id" or "name")
- [query] `status` (string): Search for Action Plans with one of the following statuses: `Active`,`Deleted`, or `Active,Deleted` (if you want both).
- [query] `names` (array<string>): Search for Action Plans by `name`. Use array parameters format with encoded values, e.g. `/actionPlans?names[]=Action%20Plan%20Name%201&names[]=Action%20Plan%20Name%202`.
- [query] `ids` (string): Search for Action Plans by `id`. Use a comma separated list, e.g. `/actionPlans?ids=287564,67484,8436437`
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "actionPlans",
    "offset": 0,
    "limit": 10,
    "total": 6
  },
  "actionPlans": [
    {
      "id": 6,
      "created": "2014-08-24T22:12:53Z",
      "updated": "2014-08-24T22:12:53Z",
      "name": "Qualify buyer leads",
      "status": "Active"
    },
    ...
  ]
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/actionplanspeople-get.md
# /actionPlansPeople

List Action Plans applied to a particular person or list people on a particular Action Plan.

> 🚧 Deprecation Notice: Upcoming Automations 2.0 Changes
>
> This endpoint is planned for deprecation as part of the Automations 2.0 rollout. While no date has been set, we will provide a clear migration path shortly to ensure a smooth transition.

### GET /actionPlansPeople  — List Action Plans applied to a particular person or list people on a particular Action Plan.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `personId` (integer): List Action Plans applied to a specified person.
- [query] `actionPlanId` (integer): List People on the specified Action Plan.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "actionPlansPeople",
    "offset": 0,
    "limit": 10,
    "total": 2
  },
  "actionPlansPeople": [
    {
      "id": 2,
      "created": "2014-08-19T18:31:43Z",
      "updated": "2014-08-19T18:31:43Z",
      "personId": 10810,
      "actionPlanId": 2,
      "status": "Running"
    },
    ...
  ]
}
  


=================== https://docs.followupboss.com/reference/actionplanspeople-id-put.md
# /actionPlansPeople/:id

Update the status of an Action Plan to Person relationship.

> 🚧 Deprecation Notice: Upcoming Automations 2.0 Changes
>
> This endpoint is planned for deprecation as part of the Automations 2.0 rollout. While no date has been set, we will provide a clear migration path shortly to ensure a smooth transition.

### PUT /actionPlansPeople/{id}  — Update the status of an Action Plan to Person relationship.
- [path] `id` (integer) REQUIRED: The ID of the Action Plan People object.
- BODY (application/json):
  - `status` (string) REQUIRED: The desired state of the applied action plan. Either `Running` or `Paused`.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/actionplanspeople-post.md
# /actionPlansPeople

Apply an Action Plan to a person.

> 🚧 Deprecation Notice: Upcoming Automations 2.0 Changes
>
> This endpoint is planned for deprecation as part of the Automations 2.0 rollout. While no date has been set, we will provide a clear migration path shortly to ensure a smooth transition.

### POST /actionPlansPeople  — Apply an Action Plan to a person.
- BODY (application/json):
  - `personId` (integer) REQUIRED: The ID of the person to whom you would like to apply the action plan.
  - `actionPlanId` (integer) REQUIRED: The ID of the action plan to apply
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/api-change-requests.md

# API Change Requests

Are you an integration partner interested in seeing new API endpoints? Changes to existing endpoints?

Email us at <integration-requests@followupboss.com> and our team will be in touch!

=================== https://docs.followupboss.com/reference/appointmentoutcomes-get.md
# /appointmentOutcomes

List appointment outcomes.

### GET /appointmentOutcomes  — List appointment outcomes.
- [query] `sort` (string) default=orderWeight: The sort order can be one of the following: `id`, `name`, `orderWeight` (Note: Prefix the string with a minus (`-`) to sort in descending order (e.g., `-orderWeight`)).
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "appointmentoutcomes",
    "offset": 0,
    "limit": 10,
    "total": 3,
    "next": null,
    "nextLink": null
  },
  "appointmentoutcomes": [
    {
      "id": 1,
      "name": "No show",
      "orderWeight": 1000
    },
    {
      "id": 2,
      "name": "Working with buyers",
      "orderWeight": 2000
    },
    {
      "id": 3,
      "name": "Listing obtai
- RESPONSE 400 example: {
  "errorMessage": "Invalid field(s) in the fields parameter: [list of invalid fields]"
}


=================== https://docs.followupboss.com/reference/appointmentoutcomes-id-delete.md
# /appointmentOutcomes/:id

Delete an appointment outcome.

> 🚧 Restricted Access
>
> Deleting an appointment outcome is restricted to the account owner.

### DELETE /appointmentOutcomes/{id}  — Delete an appointment outcome.
- [path] `id` (integer) REQUIRED: ID of the appointment outcome.
- [query] `assignOutcomeId` (integer) REQUIRED: The outcomeId to reassign existing appointments
- RESPONSE 200 example: []
- RESPONSE 400 example: {
  "errorMessage": "Missing 'assignOutcomeId' field."
}
- RESPONSE 400 example: {
  "errorMessage": "No type found for given 'assignOutcomeId' field."
}
- RESPONSE 403 example: {
  "errorMessage": "You do not have access to delete appointment outcomes."
}
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/appointmentoutcomes-id-get.md
# /appointmentOutcomes/:id

Retrieve an appointment outcome by ID.

### GET /appointmentOutcomes/{id}  — Retrieve an appointment outcome by ID.
- [path] `id` (integer) REQUIRED: The id of the appointment outcome.
- RESPONSE 200 example: {
  "id": 3,
  "name": "Test Outcome",
  "orderWeight": 3000
}
- RESPONSE 400 example: {
    "errorMessage": "Invalid field(s) in the fields parameter: [list of invalid fields]"
}
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/appointmentoutcomes-id-put.md
# /appointmentOutcomes/:id

Update an appointment outcome.

> 🚧 Restricted Access
>
> Updating an appointment outcome is restricted to the account owner.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### PUT /appointmentOutcomes/{id}  — Update an appointment outcome.
- [path] `id` (integer) REQUIRED: The id of the appointment outcome.
- BODY (application/json):
  - `name` (string): The name of the appointment outcome.
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
  "id": 3,
  "name": "Test Outcome",
  "orderWeight": 3000
}
- RESPONSE 400 example: {
  "errorMessage": "Invalid fields in the request body: [list of invalid fields]"
}
- RESPONSE 400 example: {
    "errorMessage": "Expected field '[fieldName]' to be of data type [dataType]."
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to update appointment outcomes."
}
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/appointmentoutcomes-post.md
# /appointmentOutcomes

Create an appointment outcome.

> 🚧 Restricted Access
>
> Creating new appointment outcomes is restricted to the account owner.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### POST /appointmentOutcomes  — Create an appointment outcome.
- BODY (application/json):
  - `name` (string): Name of the appointment outcome.
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
  "id": 3,
  "name": "Test Outcome",
  "orderWeight": 3000
}
- RESPONSE 400 example: {
  "errorMessage": "Invalid fields in the request body: [list of invalid fields]"
}
- RESPONSE 400 example: {
    "errorMessage": "Expected field '[fieldName]' to be of data type [dataType]."
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to update appointment outcomes."
}


=================== https://docs.followupboss.com/reference/appointments-get.md
# /appointments

Search for appointments.

> 🚧 Restricted Results
>
> It's important to note that this endpoint has a few conditions that determine what is returned:
>
> 1. The appointment has to belong to the person making the request. (i.e., the API key used to authenticate matches with who created the appointment)
> 2. The appointment has to be created in Follow Up Boss. (i.e., not coming from a Google calendar sync)
> 3. The user who created the appointment has to be sharing their calendar.

### GET /appointments  — Search for appointments.
- [query] `personId` (integer): Find all appointments related to a person. (Note: This can be comma separated list to search multiple users.)
- [query] `userId` (integer): Find all appointments related to a user by id.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `start` (string): Date and time representing the start of a date/time range for which to search (must be combined with the `end` argument).
- [query] `end` (string): Date and time representing the end of a date/time range for which to search (must be combined with the `start` argument).
- RESPONSE 200 example: {
    "_metadata": {
        "collection": "appointments",
        "offset": 0,
        "limit": 10,
        "total": 1,
        "next": null,
        "nextLink": null
    },
    "appointments": [
        {
            "id": 123,
            "created": "2020-05-04T14:45:13Z",
            "updated": "2020-05-04T14:45:13Z",
            "createdById": 1,
            "updatedById": 1,
            "tit
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/appointments-id-delete.md
# /appointments/:id

Delete an appointment.

### DELETE /appointments/{id}  — Delete an appointment.
- [path] `id` (integer) REQUIRED: The id of appointment to delete.
- RESPONSE 204 example: 
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/appointments-id-get.md
# /appointments/:id

Retrieve an appointment by id.

### GET /appointments/{id}  — Retrieve an appointment by id.
- [path] `id` (integer) REQUIRED: The id of the appointment.
- RESPONSE 200 example: {
   "id":123,
   "created":"2020-05-04T14:45:13Z",
   "updated":"2020-05-04T14:45:13Z",
   "createdById":1,
   "updatedById":1,
   "title":"Call mom",
   "description":"Wish mom a happy Mother's Day",
   "start":"2020-05-10T17:00:00Z",
   "end":"2020-05-10T18:00:00Z",
   "allDay":false,
   "originFub":true,
   "location":"",
   "invitees":[
      {
         "userId":1,
         "personId":null,
 
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/appointments-id-put.md
# /appointments/:id

Update an appointment.

> 📘 Invitees
>
> The `invitees` argument can contain both [/people](https://docs.followupboss.com/reference/people-get) or [/users](https://docs.followupboss.com/reference/users-get) objects.

> 📘 Appointment Types Outcomes
>
> Appointment Types determine what kind of appointment is being created. See [/appointmentTypes](https://docs.followupboss.com/reference/appointmenttypes-get) for a list of options.
>
> Appointment Outcomes are used to describe what the result is for a particular appointment. See [/appointmentOutcomes](https://docs.followupboss.com/reference/appointmentoutcomes-get) for a list of options.

### PUT /appointments/{id}  — Update an appointment.
- [query] `sendInvitation` (boolean) default=False: Send an invitation email to invitees. (Note: If the "appointment reminders" is enabled, an SMS reminder will also be sent.)
- [path] `id` (integer) REQUIRED: The id of the appointment to update.
- BODY (application/json):
  - `title` (string) REQUIRED: Title of the appointment.
  - `description` (string): Description of the appointment or event.
  - `invitees` (string): Array of users and/or people to invite to the appointment. (e.g., User object: `{userId: 1, name: "Tom Minch"}`, People object: `{personId: "123", name: "John Q Customer", email: "johnq@example.com"}`)
  - `allDay` (boolean) default=False: Sets whether the appointment is an all day event or not.
  - `start` (string) REQUIRED: The beginning date and time of the appointment (in UTC, also supports time zone suffix).
  - `end` (string) REQUIRED: The ending date and time of the appointment (in UTC, also supports time zone suffix).
  - `location` (string): The location or address of the appointment.
  - `typeId` (integer): The Follow Up Boss appointment type identifier.
  - `outcomeId` (integer): The Follow Up Boss appointment outcome identifier.
- RESPONSE 200 example: {
   "id":13854,
   "created":"2020-09-04T15:13:18Z",
   "updated":"2020-09-04T15:13:18Z",
   "createdById":1,
   "updatedById":1,
   "title":"Lunch",
   "description":"Tom and John Q. are having lunch. Gotta try the new \"impossible\" burger",
   "start":"2020-09-04T16:00:00Z",
   "end":"2020-09-04T17:00:00Z",
   "allDay":false,
   "originFub":true,
   "location":"",
   "invitees":[
      {
     
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/appointments-post.md
# /appointments

Create an appointment.

> 📘 Invitees
>
> The `invitees` argument can contain both [/people](https://docs.followupboss.com/reference/people-get) or [/users](https://docs.followupboss.com/reference/users-get) objects.

> 📘 Appointment Types Outcomes
>
> Appointment Types determine what kind of appointment is being created. See [/appointmentTypes](https://docs.followupboss.com/reference/appointmenttypes-get) for a list of options.
>
> Appointment Outcomes are used to describe what the result is for a particular appointment. See [/appointmentOutcomes](https://docs.followupboss.com/reference/appointmentoutcomes-get) for a list of options.

> 🚧 Syncing with Third-Party Calendars
>
> Appointments created in Follow Up Boss will sync with Third-Party Calendars (Gmail, Outlook), but **only** if the `invitees` list contains the Follow Up Boss `user` with a properly synced calendar as well as any other invitees.

### POST /appointments  — Create an appointment.
- [query] `sendInvitation` (boolean) default=False: Send an invitation email to invitees. (Note: If the "appointment reminders" is enabled, an SMS reminder will also be sent.)
- BODY (application/json):
  - `title` (string) REQUIRED: Title of the appointment.
  - `description` (string): Description of the appointment or event.
  - `invitees` (string): Array of users and/or people to invite to the appointment. (e.g., User object: `{userId: 1, name: "Tom Minch"}`, People object: `{personId: "123", name: "John Q Customer", email: "johnq@example.com"}`)
  - `allDay` (boolean) default=False: Sets whether the appointment is an all day event or not.
  - `start` (string) REQUIRED: The beginning date and time of the appointment (in UTC, also supports time zone suffix).
  - `end` (string) REQUIRED: The ending date and time of the appointment (in UTC, also supports time zone suffix).
  - `location` (string): The location or address of the appointment.
  - `createdById` (integer): The id of the user that created the appointment. (Note: This can only be set by admins, otherwise the currently logged in user's ID is used.)
  - `typeId` (integer): The Follow Up Boss appointment type identifier.
  - `outcomeId` (integer): The Follow Up Boss appointment outcome identifier.
- RESPONSE 200 example: {
   "id":13854,
   "created":"2020-09-04T15:13:18Z",
   "updated":"2020-09-04T15:13:18Z",
   "createdById":1,
   "updatedById":1,
   "title":"Lunch",
   "description":"Tom and John Q. are having lunch. Gotta try the new \"impossible\" burger",
   "start":"2020-09-04T16:00:00Z",
   "end":"2020-09-04T17:00:00Z",
   "allDay":false,
   "originFub":true,
   "location":"",
   "invitees":[
      {
     
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/appointmenttypes-get.md
# /appointmentTypes

List appointment types.

### GET /appointmentTypes  — List appointment types.
- [query] `sort` (string) default=orderWeight: The sort order can be one of the following: `id`, `name`, `orderWeight` (Note: Prefix the string with a minus (`-`) to sort in descending order (e.g., `-orderWeight`)).
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "appointmenttypes",
    "offset": 0,
    "limit": 10,
    "total": 2,
    "next": null,
    "nextLink": null
  },
  "appointmenttypes": [
    {
      "id": 1,
      "name": "Buyer consultation",
      "orderWeight": 1000
    },
    {
      "id": 2,
      "name": "Listing",
      "orderWeight": 2000
    }
  ]
}
- RESPONSE 400 example: {
  "errorMessage": "Invalid field(s) in the fields parameter: [list of invalid fields]"
}


=================== https://docs.followupboss.com/reference/appointmenttypes-id-delete.md
# /appointmentTypes/:id

Delete an appointment type.

> 🚧 Restricted Access
>
> Deleting an appointment type is restricted to the account owner.

### DELETE /appointmentTypes/{id}  — Delete an appointment type.
- [path] `id` (integer) REQUIRED: The id of the appointment type.
- [query] `assignTypeId` (integer) REQUIRED: The typeId to reassign existing appointments.
- RESPONSE 200 example: []
- RESPONSE 400 example: {
  "errorMessage": "Missing 'assignTypeId' field."
}
- RESPONSE 400 example: {
  "errorMessage": "No type found for given 'assignTypeId' field."
}
- RESPONSE 403 example: {
  "errorMessage": "You do not have access to delete appointment types."
}
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/appointmenttypes-id-get.md
# /appointmentTypes/:id

Retrieve an appointment type by ID

### GET /appointmentTypes/{id}  — Retrieve an appointment type by ID
- [path] `id` (integer) REQUIRED: The id of the appointment type.
- RESPONSE 200 example: {
  "id": 3,
  "name": "Test Type",
  "orderWeight": 1000
}
- RESPONSE 400 example: {
    "errorMessage": "Invalid field(s) in the fields parameter: [list of invalid fields]"
}
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/appointmenttypes-id-put.md
# /appointmentTypes/:id

Update an appointment type.

> 🚧 Restricted Access
>
> Updating an appointment type is restricted to the account owner.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### PUT /appointmentTypes/{id}  — Update an appointment type.
- [path] `id` (integer) REQUIRED: ID of the appointment type.
- BODY (application/json):
  - `name` (string): The name of the appointment type.
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
  "id": 3,
  "name": "Test Type",
  "orderWeight": 1000
}
- RESPONSE 400 example: {
  "errorMessage": "Invalid fields in the request body: [list of invalid fields]"
}
- RESPONSE 400 example: {
    "errorMessage": "Expected field '[fieldName]' to be of data type [dataType]."
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to update appointment types."
}
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/appointmenttypes-post.md
# /appointmentTypes

Create an appointment type.

> 🚧 Restricted Access
>
> Creating new appointment types is restricted to the account owner.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### POST /appointmentTypes  — Create an appointment type.
- BODY (application/json):
  - `name` (string): The name of the appointment type.
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
  "id": 3,
  "name": "Test Type",
  "orderWeight": 1000
}
- RESPONSE 400 example: {
  "errorMessage": "Invalid fields in the request body: [list of invalid fields]"
}
- RESPONSE 400 example: {
    "errorMessage": "Expected field '[fieldName]' to be of data type [dataType]."
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to update appointment types."
}


=================== https://docs.followupboss.com/reference/authentication.md

# Authentication and Authorization

# Overview

There are two ways to authenticate and authorize with Follow Up Boss: OAuth and Basic Authentication via API Key.

> ❗️ Basic vs Bearer Authentication
>
> If you are using API Keys to authenticate with Follow Up Boss, you **must** use Basic Authentication.
>
> If you are using OAuth to authenticate with Follow Up Boss, you **must** use Bearer Authentication.

# OAuth

Head over to our [OAuth guide](https://docs.followupboss.com/docs/getting-started-with-oauth) to get started!

# Basic Authentication

Every user in Follow Up Boss has a unique API Key that can be obtained from "Admin" -> "API" screen. External applications use API Key to get authenticated and read/update data in Follow Up Boss on the user's behalf.

Authentication is done with [HTTP Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) over HTTPS. Use API Key as the username and leave the password blank (or you can put any value as password if your HTTP client requires it).

> 🚧 Expired accounts and Authentication
>
> Note that when an account expires, it enters a grace period, however the API key remains valid. Some endpoints may still be active so that there is no data loss (e.g. new lead POST to /v1/events) however the account may be in a locked down state and will receive a [**403 Forbidden**](https://en.wikipedia.org/wiki/HTTP_403) response for most other requests.

Follow Up Boss API is available via HTTPS only. This ensures that API Key is always encrypted during transmission. API Key provides the same privileges as the user's login credentials and should be handled securely.

API key has the same access level as the user whom the key belongs to. For example, agent's API key allows access only to people assigned to that agent while broker's API key allows access to all people in the account.

# Permission Levels

* **Owner**: The account owner has access to everything in the account.
* **Admin (Broker)**: An admin has most access to everything but they can not access Webhooks.
* **Agent**: An agent only has access to the contacts they are assigned to, or are a collaborator on. They will also have restricted access to things like action plans.
* **Lender**: Similar to an agent, a Lender only has access to contacts they are assigned to, or are a collaborator on, and they will have even fewer actions they can do than an agent.

=================== https://docs.followupboss.com/reference/automations.md
# /automations

Get a list of Automations

> 📘 This API endpoint is for customers with Automations 2.0 only

> 🚧 Restricted Access
>
> Automations 2.0 routes are restricted to registered systems only.

### GET /automations  — Get a list of Automations
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `status` (string): Search for Automations with one of the following statuses: `Active`, `Disabled`, or `Deleted`.
- [query] `enabledOnly` (boolean) default=False: Return only automations that are enabled
- [query] `manualOnly` (boolean) default=False: Return automations that contain a manual trigger
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/automationsid.md
# /automations/:id

Retrieve an Automation by ID.

> 📘 This API endpoint is for customers with Automations 2.0 only

> 🚧 Restricted Access
>
> Automations 2.0 routes are restricted to registered systems only.

### GET /automations/{id}  — Retrieve an Automation by ID.
- [path] `id` (integer) REQUIRED: ID of the Automation to retrieve
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/automationspeople-1.md
# /automationsPeople

Manually trigger an Automation for a specified Person.

> 📘 This API endpoint is for customers with Automations 2.0 only

> 🚧 Restricted Access
>
> Automations 2.0 routes are restricted to registered systems only.

### POST /automationsPeople  — Manually trigger an Automation for a specified Person.
- BODY (application/json):
  - `automationId` (integer): ID of an existing Automation to trigger
  - `personId` (integer): ID of an existing Person for which to run the Automation
- RESPONSE 201 example: {
    "id": 2,
    "created": "2023-08-09T21:36:05Z",
    "updated": "2023-08-09T21:36:05Z",
    "createdById": -1,
    "updatedById": -1,
    "createdBy": "Follow Up Boss",
    "updatedBy": "Follow Up Boss",
    "personId": 2,
    "automationId": 1,
    "status": "Completed",
    "automationName": "Test Automation"
}
- RESPONSE 400 example: {"errorMessage":"Invalid value for 'personId' field, no such person or you don't have permission to access this person"}


=================== https://docs.followupboss.com/reference/automationspeople.md
# /automationsPeople

Get a list of pairings of Automations and the People on which they have or will be run.

> 📘 This API endpoint is for customers with Automations 2.0 only

> 🚧 Restricted Access
>
> Automations 2.0 routes are restricted to registered systems only.

### GET /automationsPeople  — Get a list of pairings of Automations and the People on which they have or will be run.
- [query] `personId` (integer): ID of a Person (i.e. to view only pairings for that Person)
- [query] `automationId` (integer): ID of an Automation (i.e. to view only pairings for that Automation)
- [query] `status` (string enum['"Initial"', '"Running"', '"Paused"', '"Completed"']): Automation Status to filter by, i.e. one of "Initial", "Running", "Paused", or "Completed"
- RESPONSE 200 example: {
    "_metadata": {
        "collection": "automationsPeople",
        "offset": 0,
        "limit": 10,
        "total": 2,
        "next": null,
        "nextLink": null
    },
    "automationsPeople": [
        {
            "id": 2,
            "created": "2023-08-09T21:36:05Z",
            "updated": "2023-08-09T21:36:05Z",
            "createdById": -1,
            "updatedById": -1,
      
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/automationspeopleid-1.md
# /automationsPeople/:id

Retrieve an Automation-Person pairing.

> 📘 This API endpoint is for customers with Automations 2.0 only

> 🚧 Restricted Access
>
> Automations 2.0 routes are restricted to registered systems only.

### GET /automationsPeople/{id}  — Retrieve an Automation-Person pairing.
- [path] `id` (integer) REQUIRED: ID of the Automation-Person pairing
- RESPONSE 200 example: {
    "id": 2,
    "created": "2023-08-09T21:36:05Z",
    "updated": "2023-08-09T21:36:05Z",
    "createdById": -1,
    "updatedById": -1,
    "createdBy": "Follow Up Boss",
    "updatedBy": "Follow Up Boss",
    "personId": 2,
    "automationId": 1,
    "status": "Completed",
    "automationName": "Test Automation"
}
- RESPONSE 404 example: 


=================== https://docs.followupboss.com/reference/automationspeopleid.md
# /automationsPeople/:id

Pause or unpause an Automation for a Person.

> 📘 This API endpoint is for customers with Automations 2.0 only

> 🚧 Restricted Access
>
> Automations 2.0 routes are restricted to registered systems only.

### PUT /automationsPeople/{id}  — Pause or unpause an Automation for a Person.
- [path] `id` (integer) REQUIRED: ID of the Automation-Person pairing (i.e. as returned by GET /automationsPeople or POST /automationsPeople)
- BODY (application/json):
  - `status` (string enum['"Running"', '"Paused"']): Automation Status, i.e. "Paused" to pause the Automation or "Running" to unpause it
- RESPONSE 200 example: {
    "id": 2,
    "created": "2023-08-09T21:36:05Z",
    "updated": "2023-08-09T21:36:05Z",
    "createdById": -1,
    "updatedById": -1,
    "createdBy": "Follow Up Boss",
    "updatedBy": "Follow Up Boss",
    "personId": 2,
    "automationId": 1,
    "status": "Completed",
    "automationName": "Test Automation"
}
- RESPONSE 400 example: {"errorMessage":"Invalid value for 'status' field"}


=================== https://docs.followupboss.com/reference/calls-get.md
# /calls

Search for calls.

> 🚧 Restricted Results
>
> Some call data is not accessible via API and is only visible within the Follow Up Boss application.

> 📘 Person ID
>
> A `personId` may be sent or returned as `0`, which indicates that this is a call from an unknown person to a number associated to the Follow Up Boss account.

### GET /calls  — Search for calls.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `personId` (integer): Filter calls by a person ID.
- [query] `phone` (string): Filter calls based on the phone number of a specific person or lead. This will finds calls regardless of whether they were incoming or outgoing.
- [query] `toNumber` (string): Filter calls based on the number that the call was to.
- [query] `fromNumber` (string): Filter calls based on the number that the call was from.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "calls",
    "offset": 0,
    "limit": 10,
    "total": 5
  },
  "calls": [
    {
      "id": 18,
      "created": "2014-06-20T23:28:51Z",
      "updated": "2014-08-12T17:24:22Z",
      "createdById": 4,
      "updatedById": 4,
      "phone": "555-405-0815",
      "personId": 12254,
      "userId": 4,
      "userName": "Agent White",
      "note": "A note about
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/calls-id-get.md
# /calls/:id

Retrieve a call by id.

> 🚧 Restricted Results
>
> Some call data is not accessible via API and is only visible within the Follow Up Boss application.

### GET /calls/{id}  — Retrieve a call by id.
- [path] `id` (integer) REQUIRED: The ID of a call.
- RESPONSE 200 example: {
  "id": 18,
  "created": "2014-06-20T23:28:51Z",
  "updated": "2014-08-12T17:24:22Z",
  "createdById": 4,
  "updatedById": 4,
  "phone": "555-405-0815",
  "personId": 12254,
  "userId": 4,
  "userName": "Agent White",
  "note": "A note about the call",
  "outcome": "Left Message",
  "isIncoming": false,
  "duration": 63,
  "ringDuration": 5,
  "recordingUrl": "Content is hidden for privacy reaso
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/calls-id-put.md
# /calls/:id

Update a call.

> 🚧 Update Access
>
> You can only update calls created by the account/system that is calling the API itself. It is not possible to update calls created by another source.

### PUT /calls/{id}  — Update a call.
- [path] `id` (integer) REQUIRED: The ID of a call.
- BODY (application/json):
  - `personId` (integer): The ID of a person associated with this call.
  - `phone` (string): The phone number this call was made to or from.
  - `isIncoming` (boolean): Sets this as an incoming or outgoing call.
  - `note` (string): The log message entered for this call.
  - `outcome` (string): The outcome of the call, which can be one of `Interested`, `Not Interested`, `Left Message`, `No Answer`, `Busy` or `Bad Number`.
  - `duration` (integer): Length of the call in seconds.
  - `toNumber` (string): The phone number this call was made to.
  - `fromNumber` (string): The phone number this call was made from.
  - `userId` (integer): The ID of the user that made or received a call. (This can only be set by administrators, otherwise the currently logged in user's ID is used.)
  - `recordingUrl` (string): The URL for the call recording.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/calls-post.md
# /calls

Add a call.

### POST /calls  — Add a call.
- BODY (application/json):
  - `personId` (integer) REQUIRED: The ID of a person associated with this call.
  - `phone` (string) REQUIRED: The phone number this call was made to or from.
  - `isIncoming` (boolean) REQUIRED: Sets this as an incoming or outgoing call.
  - `note` (string): The log message entered for this call.
  - `outcome` (string): The outcome of the call, which can be one of `Interested`, `Not Interested`, `Left Message`, `No Answer`, `Busy` or `Bad Number`.
  - `duration` (integer): Length of the call in seconds.
  - `toNumber` (string): The phone number this call was made to.
  - `fromNumber` (string): The phone number this call was made from.
  - `userId` (integer): The ID of the user that made or received a call. (This can only be set by administrators, otherwise the currently logged in user's ID is used.)
  - `recordingUrl` (string): The URL for the call recording.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/common-filters.md

# Common Filters and Parameters

# Overview

Most endpoints that return multiple items can be filtered with the following common query parameters.

# Parameters

> 📘 Limited HTTP Request Types
>
> These common parameters will work on the majority of our `GET` API endpoints.

## sort

Providing a `sort` parameter with a given field name in the data being returned will sort the data by that field. To sort descending, you can add a `-` in front of the field name (e.g., `sort=-createdAt`).

## limit

Setting the `limit` parameter will increase the number of records returned per `GET` request. The maximum is `100`.

# Filters

## ids

Add the `id` or `ids` argument to a collection if you want to request multiple records of which you know their IDs.   For example, if you want to retrieve the names of users 14 and 23 in a single request, you can request:

```http HTTP
GET /v1/users?ids=14,23&fields=id,name
```

## idLessThan, idGreaterThan

Add the `idLessThan` or `idGreaterThan` query parameters if you wish to limit the records to a certain range.  You can specify either of them alone, or both at the same time.  For example to get all contacts with IDs between 1000 and 2000:

```http
GET /v1/people?fields=id,name&idGreaterThan=1000&idLessThan=2000
```

## createdAfter, createdBefore

Use the `createdAfter` and `createdBefore` parameters if you wish to limit the records returned to those created in a certain date range.  You can specify either of them alone, or both at the same time.  These parameters expect an ISO-8601 date in the UTC timezone.  For example to get all contacts created after July 1st, 2021:

```http
GET /v1/people?fields=id,name,created&createdAfter=2021-07-01T04:00:00Z
```

## updatedAfter, updatedBefore

Use the `updatedAfter` and `updatedBefore` parameters to limit the records return to those updated in a certain date range.  You can specify either of them alone, or both of them at the same time.  These parameters expect an ISO-8601 date in the UTC timezone.

```http
GET /v1/people?fields=id,name,updated&updatedAfter=2021-07-01T04:00:00Z
```

> 📘 Updated Field Accuracy
>
> The updated fields may not be accurate for all records, as the field is only updated when the record itself changes, but related information may be stored in separate records.  For example, if a note is added to a contact, that note is a distinct record, so the contact's updated field will not change.

=================== https://docs.followupboss.com/reference/common-issues.md

# Common Issues

# Overview

While building an integration with Follow Up Boss APIs, issues occasionally arise that are not related to one specific endpoint but require an overall understanding of how internal processes function within Follow Up Boss. This page aims to help alleviate some of these issues upfront to assist in building your integration as quickly as possible.

# Access to Newly Created People

After a new person is created in Follow Up Boss via either the `events` or `people` endpoints ([use `events` for this primarily](send-in-a-lead)), there is a small window in which that person is not immediately accessible via other endpoints until the person has been assigned to an agent. This means that if you create a person, and then try and immediately perform an action (such as creating a new `note` or `call`), that request might fail.

To prevent this, you will need to create a delay between the creation of the person and the subsequent action. The delay required will depend a lot on the type of agent assignment the account uses (i.e., Round Robin, First to Claim, etc.) and any other lead flow routing rules in place. It's best to start small and slowly increase the delay until you find the correct timing if you do not have direct access to your users' account settings to get the exact configuration details.

# Custom Field Naming

Many customers and integrations take advantage of the custom field capability in Follow Up Boss. In order to reference these fields in `GET`, `POST` and `PUT` queries to various endpoints (such as [/people](people-get)), it is important to understand how the names are generated.

If a customer created a field called "Close Date" in FUB, the custom field to reference would be `customCloseDate`. You can make a request to [GET /customfields](customfields-get) to see the list of custom fields and their names.

> ❗️ Custom Fields names are case sensitive
>
> Custom fields names are case sensitive, meaning that it is important to note that the exact correct case is being used when referencing the fields.

# Authentication Issues

The most common issue with authenticating with Follow Up Boss is using the incorrect type. API Keys use Basic Authentication and OAuth uses Bearer Authentication. For more details on authentication, go [here](authentication).

=================== https://docs.followupboss.com/reference/customfields-get.md
# /customFields

List all custom fields.

Custom fields can be used when adding an event, adding a person, or updating a person. The account owner can add/edit/delete custom fields in Follow Up Boss (see [using custom fields](https://help.followupboss.com/hc/en-us/articles/360015273733) for more info).

For each custom field the values returned are:

* `label`: The label used for this custom field in the Follow Up Boss web and mobile applications.
* `name`: The name of this custom field in API responses.  This is also name you should use if you wish to update a custom field on a person or send in a custom field with a new lead.
* `type`: Currently we support four types of custom fields (`text`, `date`, `number`, `dropdown`).
* `isRecurring`: This boolean is only used for date fields and indicates whether the field is used for recurring dates (e.g., birthdays, anniversaries) or a specific date (e.g., a closing date).
* `choices`: If the field is a dropdown, then this list of choices are the only valid values for the custom field.

> 📘 How to send and reference Custom Fields
>
> When sending custom field data via a [POST to /v1/events](https://docs.followupboss.com/docs/events-get) or a [PUT to /v1/people](https://docs.followupboss.com/docs/people-id-put) make sure to use the `name` field returned here. Similarly, this applies to retrieving custom fields from the respective GET requests.
>
> For example, to send a value for a field named "Close Price", use the field name `customClosePrice` in the request body.

### GET /customFields  — List all custom fields.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip, before starting to return results.
- [query] `label` (string): Find custom field by label.
- [query] `sort` (string enum['id', 'name', 'orderWeight']) default=id (desc): Sorts results based on the provided field name. Prepending the field with a minus sign (-) sorts the results in descending order.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "customfields",
    "offset": 0,
    "limit": 10,
    "total": "4"
  },
  "customfields": [
    {
      "id": 2,
      "label": "Birthday",
      "name": "customBirthday",
      "type": "date",
      "isRecurring": true
    },
    {
      "id": 4,
      "label": "Facebook",
      "name": "customFacebook",
      "type": "text"
    },
    {
      "id": 6,
      "


=================== https://docs.followupboss.com/reference/customfields-id-delete.md
# /customFields/:id

Delete a custom field.

> 🚧 Restricted Access
>
> This endpoint is accessible to account owners only.

### DELETE /customFields/{id}  — Delete a custom field.
- [path] `id` (string) REQUIRED: The ID of the custom field.
- RESPONSE 200 example: 
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/customfields-id-get.md
# /customFields/:id

Get a custom field by id.

### GET /customFields/{id}  — Get a custom field by id.
- [path] `id` (integer) REQUIRED: The ID of a custom field.
- RESPONSE 200 example: {
    "id": 6,
    "label": "Looking for",
    "name": "customLookingFor",
    "type": "dropdown",
    "choices": [
        "Apartment",
        "Townhouse",
        "Detached House"
    ]
}


=================== https://docs.followupboss.com/reference/customfields-id-put.md
# /customFields/:id

Update a custom field.

> 🚧 Restricted Access
>
> This endpoint is accessible to account owners only.

> 📘 Field Type
>
> You cannot change the `type` of a field after it has been created. You will need to delete, then recreate the field.

### PUT /customFields/{id}  — Update a custom field.
- [path] `id` (integer) REQUIRED: The ID of the custom field.
- BODY (application/json):
  - `label` (string): The user-friendly name of the custom field (e.g., "Anniversary").
  - `choices` (array<string>): Array of options related to a custom field of type `dropdown`.
  - `isRecurring` (boolean) default=False: Sets whether a date field occurs every year (e.g., birthdays, anniversaries, etc.). (Note: This is only set and returned for `date` custom fields.)
  - `hideIfEmpty` (boolean) default=False: When viewing a person, we will hide this field if it is empty.
  - `orderWeight` (integer) default=0: A weighted integer for the field to assign values for custom sorting.
  - `dropdownChoiceMap` (array<integer>) default=[None]: An optional mapping that points previous dropdown choices (keys) to their new positions (values). This is used to track when options get moved or renamed. If items are missing from the keys, they will be removed. If the mapping is not supplied, then this endpoint will try to determine if items have been moved or renamed on its own.
- RESPONSE 200 example: {
  "id": 2,
  "label": "Birthday",
  "name": "customBirthday",
  "type": "date",
  "isRecurring": false
}


=================== https://docs.followupboss.com/reference/customfields-post.md
# /customFields

Create a custom field.

> 🚧 Restricted Access
>
> This endpoint is accessible to account owners only.

### POST /customFields  — Create a custom field.
- BODY (application/json):
  - `label` (string) REQUIRED: The user-friendly name of the custom field (e.g., "Anniversary").
  - `type` (string enum['text', 'date', 'number', 'dropdown']) REQUIRED: The type of custom field.
  - `choices` (array<string>): Array of options related to a custom field of type `dropdown`.
  - `isRecurring` (boolean) default=False: Whether a date field occurs every year (e.g. birthdays, anniversaries, etc.). (Note: This is only set and returned for `date` custom fields.)
  - `hideIfEmpty` (boolean) default=False: When viewing a person, we will hide this field if it is empty.
  - `orderWeight` (integer) default=0: A weighted integer for the field to assign values for custom sorting.
- RESPONSE 200 example: {
  "id": 2,
  "label": "Birthday",
  "name": "customBirthday",
  "type": "date",
  "isRecurring": true
}


=================== https://docs.followupboss.com/reference/dealattachments-id-delete.md
# /dealAttachments/:id

Delete a deal attachment.

> ❗️ Restricted - Registered Systems Only
>
> External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).

### DELETE /dealAttachments/{id}  — Delete a deal attachment.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- [path] `id` (integer) REQUIRED: The id of the attachment.
- RESPONSE 200 example: {}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this endpoint."
}
- RESPONSE 404 example: {
    "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/dealattachments-id-get.md
# /dealAttachments/:id

Get a deal attachment by id.

> ❗️ Restricted - Registered Systems Only
>
> External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).

> 📘 Response Limitations
>
> The attachments returned are limited to those **created by your registered system**. No other attachments will be returned.

### GET /dealAttachments/{id}  — Get a deal attachment by id.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- [path] `id` (integer) REQUIRED: The id of the attachment.
- RESPONSE 201 example: {
    "dealId": 1,
    "fileName": "test.jpg",
    "fileSize": null,
    "id": 10,
    "mimeType": "link",
    "uri": "https://test.com/myfile",
    "thumbnailUri": null,
    "status": "created",
    "createdAt": "2022-11-16T19:09:45Z",
    "createdById": 1,
    "createdByName": "Olivia Admin"
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this endpoint."
}


=================== https://docs.followupboss.com/reference/dealattachments-id-put.md
# /dealAttachments/:id

Update a deal attachment.

> ❗️ Restricted - Registered Systems Only
>
> External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).

> 🚧 URI - File Location
>
> The URI should be a link to a file location stored **outside** of Follow Up Boss. If a URI is not provided, the API will treat the request as an attempt to upload a file to our servers and return a 403.

### PUT /dealAttachments/{id}  — Update a deal attachment.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- [path] `id` (string) REQUIRED: The id of the attachment.
- BODY (application/json):
  - `dealId` (integer) REQUIRED: The id of the deal you want to update the attachment to.
  - `uri` (string) REQUIRED: The URI of an **externally** hosted file.
  - `fileName` (string) REQUIRED: Name of the file.
  - `fileSize` (integer): Size of the file in bytes.
- RESPONSE 201 example: {
    "dealId": 1,
    "fileName": "test.jpg",
    "fileSize": null,
    "id": 10,
    "mimeType": "link",
    "uri": "https://test.com/myfile",
    "thumbnailUri": null,
    "status": "created",
    "createdAt": "2022-11-16T19:09:45Z",
    "createdById": 1,
    "createdByName": "Olivia Admin"
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this endpoint."
}


=================== https://docs.followupboss.com/reference/dealattachments-post.md
# /dealAttachments

Add an attachment to a deal.

> ❗️ Restricted - Registered Systems Only
>
> External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).

> 🚧 URI - File Location
>
> The URI should be a link to a file location stored **outside** of Follow Up Boss. If a URI is not provided, the API will treat the request as an attempt to upload a file to our servers and return a 403.

### POST /dealAttachments  — Add an attachment to a deal.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- BODY (application/json):
  - `dealId` (integer) REQUIRED: The id of the deal you want to add an attachment to.
  - `uri` (string) REQUIRED: The URI of an **externally** hosted file.
  - `fileName` (string) REQUIRED: Name of the file.
  - `fileSize` (integer): Size of the file in bytes.
- RESPONSE 201 example: {
    "dealId": 1,
    "fileName": "test.jpg",
    "fileSize": null,
    "id": 10,
    "mimeType": "link",
    "uri": "https://test.com/myfile",
    "thumbnailUri": null,
    "status": "created",
    "createdAt": "2022-11-16T19:09:45Z",
    "createdById": 1,
    "createdByName": "Olivia Admin"
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this endpoint."
}


=================== https://docs.followupboss.com/reference/dealcustomfields-get.md
# /dealCustomFields

List all deals custom fields available in your account.

This endpoint will give you a list of all deal custom fields available in the account you're connected to.

For each custom field the values returned are:

* *label:* The label used for this custom field in the Follow Up Boss web and mobile apps
* *name:* The name of this custom field in API responses.  This is also name you should use if you wish to update a custom field on a person or send in a custom field with a new lead.
* *type:* Currently we support four types of custom fields (`text`, `date`, `number`, `dropdown`).
* \*choices:" If the field is a dropdown, then this list of choices are the only valid values for the custom field.
* *order\_weight:* The value used during sorting to order the fields in the user interface.
* *hide\_if\_empty:* Determines whether the field is hidden when empty.
* *read\_only*: Determines whether the field is read only.

> 📘 How to send in Deals Custom Field data
>
> When sending deals custom field data via POST to [/v1/dealCustomFields](dealcustomfields-post) or PUT to  [/v1/dealCustomFields/:id](dealcustomfields-id-put) make sure to use the `name` field returned here.  So for example to send a value for "Close Price", use the field name `customClosePrice` in the request body.

### GET /dealCustomFields  — List all deals custom fields available in your account.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip, before starting to return results.
- [query] `label` (string): Find custom field by label.
- [query] `sort` (string enum['id', 'name', 'orderWeight']) default=id (desc): Sorts results based on the provided field name. Prepending the field with a minus sign (-) sorts the results in descending order.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "dealCustomfields",
    "offset": 0,
    "limit": 10,
    "total": "4"
  },
  "dealCustomfields": [
    {
      "id": 2,
      "label": "Birthday",
      "name": "customBirthday",
      "type": "date",
      "orderWeight": 1,
      "hideIfEmpty": true,
      "readOnly": false
    },
    {
      "id": 4,
      "label": "Facebook",
      "name": "customFacebook",


=================== https://docs.followupboss.com/reference/dealcustomfields-id-delete.md
# /dealCustomFields/:id

Delete a deals custom field.

> 🚧 Require owner permissions
>
> Only the owner has access to delete deals custom fields.

### DELETE /dealCustomFields/{id}  — Delete a deals custom field.
- [path] `id` (integer) REQUIRED: The id of the deals custom field.
- RESPONSE 200 example: 
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/dealcustomfields-id-get.md
# /dealCustomFields/:id

Get a deals custom field by ID.

### GET /dealCustomFields/{id}  — Get a deals custom field by ID.
- [path] `id` (integer) REQUIRED: The id of a deals custom field.
- RESPONSE 200 example: {
    "id": 6,
    "label": "Looking for",
    "name": "customLookingFor",
    "type": "dropdown",
    "choices": [
        "Apartment",
        "Townhouse",
        "Detached House"
    ],
    "orderWeight": 1,
    "hideIfEmpty": true,
    "readOnly": false
}


=================== https://docs.followupboss.com/reference/dealcustomfields-id-put.md
# /dealCustomFields/:id

Update a deals custom field.

> 🚧 Require owner permissions
>
> Only the owner has access to modify deals custom fields.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### PUT /dealCustomFields/{id}  — Update a deals custom field.
- [path] `id` (integer) REQUIRED: The id of the deals custom field.
- BODY (application/json):
  - `label` (string) REQUIRED: The user-friendly name of the custom field (e.g., "Anniversary").
  - `type` (string enum['text', 'date', 'number', 'dropdown']) REQUIRED: The type of deals custom field.
  - `choices` (array<string>): Array of options related to a deals custom field of type `Dropdown`.
  - `isRecurring` (boolean) default=False: Whether a date field occurs every year (e.g. birthdays, anniversaries, etc.).
  - `hideIfEmpty` (boolean) default=False: Sets whether we will hide this field if it is empty.
  - `orderWeight` (integer) default=0: A weighted integer for the field to assign values for custom sorting.
  - `dropdownChoiceMap` (array<integer>) default=[None]: An optional mapping that points previous dropdown choices (keys) to their new positions (values). This is used to track when options get moved or renamed. If items are missing from the keys, they will be removed. If the mapping is not supplied, then this endpoint will try to determine if items have been moved or renamed on its own.
  - `readOnly` (boolean) default=False: Sets whether the field is read only or not.
- RESPONSE 200 example: {
  "id": 2,
  "label": "Birthday",
  "name": "customBirthday",
  "type": "date",
  "isRecurring": false,
  "orderWeight": 1,
  "hideIfEmpty": true,
  "readOnly": false
}


=================== https://docs.followupboss.com/reference/dealcustomfields-post.md
# /dealCustomFields

Create a deals custom field.

> 🚧 Require owner permissions
>
> Only the owner has access to create deals custom fields.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### POST /dealCustomFields  — Create a deals custom field.
- BODY (application/json):
  - `label` (string) REQUIRED: The user-friendly name of the custom field (e.g., "Anniversary").
  - `type` (string enum['text', 'date', 'number', 'dropdown']) REQUIRED: The type of deals custom field.
  - `choices` (array<string>): Array of options related to a deals custom field of type `Dropdown`.
  - `isRecurring` (boolean) default=False: Whether a date field occurs every year (e.g. birthdays, anniversaries, etc.).
  - `hideIfEmpty` (boolean) default=False: Sets whether we will hide this field if it is empty.
  - `orderWeight` (integer) default=0: A weighted integer for the field to assign values for custom sorting.
  - `readOnly` (boolean) default=False: Determines whether a deals custom field is read only.
- RESPONSE 200 example: {
  "id": 2,
  "label": "Birthday",
  "name": "customBirthday",
  "type": "date",
  "isRecurring": true,
  "orderWeight": 1,
  "hideIfEmpty": true,
  "readOnly": false
}


=================== https://docs.followupboss.com/reference/deals-get.md
# /deals

Search for deals.

> 🚧 Deals Custom Fields
>
> Note that any [Deals Custom Fields](dealcustomfields-get) that have been created will also be returned using the `name` property and associated value (text, date, integer, or dropdown selection) of the deals custom field in the response. This is denoted sample response as the `customField` properties.

### GET /deals  — Search for deals.
- [query] `pipelineId` (integer): Return deals for a specific pipeline only.
- [query] `userId` (integer): Return a list of deals for a specific user.
- [query] `personId` (integer): Return a list of deals for a specific person.
- [query] `includeDeleted` (integer): Set to `1` to include deals with a status of `Deleted` in the results.
- [query] `includeArchived` (integer): Set to `1` to include deals with a status of `Archived` in the results.
- [query] `status` (string enum['Active', 'Archived', 'Deleted']): Only return deals with a status of `Active`, `Archived`, or `Deleted`.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "deals",
    "offset": 0,
    "limit": 10,
    "total": 1,
    "totalByStageId": {
      "5": 1
    }
  },
  "deals": [
    {
      "pipelineId": 100,
      "stageId": 5,
      "enteredStageAt": "2017-04-14T18:31:20Z",
      "id": 2146,
      "name": "adding deal",
      "type": 0,
      "status": "Active",
      "price": 216000,
      "createdAt": "2017-04-14T
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/deals-id-delete.md
# /deals/:id

Delete a deal.

### DELETE /deals/{id}  — Delete a deal.
- [path] `id` (integer) REQUIRED: The id of the deal.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/deals-id-get.md
# /deals/:id

Retrieve a deal by id.

> 🚧 Deals Custom Fields
>
> Note that any [Deals Custom Fields](dealcustomfields-get) that have been created will also be returned using the `name` property and associated value (text, date, integer, or dropdown selection) of the deals custom field in the JSON response. This is denoted sample response as the 'customField' properties.

### GET /deals/{id}  — Retrieve a deal by id.
- [path] `id` (integer) REQUIRED: The id of the deal.
- RESPONSE 200 example: {
      "pipelineId": 100,
      "stageId": 16,
      "enteredStageAt": "2017-04-14T18:31:20Z",
      "id": 2146,
      "name": "adding deal",
      "type": 0,
      "status": "Active",
      "price": 216000,
      "createdAt": "2017-04-14T18:31:19Z",
      "orderWeight": 6000,
      "description": "A deal for an example",
      "projectedCloseDate": null,
      "people": [
        {
          "id
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/deals-id-put.md
# /deals/:id

Update a deal.

> 🚧 Deals Custom Fields
>
> Any custom fields that have been created can also have their values updated via this method. For instance, if you had a custom field called "customField1", you could pass that in as an argument with an associated value in the body parameters for the POST request.
>
> You can see how this would appear with multiple custom fields in the sample response object.

> 🚧 Empty `userIds` Argument
>
> Sending a request with an empty `userIds` argument will create a deal that no agents can see. This may be intentional, depending on your use case, but note that agents will not be able to access the deal unless their user ID is explicitly included. Admins and owners can still see all deals.

### PUT /deals/{id}  — Update a deal.
- [path] `id` (integer) REQUIRED: The id of the deal.
- BODY (application/json):
  - `name` (string): Name of the deal.
  - `stageId` (integer): The stage that this deal should be assigned to.
  - `description` (string): Description of the deal.
  - `peopleIds` (array<integer>): A list of person ids that should be part of this deal.
  - `userIds` (array<integer>): A list of user ids that should be part of this deal.
  - `price` (integer): The price associated with this deal.
  - `projectedCloseDate` (string): Projected close date of this deal.
  - `commissionValue` (integer): Commission value to assign to this deal.
  - `agentCommision` (integer): Commission value for an agent split.
  - `teamComission` (integer): Commission value for a team split.
  - `earnestMoneyDueDate` (string): Earnest Money Due Date for this deal.
  - `mutualAcceptanceDate` (string): Mutual Acceptance Date for this deal.
  - `dueDiligenceDate` (string): Due Diligence Date for this deal.
  - `finalWalkThroughDate` (string): Final Walk Through Date for this deal.
  - `possessionDate` (string): Possession Date for this deal.
- RESPONSE 200 example: {
	"name": "New Deal",
	"stageId": 2,
  "description": "The best deal",
  "projectedCloseDate": "2001-01-02",
	"earnestMoneyDueDate": "2001-01-01T05:00:00.000Z",
  "mutualAcceptanceDate": "2001-01-01T05:00:00.000Z",
  "dueDiligenceDate": "2001-01-01T05:00:00.000Z",
  "finalWalkThroughDate": "2001-01-01T05:00:00.000Z",
  "possessionDate": "2001-01-01T05:00:00.000Z",
  "price": 30,
  "peopleIds": [

- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/deals-post.md
# /deals

Add a deal.

> 🚧 Deals Custom Fields
>
> Any custom fields that have been created can also have their values set via this method. For instance, if you had a custom field called `customField1`, you could pass that in as an argument with an associated value in the body parameters for the POST request.
>
> You can see how this would appear with multiple custom fields in the sample response object.

> 🚧 Empty `userIds` Argument
>
> Sending a request with an empty `userIds` argument will create a deal that no agents can see. This may be intentional, depending on your use case, but note that agents will not be able to access the deal unless their user ID is explicitly included. Admins and owners can still see all deals.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### POST /deals  — Add a deal.
- BODY (application/json):
  - `name` (string) REQUIRED: Name of the deal.
  - `stageId` (integer) REQUIRED: The stage that this deal should be assigned to.
  - `description` (string): Description of the deal.
  - `peopleIds` (array<integer>): A list of person ids that should be part of this deal.
  - `userIds` (array<integer>): A list of user ids that should be part of this deal.
  - `price` (integer): The price associated with this deal.
  - `projectedCloseDate` (string): Projected close date of this deal.
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
  - `commissionValue` (integer): Commission value to assign to this deal.
  - `agentCommission` (integer): Commission split for the agent split.
  - `teamCommission` (integer): Commission split for the team split.
  - `earnestMoneyDueDate` (string): Earnest Money Due Date for this deal.
  - `mutualAcceptanceDate` (string): Mutual Acceptance Date for this deal.
  - `dueDiligenceDate` (string): Due Diligence Date for this deal.
  - `finalWalkThroughDate` (string): Final Walk Through Date for this deal.
  - `possessionDate` (string): Possession Date for this deal.
- RESPONSE 200 example: {
	"name": "Deal",
	"description": "A seller deal",
	"stageId": 1,
  "projectedCloseDate": "2022-01-27T05:00:00.000Z",
  "earnestMoneyDueDate": "2022-01-22T05:00:00.000Z",
  "mutualAcceptanceDate": "2022-01-23T05:00:00.000Z",
  "dueDiligenceDate": "2022-01-17T05:00:00.000Z",
  "finalWalkThroughDate": "2022-01-25T05:00:00.000Z",
  "possessionDate": "2022-01-27T05:00:00.000Z",
  "price": 30,
  "peop
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/embedded-apps.md

# Embedded Apps

# Overview / Getting Started

Embedded apps are a way to load your data into the Follow Up Boss UI. For more basic information, [see our basic overview](https://help.followupboss.com/hc/en-us/articles/360048843753) article. If you're ready to start building embedded apps, you will [need to request](https://help.followupboss.com/hc/en-us/articles/360048843753) access to this feature.

You will be creating a secure **https** URL that will be loaded into an `iframe`. The `iframe` has the following options set:

```html
<iframe sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads" style="height: 0px; display: none;"></iframe>
```

<br />

This page needs to include the following JavaScript snippet:

```html Include Snippet
<script type="text/javascript" src="https://eia.followupboss.com/embeddedApps-v1.0.0.js"></script>
```

We will call this URL with two query string parameters, **context** and **signature**. The context helps you understand what account, user, and person is being discussed. The signature is a way to verify that the request is from us.

# Context

Your URL needs to accept a context query param. It's a base64 encoded string that you can decode to understand the topic. Here is an example of what that context will look like:

> 🚧 URL Safe Base64 Decode
>
> For languages like Ruby, make sure to use the [urlsafe\_decode64](https://ruby-doc.org/stdlib-2.4.1/libdoc/base64/rdoc/Base64.html#method-i-urlsafe_decode64) method. Otherwise, you might get some invalid parsing.

```json Decoded Context
{
   "example": true,
   "debugState": "working",
   "context": "person",
   "account": {
      "id": 123456789,
      "domain": "example",
      "owner": {
         "name": "John Doe",
         "email": "j.doe@example.com"
      }
   },
   "person": {
      "id": 123,
      "firstName": "Melissa",
      "lastName": "Hartman",
      "emails": [
         {
            "value": "m.hartman@example.com",
            "type": "home",
            "status": "Not Validated",
            "isPrimary": 1
         }
      ],
      "phones": [
         {
            "value": "(888) 555-1234",
            "normalized": "8885551234",
            "type": "mobile",
            "status": "Not Validated",
            "isPrimary": 1
         }
      ],
      "stage": {
        "id": 12,
        "name": "Active Client"
      }
   },
   "user": {
      "id": 2,
      "name": "Louis Tully",
      "email": "louis@example.com"
   }
}
```
```text Base 64 Encoded
eyJleGFtcGxlIjp0cnVlLCJkZWJ1Z1N0YXRlIjoid29ya2luZyIsImNvbnRleHQiOiJwZXJzb24iLCJhY2NvdW50Ijp7ImlkIjoxMjM0NTY3ODksImRvbWFpbiI6ImV4YW1wbGUiLCJvd25lciI6eyJuYW1lIjoiVG9tIE1pbmNoIiwiZW1haWwiOiJ0b20ubWluY2hAZXhhbXBsZS5jb20ifX0sInBlcnNvbiI6eyJpZCI6MTIzLCJmaXJzdE5hbWUiOiJNZWxpc3NhIiwibGFzdE5hbWUiOiJIYXJ0bWFuIiwiZW1haWxzIjpbeyJ2YWx1ZSI6Im0uaGFydG1hbkBleGFtcGxlLmNvbSIsInR5cGUiOiJob21lIiwic3RhdHVzIjoiTm90IFZhbGlkYXRlZCIsImlzUHJpbWFyeSI6MX1dLCJwaG9uZXMiOlt7InZhbHVlIjoiKDg4OCkgNTU1LTEyMzQiLCJub3JtYWxpemVkIjoiODg4NTU1MTIzNCIsInR5cGUiOiJtb2JpbGUiLCJzdGF0dXMiOiJOb3QgVmFsaWRhdGVkIiwiaXNQcmltYXJ5IjoxfV19LCJ1c2VyIjp7ImlkIjoxLCJuYW1lIjoiSm9obiBEb2UiLCJlbWFpbCI6ImouZG9lQGV4YW1wbGUuY29tIn19
```

## Map Account & User Identification

Your application likely needs to be able to map your known accounts and users to Follow Up Boss accounts and users. To do this, you should look at using the [/identity API endpoint](https://docs.followupboss.com/reference/identity).

## Debug Contexts

To better help in your development, we have created some sample context states that your app can respond to. This will help us to evaluate your app, and it'll make it easier for you to test your application during development.

> 🚧 debugState & example
>
> `debugState` and `example` attributes are only passed in during previewing of the app. Live versions will not have these attributes. It's also used for us to monitor your app better. More on that below.

When you're filling out your app details, you'll be able to preview different context states.


These debug states are just for simulating various response formats. It's not required you have a specific UI for each of them. These different states allow you to simulate the UI states that your app needs. We will require the `working` state functions, but your app might not need a `user_not_found` state.

* **working:** This is the most common state, and the main reason people will be enabling your app. This debug state is required to demonstrate.
* **account\_not\_found:** If you fail to match up the provided account, this is your opportunity to help get them set up. You can provide links about how to get fully integrated with your system.
* **user\_not\_found:** If you need to also verify the user, this is a way for you to test against this state.
* **person\_not\_found:** If you don't have any information on the current person, then you would want to respond by saying something to the effect of "Person not found in our system".
* **unauthorized:** You might just want to inform people they don't have access.

# Security

We take security seriously, so we've taken some precautions to help that we both protect our data.

## Verify the request

For each request, we pass along a `signature` query param. This string you can use to verify the request is from us. When you create your embedded app, you'll be provided with a secret key.

To create the signature, you will need to generate an hmac using sha256 encoding, the base64 context string (context query string), and the secret key we provided you. Here are some examples:

```php PHP
function isFromFollowUpBoss(string $context, string $signature): boolean {
    $calculated = hash_hmac('sha256', $context, YOUR_SECRET_KEY);

    return $signature === $calculated;
}

if (isFromFollowUpBoss($_GET['context'], $_GET['signature'])) {
    // do something
}
```
```javascript NodeJS
const crypto = require('crypto');

function isFromFollowUpBoss(context, signature) {
    const calculated = crypto
        .createHmac('sha256', process.env.SECRET_KEY)
        .update(context)
        .digest('hex');
    return calculated === signature;
}

if (isFromFollowUpBoss(req.query.context, req.query.signature)) {
    // do something
}
```

## iFrame sandboxing

We sandbox the iframe to prevent basic security issues. Because of this, you will need to remove the `X-Frame-Options` from your header. If this is set at all, it'll automatically fail the CORS policy.

> 🚧 Older Browsers & IE11
>
> Because older browsers don't support modern CORS practices, we disable the iFrame entirely. Our current browser support is the latest versions of Edge, Safari, Chrome, and Firefox.

# Beta Testing and Development

You should be initially creating your embedded app within your account or a separate account for your development team. Once the embedded app has been enabled for that account and thoroughly tested, it should be sent in for submission.

# Submitting Your Application

> 👍 Need Approval?
>
> Once you've submitted your Embedded App for review, please email <embedded-app-approval@followupboss.com> to have our team review.
>
> Please make sure to provide any details required for testing your application, including:
>
> * Any login/password needed by the Embedded App to test features. (**Note: This is not your FUB account credentials.** These would be any credentials needed to log in to your connected system.)
> * Good examples of leads in the FUB account from which you submitted approval that can be used for testing and validation.
>
> If we have any questions or feedback, we will reach out to you!

Once your application is ready, you've filled out all of the required information within Follow Up Boss, and tested how it responds to different states, you may submit your application for review.


You'll see your app's status on the details page. Once you're ready to publish the application for Follow Up Boss accounts to use, hit the "Submit app for review" button. Follow Up Boss will be alerted that your app is ready for review.

## What We're Looking For

When reviewing your application, Follow Up Boss will ensure the basics are set like a descriptive app name, description, appropriate thumbnail, URL, and company bio and company website. From there, we'll preview the application ourselves and test the various debug states to ensure it loads properly and presents well. **To perform this testing, it may be necessary for you to provide credentials or information to your connecting system if you have a login or account management feature. Please ensure all information is available for testing when you reach out for approval.** Any change requests or feedback will be communicated back to you.

Once everything looks good, we'll approve the application and it'll be available to Follow Up Boss customers to enable in their accounts.

## App Styling

We do ask that you try and match our styles to some degree. The more it looks and feels like our app, the better the user experience is. At this moment, we don't have a strict guide. However, we may ask you to adjust styles.

## Monitoring and Error Handling

Errors should be properly recorded and handled on your system. We will periodically ping the app's URL with the test context and record any errors on our side. If we detect too many errors or too frequent errors, we will contact you to resolve any problems.

# Updating Your Embedded App

After an embedded app has been submitted, we request that any further changes or updates be done by creating a second embedded app within your account marked with some kind of designation ("Beta", "v2.0", "Development", etc.) to show that it is for new/future releases. As before, once you have tested this and it works satisfactorily, we can review that app and provide approval. Once approved, you can simply update the URL in the existing approved embedded app when ready for release to our shared customers.

# Further Assistance

If you have any further questions regarding embedded app creation or need assistance with the approval process, please reach out to our [API Questions Inbox](mailto:api@followupboss.com).

=================== https://docs.followupboss.com/reference/emcampaigns-get.md
# /emCampaigns

List email marketing campaigns.

> 🚧 Large campaigns may return 500 errors at high page sizes
>
> This endpoint returns the full HTML body (`bodyHtml`) of every campaign by default, so accounts with large, data-heavy campaigns can produce a response big enough to exhaust the server's memory limit. This surfaces as an empty `500` response with `x-cache: Error from cloudfront` (it is not a CloudFront or malformed-request issue). If you hit this, reduce the `limit` parameter — start at `limit=10` and raise it gradually. Heavy campaigns may still error at `limit=50` or above.

> 📘 Origin Details
>
> The `origin` field specifies which email marketing tool was used for a particular email campaign. The `originId` field will have an ID associated with the specified email marketing tool.

Campaigns are marketing emails that are sent out to people in Follow Up Boss. These could be one-off email blasts or automated drip emails.

As Follow Up Boss has built-in email marketing functionality and also integrates with third-party email marketing tools, this API will return information about both.

### GET /emCampaigns  — List email marketing campaigns.
- [query] `origin` (string): Search for campaigns from a specific origin.
- [query] `originId` (string): Search for campaigns with a specific ID from the originating system.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "emCampaigns",
    "offset": 0,
    "limit": 10,
    "total": 97
  },
  "emCampaigns": [
    {
      "id": 102,
      "origin": "Curaytor",
      "originId": "912",
      "name": "Can I help",
      "subject": "Can I help?",
      "bodyHtml": "I saw you're browsing our website, can I help with..."
    },
    ...
  ]
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/emcampaigns-id-put.md
# /emCampaigns/:id

Update an email marketing campaign.

Use this endpoint to update Follow Up Boss when a user edits a marketing email in your system (e.g., changing an email subject or body).

This is more relevant for automated drip emails, but it may be applicable to one-off email blasts (e.g., when a user saves an email as a draft and later edits it before sending out).

> 🚧 Restricted Access
>
> Only account owners and admins can update email campaigns.

> 📘 Merge Field Support
>
> You can use [merge fields](merge-fields) in the `subject` and `bodyHtml` fields. Those merge fields will be replaced with their actual values when an email is displayed in Follow Up Boss. If your system uses a different convention for naming merge fields, replace them to match the fields listed above.

### PUT /emCampaigns/{id}  — Update an email marketing campaign.
- [path] `id` (integer) REQUIRED: Follow Up Boss ID of the email campaign.
- BODY (application/json):
  - `name` (string): Name of the email campaign or template.
  - `subject` (string): Email subject line.
  - `bodyHtml` (string): Email body in HTML.
- RESPONSE 200 example: {
    "id": 102,
    "origin": "Curaytor",
    "originId": "912",
    "name": "How can I help",
    "subject": "How can I help?",
    "bodyHtml": "I saw you're browsing our website, how can I help with..."
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/emcampaigns-post.md
# /emCampaigns

Create an email marketing campaign.

Use this endpoint to update Follow Up Boss about a new marketing email created in your system. This could be a one-off email blast or automated drip email.

> ❗️ Unique Origin Fields Required
>
> Both `origin` and `originId` fields together are required to be a unique combination. **These should not be reused to create subsequent campaigns.**

> 🚧 Restricted Access
>
> Only account owners and admins can create email campaigns.

> 🚧 Origin Details
>
> Set the `origin` field with the name of your system and `originId` with your internal ID assigned to the new email campaign.
>
> You will get the `id` field in the response - this is the Follow Up Boss ID of the email campaign that you should **save in your system** as you will need it later to post [email marketing events](emevents-post) - email sends, opens, clicks, bounces and unsubscribes.

> 📘 Merge Field Support
>
> You can use [merge fields](merge-fields) in the `subject` and `bodyHtml` fields. Those merge fields will be replaced with their actual values when an email is displayed in Follow Up Boss. If your system uses a different convention for naming merge fields, replace them to match the fields listed above.

### POST /emCampaigns  — Create an email marketing campaign.
- BODY (application/json):
  - `origin` (string): Name of the email marketing system where this campaign originated from.
  - `originId` (string): Internal ID of the new campaign or email in the origin system.
  - `name` (string): Name of the email campaign or template.
  - `subject` (string): Email subject line.
  - `bodyHtml` (string): Email body in HTML.
- RESPONSE 200 example: {
    "id": 102,
    "origin": "Curaytor",
    "originId": "912",
    "name": "Can I help",
    "subject": "Can I help?",
    "bodyHtml": "I saw you're browsing our website, can I help with..."
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/emevents-get.md
# /emEvents

List email marketing events.

This endpoint returns information on marketing emails sent out and related statistics on opens, clicks, bounces, unsubscribes and spam reports. It also includes information about email blasts and automated drip emails.

As Follow Up Boss has built-in email marketing functionality and also integrates with third-party email marketing tools, this API will return information about both.

### GET /emEvents  — List email marketing events.
- [query] `type` (string): Find email marketing events based on type. Options include `delivered`, `open`, `click`, `bounced`, `soft-bounce`, `hard-bounce`, `unsubscribe`, `spamreport` and `dropped`.
- [query] `personId` (integer): Find email marketing events by person ID.
- [query] `updatedAfter` (string): Find email marketing events that have been created or updated after the specified time.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "emEvents",
    "offset": 0,
    "limit": 10,
    "total": 102938
  },
  "emEvents": [
    {
      "count": 2,
      "type": "open",
      "personId": 10911,
      "campaignId": 102,
      "campaignName": "Can I help",
      "created": "2017-01-03T19:20:49Z",
      "updated": "2017-01-03T19:20:49Z"
    },
    ...
  ]
}


=================== https://docs.followupboss.com/reference/emevents-post.md
# /emEvents

Notify Follow Up Boss about marketing emails sent, opens, clicks, bounces, unsubscribes and spam reports.

Use this endpoint to send information to Follow Up Boss about marketing emails sent out from your application and related events such as opens, clicks, bounces, unsubscribes and spam reports.

Before sending email marketing events you need to create an email campaign which represents a marketing email in your system. This could be a one-off email blast or automated drip email. Use the [`POST /emCampaigns`](emcampaigns-post) endpoint to create an email campaign and save the `id` field from the response - this is Follow Up Boss ID of the email campaign. Then, use that ID in the `campaignId` field when sending email marketing events to Follow Up Boss.

The following event types are supported:

`delivered` - Email was sent out to a recipient.

`open` - Recipient opened the email.

`click` - Recipient clicked on a link in the email.

`bounced` - Email bounced, it means recipient's email server rejected the email. This is a generic bounce event, use it if your system doesn't distinguish between soft and hard bounces.

`soft-bounce` - Email bounced temporarily.

`hard-bounce` - Email bounced permanently.

`unsubscribe` - Recipient unsubscribed from further emails.

`spamreport` - Recipient reported email as spam.

`dropped` - Sending email wasn't attempted because of the previous history with recipient (bounced, unsubscribed, etc).

> 📘 User ID
>
> `userId` is an optional field that allows you to specify the ID of the user in Follow Up Boss that email was sent from.
>
> This is useful to display email correctly in Follow Up Boss including replacing [merge fields](merge-fields) with correct user name, email, etc. This field is optional and defaults to the current authenticated user (the user whose API key is being used to authenticate API request).

> 📘 Batching Events
>
> This endpoint allows sending multiple events in a batch request, which is especially useful for the `delivered` event type when you are sending out an email to a large number of recipients.
>
> You can send **up to 1000** events per API request. When sending an email to a large number of recipients, we recommend breaking down the list of recipients into batches of 1000 and sending each batch in a separate POST request to this endpoint.

> 📘 Missing Recipients
>
> Any events sent over where Follow Up Boss was unable to find an associated contact for the listed recipient will be skipped over. No event will be created in this case. All other found matches will have events created successfully.

### POST /emEvents  — Notify Follow Up Boss about marketing emails sent, opens, clicks, bounces, unsubscribes and spam reports.
- BODY (application/json):
  - `emEvents` (array<object{type:string, occurred:string, recipient:string, personId:integer, campaignId:string, userId:integer, url:string}>): Array of email marketing events in the following format: [{"type": "delivered", "occurred": "2017-04-09T16:10:59Z", "recipient": "john.smith@gmail.com", "personId" : 1, "campaignId": 141, "userId": 3}, ...]
    - `type` (string): Type of event. Options include `delivered`, `open`, `click`, `bounced`, `soft-bounce`, `hard-bounce`, `unsubscribe`, `spamreport` and `dropped`.
    - `occurred` (string): Date/time of the event.
    - `recipient` (string): Email address of the recipient.
    - `personId` (integer): ID of the recipient.
    - `campaignId` (string): ID of the campaign.
    - `userId` (integer): Follow Up Boss ID of the user that email was sent from.
    - `url` (string): URL for the campaign.
- RESPONSE 200 example: {
    "emEventIds": [
        193928,
        193929,
        ...
    ]
    "recipientsNotFound": [
        "email.not.in.fub@example.com",
        "another.missing.email@example.com"
    ]
}


=================== https://docs.followupboss.com/reference/error-responses.md

# Error Responses

# Overview

If an API request is successful, the API returns an HTTP status code appropriate for that request (e.g. `200 OK`, `201 Created`, `204 No Content`).

If the server cannot process your request, the API typically returns a 4xx [HTTP status code](https://cybernews.com/resources/web-hosting-glossary/#400).  For example:

* `403 Forbidden`: You do not have access to this resource
* `404 Not Found`: This resource does not exist, it may have been deleted or it may have never existed at all.
* `429 Too Many Requests`: This request was rate limited, see the [Rate Limiting](https://docs.followupboss.com/reference/rate-limiting) section for more info.
* `400 Bad Request`: We could not process this request.  Typically this means the endpoint does not support the request you made, perhaps the parameters supplied with the request were incorrect, or something else about the request was malformed.  The response should be valid JSON, with an "errorMessage" key which explains why the request could not be processed.

> 🚧 Expired accounts and Authentication
>
> Note that when an account expires, it enters a grace period, however the API key remains valid. Some endpoints may still be active so that there is no data loss (e.g. new lead POST to `/v1/events`) however the account may be in a locked down state and will receive a [`403 Forbidden`](https://en.wikipedia.org/wiki/HTTP_403) response for most other requests.

If the server is unable to process a request because it is overloaded, or because we made a programming error, you may see a 5xx HTTP status code (e.g. `500 Internal Server Error`, `503 Service Unavailable`, `504 Gateway Timeout`, etc.).

# Retrying failed requests

Systems should make sure to implement throttling logic when receiving a 5xx HTTP Status code.

A common technique is to use [Truncated exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff).

Example:

1. Make a request to Follow Up Boss API.
2. If the request fails, wait 1 + random\_number\_milliseconds seconds and retry the request.
3. If the request fails, wait 2 + random\_number\_milliseconds seconds and retry the request.
4. If the request fails, wait 4 + random\_number\_milliseconds seconds and retry the request.

And so on, up to a maximum\_backoff time.

Continue waiting and retrying up to some maximum number of retries, but do not increase the wait period between retries.

Where:

* The wait time is min(((2^n)+random\_number\_milliseconds), maximum\_backoff), with n incremented by 1 for each iteration (request).
* random\_number\_milliseconds is a random number of milliseconds less than or equal to 1000. This helps to avoid cases where many clients get synchronized by some situation and all retry at once, sending requests in synchronized waves. The value of random\_number\_milliseconds is recalculated after each retry request.
* maximum\_backoff is typically 32 or 64 seconds. The appropriate value depends on the use case.

It's okay to continue retrying once you reach the maximum\_backoff time. Retries after this point do not need to continue increasing backoff time. For example, if a client uses an maximum\_backoff time of 64 seconds, then after reaching this value, the client can retry every 64 seconds. At some point, clients should be prevented from retrying infinitely.

How long clients should wait between retries and how many times they should retry depends on your use case and network conditions.

=================== https://docs.followupboss.com/reference/events-get.md
# /events

Search for events.

> 🚧 Restricted Results
>
> Some lead events are not accessible via API and are only visible within the Follow Up Boss application.

### GET /events  — Search for events.
- [query] `limit` (integer) default=10: Number of results to return. (Max 100.)
- [query] `next` (string): To get the next page of results, set this to the value returned in _metadata.next, or use the URL from _metadata.nextLink directly.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip, before starting to return results.  (For more efficient paging, please use the "next" parameter instead.)
- [query] `personId` (integer): Find all events related to a person.
- [query] `type` (string): Comma separated list of one or more of the following: "Registration", "Inquiry", "Seller Inquiry", "Property Inquiry", "General Inquiry", "Viewed Property", "Saved Property", "Visited Website", "Incoming Call", "Unsubscribed", "Property Search", "Saved Property Search", "Visited Open House" or "Viewed Page".
- [query] `hasProperty` (boolean): Filters based on whether a property is associated with an event or not.
- [query] `propertyAddress` (string): Searches property addresses for a given value, including partial matches.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "events",
    "offset": 0,
    "limit": 1,
    "total": 1000,
    "next": "eyJzaW5jZUlkIjoxMjYzMn0",
    "nextLink": "https://api.reclients.com/v1/events?updatedAfter=1980-01-01T00%3A00%3A00Z&next=eyJzaW5jZUlkIjoxMjYzMn0"
  },
  "events": [
    {
      "id": 132,
      "created": "2014-05-05T19:38:27Z",
      "updated": "2014-05-05T19:38:27Z",
      "personId":
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/events-id-get.md
# /events/:id

Retrieve a single event by id.

### GET /events/{id}  — Retrieve a single event by id.
- [path] `id` (integer) REQUIRED: The id of the event.
- RESPONSE 200 example: {
  "id": 132,
  "created": "2014-05-05T19:38:27Z",
  "updated": "2014-05-05T19:38:27Z",
  "personId": 12264,
  "message": "I am interested in 6825 Mulholland Dr, ...",
  "description": "Move-in: 12/28/2013",
  "noteId": 32,
  "source": "Zillow",
  "type": "Property Inquiry",
  "property": {
    "street": "6825 Mulholland Dr",
    "city": "Los Angeles",
    "state": "CA",
    "code": "90068",
    
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/events-post.md
# /events

Send in a lead or an event related to a lead.

You can notify Follow Up Boss when certain events occur on your website or system. For example: A user fills out a registration form on an IDX website, sends an inquiry about a property or submits a Contact Us form.

> 👍 Sending Leads and Activity
>
> This endpoint is the **only** correct option to send leads and their activity to Follow Up Boss from an IDX website, real estate portal, your custom website, or any other lead source.

> 🚧 Action Plan and Automation Triggers
>
> New leads created by POST `/v1/events` will only trigger **action plans** if they are of the following types: `Registration`, `Seller Inquiry`, `Property Inquiry`, `General Inquiry` or  `Visited Open House`.
>
> **Automations** will only be triggered on `Registration`, `Property Inquiry`, `Seller Inquiry`, and `General Inquiry` types.
>
> ("Inquiry" is a shorthand type for convenience, it will be automatically converted into "Property Inquiry" if property section is included in the request or "General Inquiry" otherwise.)

> 🚧 Missing Response Body
>
> If you receive a `204` response with no response body, this indicates that the lead flow associated with this source has been archived and ignored.

> 📘 Person ID
>
> Providing an ID in the Person object will ensure that an existing contact is used to link to the event based on a direct match instead of name and email. Utilizing this can help prevent duplicate and/or new contacts being created.
>
> If a Person is provided and not found, this will return a `404`.

> 📘 Response Data
>
> The response for `v1/events` is nearly identical to the response received from the `v1/people` request for the same contact. This is because leads are created from this endpoint in order for contact deduplication to occur and the appropriate action plans/automations to fire. This may cause some confusion when sending a new event for a pre-existing lead, as the response data is representative of the lead, *not* the event itself.

> 📘 Custom Fields
>
> If the account has custom fields defined you can also set these when sending in an event. You can use the [customFields endpoint](https://docs.followupboss.com/docs/customfields-get) to see which custom fields are available in the current account.

> 📘 Status Codes
>
> It is important to pay attention to the status codes returned from this call. If a `200` status code is returned, the event was created successfully and a person was updated if that information was provided. If `201` is returned, that means that a new person was created along with the event as well.

> 📘 Campaigns
>
> In order to send a campaign and have it appear in the marketing reports, the `campaign` object is required. The `source` field within the `campaign` object is a **required** field if this object is being sent in.

### POST /events  — Send in a lead or an event related to a lead.
- BODY (application/json):
  - `source` (string): The name of the lead source.
  - `system` (string): The name of the system used in providing leads.
  - `type` (string): The type of event. Currently one of `Registration`, `Inquiry`, `Seller Inquiry`, `Property Inquiry`, `General Inquiry`, `Viewed Property`, `Saved Property`, `Visited Website`, `Incoming Call`, `Unsubscribed`, `Property Search`, `Saved Property Search`, `Visited Open House` or `Viewed Page`.
  - `message` (string): A message from the user about this inquiry.
  - `description` (string): Any additional information about this inquiry.
  - `person` (object{id:integer, firstName:string, lastName:string, stage:string, source:string, sourceUrl:string, contacted:boolean, price:integer, assignedTo:string, assignedLenderName:string, assignedUserId:integer, assignedLenderId:integer, emails:array<object{value:string, type:string}>, phones:array<object{value:string, type:string}>, addresses:array<object{type:string, street:string, city:string, state:string, code:string, country:string}>, tags:array<string>, custom*:string}): Information about the lead who triggered this event. Follow Up Boss will automatically de-duplicate people based on their phone number or email address.
    - `id` (integer): The ID of the person the event corresponds to (optional).
    - `firstName` (string): The first/given name of the person.
    - `lastName` (string): The last/family name of the person.
    - `stage` (string): The stage of the person. (e.g., `Lead` or `Trash` See stages API endpoint for more options.)
    - `source` (string): The source of the lead.
    - `sourceUrl` (string): This is a direct link to the information about a person at the lead provider.
    - `contacted` (boolean) default=False: Sets whether the person has been contacted or not.
    - `price` (integer): The estimated sell/buy price for this person.
    - `assignedTo` (string): Full name of the agent to assign to this person.
    - `assignedLenderName` (string): Full name of the lender to assign to this person.
    - `assignedUserId` (integer): ID of the agent assigned to this person.
    - `assignedLenderId` (integer): ID of the lender assigned to this person.
    - `emails` (array<object{value:string, type:string}>): A list of email addresses associated with this person.
      - `value` (string): The email address.
      - `type` (string): The type of email address. (e.g., "work", "home")
    - `phones` (array<object{value:string, type:string}>): A list of phone numbers associated with the person.
      - `value` (string): The phone number. (e.g., 888-555-1234).
      - `type` (string): Type of number. (e.g., "mobile", "home", "fax", etc.)
    - `addresses` (array<object{type:string, street:string, city:string, state:string, code:string, country:string}>): A list of addresses associated with the person (this is the address where this person can be contacted, it is not the address of a property this person may be interested in selling or buying).
      - `type` (string) default=home: The address type. (e.g., "home", "work", "mailing", "investment", etc.)
      - `street` (string): Street address. (e.g., "3595 South Higuera St., Suite B")
      - `city` (string): City name.
      - `state` (string): Abbreviated state code. (e.g., "CA", "NY", etc.)
      - `code` (string): Zipcode. (As a string, not a number.)
      - `country` (string): Country name. (e.g., "United States", "Japan", etc.)
    - `tags` (array<string>): A list of tags applied to the person.
    - `custom*` (string): You can include any of your Custom Fields in the request, these must be prefixed with "custom".  For example, if you have a *Closing Date* custom field, the JSON key for that field will be `customClosingDate`.  See [Custom Fields](ref:customfields-get) for more about Custom Fields.
  - `property` (object{street:string, city:string, state:string, code:string, mlsNumber:string, price:integer, forRent:boolean, url:string, type:string, bedrooms:string, bathrooms:string, area:string, lot:string}): Information about the property this event is related to.
    - `street` (string): Street address. (e.g., "3595 South Higuera St, Suite B")
    - `city` (string): City name.
    - `state` (string): Abbreviated state code. (e.g., "CA", "NY", etc.)
    - `code` (string): Zipcode. (Only as a string, not a number. e.g., "90210")
    - `mlsNumber` (string): MLS Number for the property.
    - `price` (integer): The asking price or price estimate for the property.
    - `forRent` (boolean): Sets whether this property is for rent or not.
    - `url` (string): A URL for the property provided by the lead source.
    - `type` (string): A freeform description of property type. (e.g., "Bungalow" or "Apartment")
    - `bedrooms` (string): The number of bedrooms.
    - `bathrooms` (string): The number of bathrooms.
    - `area` (string): Area of the property in square feet.
    - `lot` (string): Area of the lot/land in acres.
  - `propertySearch` (object{type:string, neighborhood:string, city:string, state:string, code:array<string>, minPrice:integer, maxPrice:integer, minBedrooms:integer, maxBedrooms:integer, minBathrooms:number, maxBathrooms:number}): If this event was an inquiry you may have information about what the person was searching for, you can submit this information using this field.
    - `type` (string): The type of property the person was searching for. (e.g., "Residential", "Lot", "Apartment", etc.)
    - `neighborhood` (string): The neighborhood or area in which a person is searching for a property.
    - `city` (string): The city in which a person was searching.
    - `state` (string): The state in which a person was searching.
    - `code` (array<string>): The zipcode(s) in which a person was searching. (This can also be sent in as just a string for one zip code.)
    - `minPrice` (integer): The minimum price in which a person was searching.
    - `maxPrice` (integer): The maximum price in which a person was searching.
    - `minBedrooms` (integer): The minimum number of bedrooms that a person was searching for.
    - `maxBedrooms` (integer): The maximum number of bedrooms that a person was searching for.
    - `minBathrooms` (number): The minimum number of bathrooms that a person was searching for.
    - `maxBathrooms` (number): The maximum number of bathrooms that a person was searching for.
  - `campaign` (object{source:string, medium:string, term:string, content:string, campaign:string}): The name of the source where the lead originated. (e.g., If the lead came to your site through an organic search on `www.google.com` the source is "Google".)
    - `source` (string) REQUIRED: The source of the campaign.
    - `medium` (string): The medium of the campaign. (e.g., For an organic search the medium is "organic".)
    - `term` (string): The search terms entered by the person.
    - `content` (string): The content of the campaign.
    - `campaign` (string): The name or identifier for this campaign.
  - `pageTitle` (string): This field is to be used with the `Viewed Page` event type and indicates the title of the page viewed. (e.g., "Contact Us")
  - `pageUrl` (string): This field is to be used with the `Viewed Page` event type and indicates the url of the page viewed. (e.g., "http://www.samplerealestate.com/contact-us")
  - `pageReferrer` (string): This field is to be used with the `Viewed Page` event type and indicates the referrer url where the visitor came from. (e.g., "https://www.google.com") (Note: If `pageReferrer` is sent in, `pageUrl` should be set as well.)
  - `pageDuration` (integer): This field is to be used with the `Viewed Page` event type and indicates the duration of the visitor on the page viewed given in seconds.
  - `occurredAt` (string): The date this event occurred. This is used to determine if the event is historical. Historical events will not trigger workflows upon creation. Any DateTime greater than 1 day will be considered historical.
- RESPONSE 200 example: {}
- RESPONSE 201 example: 
- RESPONSE 204 example: 
- RESPONSE 404 example: {}


=================== https://docs.followupboss.com/reference/follow-up-bot.md

# Follow Up Bot

# Overview

The Follow Up Boss parser fetches information about a property such as a preview thumbnail from a URL in response to an incoming lead email, an API event, or a [Pixel](https://help.followupboss.com/hc/en-us/articles/360037775174-Follow-Up-Boss-Pixel) event. We are not a crawler and do not follow links. These thumbnails are used to provide value as a quick reference within a user's timeline of properties they have viewed or saved, as well as being used in conjunction with Pixel saved properties.

Follow Up Boss' robots fetch URLs with the following user agent (version may change):

`FollowUpBoss/1.0 (+https://docs.followupboss.com)`

If you've found our bot in your access logs, we encourage you to whitelist us to better provide value to our shared customers.

=================== https://docs.followupboss.com/reference/fub-api-tou.md

# API Terms of Use

This document sets forth the terms on which Follow Up Boss, LLC (“FUB”) makes the FUB Application Programming Interface (“FUB API”) available for use by licensees on non-FUB websites and mobile applications (each, individually, a “Site”, collectively, “Sites”). By using the FUB API, you and the organization identified in your registration for the FUB API, if applicable (“you”) agree to be bound by these terms of use (“FUB API Terms of Use” or “Agreement”) as well as the FUB Terms of Service, located at: <https://www.followupboss.com/legal-pages/terms-of-service>, the FUB Acceptable Use Policy, located at: <https://www.followupboss.com/legal-pages/acceptable-use-policy> and the FUB Privacy Policy, located at: <https://www.followupboss.com/legal-pages/privacy-policy>, which are incorporated into these API Terms of Use by reference. Your use of the FUB API is also conditioned upon compliance with any applicable instructions or restrictions included in the FUB API Reference page located at <https://docs.followupboss.com/reference/getting-started> and the pages linked therein (collectively, the “Applicable Terms”). The Applicable Terms may be updated at any time at FUB’s discretion, and in the event of any conflict between the Applicable Terms and these FUB API Terms of Use, these FUB API Terms of Use shall govern. Notwithstanding the foregoing or anything to the contrary contained herein, FUB customers remain the owner of all business information and data uploaded to our service as set forth in our Terms of Service and Privacy Policy and the data use restrictions herein do not apply to a FUB customer's use of their own data.

1. **FUB API.** The FUB API is FUB’s service that allows licensees to retrieve and send certain data relating to FUB customers (“FUB Data”). The FUB API includes calls to retrieve FUB Data to your Sites and pushes of data stored in your Sites (“Site Data”) to a FUB customer’s account. FUB Data and Site Data may be referred to herein as “API Data.” FUB may release subsequent versions of the FUB API and require you to obtain and use the most recent version. New versions may not be compatible with your previous implementation.
2. **License to FUB API and Data.** Before accessing the FUB API, you must register your system at <https://apps.followupboss.com/system-registration> in order to access the FUB API. Once you register and agree to these FUB API Terms of Use, you may access the FUB API, implement FUB API components on your Site(s), and: a) distribute the corresponding FUB Data to your customers for their personal use on your Site(s); and b) send Site Data to the FUB account belonging to your customer. This license is subject to the following restrictions:\
   a. All calls to the FUB API must reference the X-System-Key issued to you as a registered licensee, and every request to the API should include the registered 'X-System' and 'X-System-Key' headers issued to you as a registered system or user.\
   b. You agree that you will provide the FUB Data to users on “as is” terms, with disclaimers substantially equivalent to those set forth in Sections 7 and 8.\
   c. You agree to keep the X-System-Key confidential, and not to share it with any third party. This license is personal to you, and any affiliates must seek and obtain their own license and X-System-Key. You are responsible for any misuse of the X-System-Key or FUB API key associated with your FUB account.\
   d. You may not implement the FUB API or distribute the FUB Data on a Site such that the FUB API is the primary functionality on the Site and/or the FUB Data makes up the majority of the content on the Site.\
   e. You may not resell, license, lease or otherwise monetize the FUB API, FUB Data or delivery of FUB Data to your customers or any third party.\
   f. You may present or disclose the FUB Data only to the customer that has allowed authenticated access to  FUB system. You will not permit your customers or other third parties to access the FUB Data of any other customer.\
   g. You may not retain copies of FUB Data beyond what is necessary to operate your integration in accordance with these Terms. Your license to FUB Data is limited to making direct server calls to the FUB API for the FUB Data and distributing the FUB Data to your end user(s) on your Site(s), immediately upon receipt by your servers.\
   h. You may not present the FUB Data (or permit the FUB Data to be presented) so that it appears to be available from a third party website.\
   i. You may not sell, license, rent, or otherwise distribute or disclose the FUB Data to any third party for that party’s own use.\
   j. You may not use the FUB Data to develop direct marketing or telemarketing lists for the benefit or use of anyone except the FUB customer.\
   k. You may not separately extract and provide or otherwise use data elements from the FUB Data to enhance the data files of third parties.\
   l. You may not use the FUB Data for research purposes, product development or improvement, or in connection with any type of Artificial Intelligence or Machine Learning model development or training.\
   m. You may not use the FUB API or FUB Data to develop or offer products or services not intended for use by FUB customers or for use with FUB’s products and services.\
   n. You may not use the FUB API or FUB Data for competitive analysis or benchmarking.\
   o. You may not remove any proprietary labels from the API.\
   p. You may not attempt to hide or disguise your identity or the identity of your application(s) or Site(s) when requesting authorization to use the FUB API.\
   q. You further agree not to otherwise reproduce, create adaptations of, modify, distribute, decompile, disassemble, decode, reverse engineer or otherwise access any software component of the FUB API or FUB Data or any portion thereof.\
   r. You are limited to rates as described in our reference documentation located at: <https://docs.followupboss.com/reference/rate-limiting>, unless otherwise approved by FUB.\
   s. If you become aware that a customer of yours is in material breach of these FUB API Terms of Use, or any of the Applicable Terms, then you agree to notify FUB promptly of such breach by e-mail to <api@followupboss.com>, and to take prompt commercially reasonable corrective action at your expense to remedy such breach. In addition, upon request of FUB, you will either: (a) use commercially reasonable efforts to obtain such equitable relief to prevent harm to FUB or its licensors; or (b) assign any of your applicable rights to permit FUB or the applicable licensor to seek such equitable relief. Your obligations to report and enforce the Applicable Terms will survive termination of these FUB API Terms of Use or your use of the FUB API.
3. **Acceptable Use.** You agree not to use the FUB API or FUB Data in any way that is unlawful, or harms, or competes with, FUB, its affiliates, its service providers, its or your customers, or any other person. You also agree to access only the FUB Data necessary to provide the functionality specifically requested by your customer.  Further, pursuant to Section 11 below, FUB may terminate your use of the FUB API or FUB Data if and when FUB, in its sole discretion, determines that your use is inappropriate or otherwise not in accordance with these FUB API Terms of Use.
4. **Limited Relationship.** You and FUB are independent contractors, and nothing in these FUB API Terms of Use shall be construed as creating an employer-employee relationship, a partnership, or a joint venture. While you may publicly refer to the fact that you have implemented the FUB API, you agree not to make any other public statements that assert or imply any other relationship with FUB or its affiliates, unless you have FUB’s prior written approval.
5. **Indemnity.** You agree to hold harmless, defend, and indemnify FUB, and its subsidiaries, affiliates, officers, agents, employees, and suppliers, from and against any third party claim arising from or in any way related to this Agreement or your or your customers’ use of the FUB API or FUB Data, or other actions connected with your use of FUB services, including any liability or expense arising from all claims, losses, damages (actual and consequential), suits, judgments, litigation costs, and attorneys’ fees, of every kind and nature. In such a case, FUB will provide you with written notice of such claim, suit, or action.
6. **Representations and Warranties.**  Each party hereto represents and warrants as follows: (a) it has the full right and legal authority to enter into and fully perform this Agreement, in accordance with the terms of this Agreement, (b) this Agreement, when executed and delivered by such party, will be a legal, valid and binding obligation enforceable against it in accordance with its terms, and (c) the execution and delivery of this Agreement has been duly authorized by such party, and the execution and delivery and the performance of its obligations hereunder do not and will not violate or cause a breach of any other agreement or obligation to which it may be a party or by which it may be bound.  You further represent and warrant that: (x) your use of the FUB API will not introduce into any FUB systems or any third party systems any viruses, worms, time bombs, Trojan horses or other harmful, malicious or destructive code, and use of the FUB API will not subject the receiving party to any additional clickwrap, browsewrap or third party terms or conditions; (y) to the best of your knowledge, your use of the FUB API and FUB Data (and use thereof by your Customer) does not and will not infringe, violate, or misappropriate the intellectual property rights or privacy rights of any third party; and (z) there are no pending or threatened claims that would prevent you from fulfilling your obligations under this Agreement (and you shall promptly notify FUB in event of such a claim). By accessing the FUB API, you represent and warrant that you are authorized to access FUB Data and have made all disclosures, and obtained all consents, that are required under applicable laws or regulations.
7. **Disclaimer of Warranties.** EXCEPT AS OTHERWISE STATED, FUB PROVIDES THE FUB API AND FUB DATA “AS IS,” “WITH ALL FAULTS” AND “AS AVAILABLE,” AND THE ENTIRE RISK AS TO SATISFACTORY QUALITY, PERFORMANCE, ACCURACY, AND EFFORT IS WITH YOU. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FUB AND ITS SUPPLIERS MAKE NO REPRESENTATIONS, WARRANTIES OR CONDITIONS, EXPRESS OR IMPLIED. FUB AND ITS AFFILIATES AND SUPPLIERS EXPRESSLY DISCLAIM ANY AND ALL WARRANTIES OR CONDITIONS, EXPRESS, STATUTORY AND IMPLIED, INCLUDING WITHOUT LIMITATION (A) WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, WORKMANLIKE EFFORT, ACCURACY, TITLE, QUIET ENJOYMENT, NO ENCUMBRANCES, NO LIENS AND NON-INFRINGEMENT, (B) WARRANTIES OR CONDITIONS ARISING THROUGH COURSE OF DEALING OR USAGE OF TRADE, AND (C) WARRANTIES OR CONDITIONS OF UNINTERRUPTED OR ERROR-FREE ACCESS OR USE.
8. **Limitation of Liability; Exclusive Remedy.** IN NO EVENT WILL FUB, ITS AFFILIATES, OR ITS SUPPLIERS BE LIABLE FOR ANY DAMAGES, INCLUDING WITHOUT LIMITATION ANY INDIRECT, CONSEQUENTIAL, SPECIAL, INCIDENTAL, OR PUNITIVE DAMAGES ARISING OUT OF, BASED ON, OR RESULTING FROM THESE FUB API TERMS OF USE OR YOUR USE OF THE FUB API OR FUB DATA, EVEN IF YOU HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE EXCLUSION OF DAMAGES UNDER THIS PARAGRAPH IS INDEPENDENT OF YOUR EXCLUSIVE REMEDY AND SURVIVES IN THE EVENT SUCH REMEDY FAILS OF ITS ESSENTIAL PURPOSE OR IS OTHERWISE DEEMED UNENFORCEABLE. THESE LIMITATIONS AND EXCLUSIONS APPLY WITHOUT REGARD TO WHETHER THE DAMAGES ARISE FROM (A) BREACH OF CONTRACT, (B) BREACH OF WARRANTY, (C) NEGLIGENCE, OR (D) ANY OTHER CAUSE OF ACTION, TO THE EXTENT SUCH EXCLUSION AND LIMITATIONS ARE NOT PROHIBITED BY APPLICABLE LAW. IF YOU DO NOT AGREE WITH ANY PART OF THESE FUB API TERMS OF USE, OR YOU HAVE ANY DISPUTE OR CLAIM AGAINST FUB, ITS AFFILIATES, OR ITS SUPPLIERS WITH RESPECT TO THESE FUB API TERMS OF USE OR THE SERVICES, THEN YOUR SOLE AND EXCLUSIVE REMEDY IS TO DISCONTINUE USING THE FUB API AND FUB DATA.
9. **Intellectual Property.** The FUB API is the property of MFTB HoldCo Inc., and subject to the intellectual property rights of MFTB HoldCo Inc. and its licensees.
10. **Changes.** FUB reserves the right to change the FUB API Terms of Use at any time and without notice to you. You are responsible for regularly reviewing these FUB API Terms of Use. Your continued use of the FUB API and/or FUB Data after the effective date of such changes will constitute acceptance of and agreement to any such changes. FUB may suspend or discontinue the Services at any time to you and/or to others, without notice.
11. **Termination.** FUB may change, suspend, or discontinue the FUB API and suspend or terminate your use of the FUB API and/or FUB Data at any time for any reason, without notice. If FUB terminates your access to the FUB API or FUB Data, you may not thereafter access either the FUB API or FUB Data. You may also terminate this Agreement by ceasing to use the FUB API and FUB Data, removing implementation of the FUB API from your Site(s), and deleting all copies of the FUB Data. Following termination of this Agreement, if FUB reasonably believes that you have failed to remove the FUB API from your Site(s) or have not deleted all FUB Data as required under this Agreement, FUB may, at its sole discretion, require you to permit a third-party auditor approved by FUB to audit your systems and facilities to verify compliance. You shall fully cooperate with the auditor’s requests for information, access, and assistance. You hereby authorize the third-party auditor to share with FUB any report or findings generated as a result of the audit. The costs of such audit shall be at the expense of FUB; provided, however, that you will bear the costs of the audit, without prejudice to any other claim or remedy that FUB may have hereunder, if the audit reveals that you are not in compliance with the terms of this Agreement.
12. **Choice of Law; Disputes.** These FUB API Terms of Use are governed by the laws of the State of Washington, without giving effect to its conflict of laws provisions. You agree to submit to exclusive jurisdiction and venue in the state and federal courts sitting in King County, Washington, for any and all disputes, claims and actions arising from or in connection with the Services and/or these FUB API Terms of Use. In any dispute arising under this Agreement, the prevailing party will be entitled to attorneys’ fees and expenses.
13. **General.** You represent that you have the authority to bind the organization (if any) identified in your registration for the FUB API. You agree not to export from anywhere any part of the FUB API or FUB Data or any direct product thereof except in compliance with, and with all licenses and approvals required hereunder, and in accordance with applicable export laws, rules and regulations. If provided to the U.S. government, the FUB API and/or FUB Data are provided with the commercial license rights described herein. If any part of these FUB API Terms of Use is determined to be invalid or unenforceable, then the invalid or unenforceable provision will be replaced with a valid, enforceable provision that most closely matches the intent of the original provision and the remainder of these FUB API Terms of Use will continue in effect. The section titles in these FUB API Terms of Use are solely used for the convenience of the parties and have no legal or contractual significance. FUB may assign these FUB API Terms of Use, in whole or in part, at any time with or without notice to you. You may not transfer, assign, or delegate the FUB API Terms of Use and your X-System-Key to any third party. FUB’s failure to act with respect to a breach by you or others does not waive its right to act with respect to subsequent or similar breaches. Except as expressly stated herein, these FUB API Terms of Use constitute the entire agreement between you and FUB with respect to the Services and supersede all prior or contemporaneous communications of any kind between you and FUB with respect to the FUB API or FUB Data.

=================== https://docs.followupboss.com/reference/getting-started.md

# Getting Started with Follow Up Boss

This page will help you get started with Follow Up Boss. You'll be up and running in a jiffy!

# Overview

Follow Up Boss provides a simple [REST API](https://en.wikipedia.org/wiki/Representational_state_transfer) that allows developers to integrate their applications quickly. The API is in active development and will be extended to provide more functionality while keeping it backward compatible. If you are accessing the FUB API in order to provide services to a FUB customer you must [register your system.](https://apps.followupboss.com/system-registration). See [Identification](https://docs.followupboss.com/reference/identification) for more details.

# API Endpoint

API Endpoint URL has the following structure, `https://api.followupboss.com/v1/people`

* `https://` - HTTPS is required for security, HTTP will not work.
* `api.followupboss.com` - API hostname, always the same.
* `v1` - API version, currently v1 is the only version.
* `people` - resource name in plural, such as people, notes, etc.

# Examples

Looking for code examples? You can find Bash and PHP examples [here](https://github.com/FollowUpBoss/fub-api-examples)

# Need Help?

Simply email us at <api@followupboss.com> and we'll help you to get started or answer any question you might have.

=================== https://docs.followupboss.com/reference/groups-get.md
# /groups

List groups.

> 🚧 Accessibility Restrictions
>
> This is not accessible by lender accounts.

### GET /groups  — List groups.
- [query] `type` (string enum['Agent', 'Lender']): `Agent` groups allow admins and agents and `Lender` groups allow lender role users.
- [query] `sort` (string enum['id', 'name']): Sorts results based on the provided field name. Prepending the field with a minus sign (-) sorts the results in descending order.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "groups",
    "offset": 0,
    "limit": 10,
    "total": 41,
    "next": "eyJzaW5jZUlkIjo1ND0",
    "nextLink": "https://api.followupboss.com/v1/groups?next=eyJzaW5jZUlkIjo1ND0"
  },
  "groups": [
    {
      "id": 63,
      "name": "Eastside",
      "type": "Agent",
      "distribution": "first-to-claim",
      "defaultUserId": null,
      "defaultPondId": nul
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/groups-id-delete.md
# /groups/:id

Delete a group.

> 🚧 Accessibility Restrictions
>
> This is only accessible to admin accounts.

### DELETE /groups/{id}  — Delete a group.
- [path] `id` (integer) REQUIRED: The ID of the group.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/groups-id-get.md
# /groups/:id

Retrieve a group by id.

> 🚧 Accessibility Restrictions
>
> This is not accessible by lender accounts.

### GET /groups/{id}  — Retrieve a group by id.
- [path] `id` (integer) REQUIRED: The id of the group.
- RESPONSE 200 example: {
  "id": 63,
  "name": "Eastside",
  "type": "Agent",
  "distribution": "first-to-claim",
  "defaultUserId": null,
  "defaultPondId": null,
  "defaultGroupId": null,
  "claimWindow": 900,
  "nextRoundRobinUser": 334,
  "isPrimary": false,
  "users": [
    {
      "id": 199,
      "name": "Daniel Corkill",
      "firstName": "Daniel",
      "lastName": "Corkill",
      "role": "Broker",
      "pau
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/groups-id-put.md
# /groups/:id

Update a group.

> 🚧 Accessibility Restrictions
>
> This is only accessible to admin accounts.

### PUT /groups/{id}  — Update a group.
- [path] `id` (string) REQUIRED: The id of the group.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of the group.
  - `distribution` (string enum['first-to-claim', 'round-robin']) default=round-robin: The distribution model to utilize. Lender groups cannot be set to `first-to-claim`.
  - `users` (array<integer>) REQUIRED: An array of user IDs that will be members of this group.
  - `type` (string enum['Agent', 'Lender']) default=Agent: `Agent` groups allow admins and agents and `Lender` groups allow lender role users.
  - `claimWindow` (integer) default=1800: Number of seconds to allow someone to claim a lead in a first-to-claim group before reassigning. The default is 30 minutes (1800 seconds) with a minimum of 1 minute and maximum of 30 minutes.
  - `defaultGroupId` (integer): The ID of the group to assign unclaimed first-to-claim leads to after the claim window expires.
  - `defaultPondId` (integer): The ID of the pond to assign unclaimed first-to-claim leads to after the claim window expires.
  - `defaultUserId` (integer): The ID of the user to assign unclaimed first-to-claim leads to after the claim window expires.
- RESPONSE 200 example: {
  "id": 63,
  "name": "Westside",
  "type": "Agent",
  "distribution": "round-robin",
  "defaultUserId": null,
  "defaultPondId": null,
  "defaultGroupId": null,
  "claimWindow": 900,
  "nextRoundRobinUser": 334,
  "isPrimary": false,
  "users": [
    {
      "id": 199,
      "name": "Daniel Corkill",
      "firstName": "Daniel",
      "lastName": "Corkill",
      "role": "Broker",
      "pauseL
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/groups-post.md
# /groups

Create a new group.

> 🚧 Accessibility Restrictions
>
> This is only accessible to admin accounts.

### POST /groups  — Create a new group.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of the group.
  - `distribution` (string enum['first-to-claim', 'round-robin']) default=round-robin: The distribution model to utilize. (Note: Lender groups cannot be set to `first-to-claim`.)
  - `users` (array<integer>) REQUIRED: An array of user IDs that will be members of this group.
  - `type` (string enum['Agent', 'Lender']) default=Agent: `Agent` groups allow admins and agents and `Lender` groups allow lender role users.
  - `claimWindow` (integer) default=1800: Number of seconds to allow someone to claim a lead in a first-to-claim group before reassigning. The default is 30 minutes (1800 seconds) with a minimum of 1 minute and maximum of 30 minutes.
  - `defaultGroupId` (integer): The ID of the group to assign unclaimed first-to-claim leads to after the claim window expires.
  - `defaultPondId` (integer): The ID of the pond to assign unclaimed first-to-claim leads to after the claim window expires.
  - `defaultUserId` (integer): The ID of the user to assign unclaimed first-to-claim leads to after the claim window expires.
- RESPONSE 201 example: {
  "id": 63,
  "name": "Westside",
  "type": "Agent",
  "distribution": "round-robin",
  "defaultUserId": null,
  "defaultPondId": null,
  "defaultGroupId": null,
  "claimWindow": 900,
  "nextRoundRobinUser": 334,
  "isPrimary": false,
  "users": [
    {
      "id": 199,
      "name": "Daniel Corkill",
      "firstName": "Daniel",
      "lastName": "Corkill",
      "role": "Broker",
      "pauseL
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/groups-roundrobin-get.md
# /groups/roundRobin

Lists groups and includes round-robin data.

> 🚧 Accessibility Restrictions
>
> This is not accessible by lender accounts.

### GET /groups/roundRobin  — Lists groups and includes round-robin data.
- [query] `type` (string enum['Agent', 'Lender']): `Agent` groups allow admins and agents and `Lender` groups allow lender role users.
- [query] `sort` (string enum['id', 'name']): Sorts results based on the provided field name. Prepending the field with a minus sign (-) sorts the results in descending order.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "groups",
    "offset": 0,
    "limit": 10,
    "total": 41,
    "next": "eyJzaW5jZUlkIjo1ND0",
    "nextLink": "https://api.followupboss.com/v1/groups/roundRobin?next=eyJzaW5jZUlkIjo1ND0"
  },
  "groups": [
    {
      "id": 63,
      "name": "Eastside",
      "type": "Agent",
      "distribution": "round-robin",
      "defaultUserId": null,
      "defaultPond
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/identification.md

# Registration and Identification

# Overview

> 📘 Becoming a Follow Up Boss Partner
>
> If you are interested in becoming an official integration partner with Follow Up Boss, please reach out to <partnerships@followupboss.com>!

We ask that if you are accessing the Follow Up Boss API, you first [register your system.](https://apps.followupboss.com/system-registration) If you are accessing the FUB API in order to provide services to a FUB customer, you MUST [register your system.](https://apps.followupboss.com/system-registration). Every request to the API should include the registered 'X-System' and 'X-System-Key' headers provided to you after you [register your system.](https://apps.followupboss.com/system-registration).

```http
X-System: AwesomeWebsiteBuilder
X-System-Key: 560270f7914b5b4a5f4dc1793ebc2796
```

On first glance system may look similar to the "source" attribute sent along with lead notification events. The difference is that the lead source describes the brand or marketing name a broker uses for a lead source, and system describes the system used.

=================== https://docs.followupboss.com/reference/identity.md
# /identity

Get identity and authentication information.

This endpoint uses the provided API key to provide basic identifying information about the authenticated user and the parent account.

### GET /identity  — Get identity and authentication information.
- RESPONSE 200 example: {
    "account": {
        "id": 1234567,
        "domain": "example",
        "owner": {
            "name": "John Doe",
            "email": "j.doe@example.com"
        }
    },
    "user": {
        "id": 2,
        "name": "Louis Tully",
        "email": "louis@example.com"
    }
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/idx-integration.md

# IDX Integration

# Overview

Use the [Events API](events-post), not the [People API](people-post) to send all data from an IDX website to Follow Up Boss.

Make sure all these events are sent to Follow Up Boss:

* Registration
* Inquiry
* Saved Property
* Viewed Property
* Property Search
* Visited Open House
* Any other forms on the website that send data to Follow Up Boss

Additional items to note:

* Include the system field in all API calls to identify your system vs other lead providers.
* Set the source field to be the domain of the website without "[www](http://www).", e.g. mywebsite.com.
* Ensure the API key is secure and not exposed in the browser.
* All PPC data ("campaign" section) is included.
* Link to lead in your backend system if applicable (via the `sourceUrl` field).

=================== https://docs.followupboss.com/reference/inbox-apps-about.md

# Inbox Apps

Inbox Apps allow you to add third-party messaging services to Follow Up Boss.

## About

Inbox Apps are a unique type of integration that allow you to add third-party communication platforms to Follow Up Boss. With Inbox Apps, you can integrate your third-party instant messaging, texting, or other text-based communication platform directly into the Follow Up Boss Inbox and timeline as a first-class communication.

> ℹ️ Inbox Apps are only available to integration partners at this time.
>
> Inbox Apps are only available to established integration partners at this time. A self-service option to support individual real estate teams with in-house developers is coming in the future.

<br />

> 📘 Just getting started with Inbox Apps?
>
> Review our [Inbox Apps Guide](https://docs.followupboss.com/docs/inbox-apps-overview) for information about building Inbox Apps.

=================== https://docs.followupboss.com/reference/inbox-apps-add-message.md
# Add Message

Adds a message to an existing or new Inbox App conversation.

### POST /inboxApps/{inboxAppId}/message  — Adds a message to an existing or new Inbox App conversation.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID adding the message.
- BODY (application/json):
  - `externalConversationId` (string) REQUIRED: A unique identifier that references this conversation.
  - `externalMessageId` (string) REQUIRED: A unique identifier that references this message.
  - `replyToExternalMessageId` (string): If this message is a reply to a previous message, specify the external message ID of the message being replied to.
  - `sentAt` (string): The timestamp the message was delivered at in ISO8601 UTC format. Defaults to current time if omitted.
  - `subject` (string): Sets or updates the subject of the conversation.
  - `message` (string) REQUIRED: A plaintext message body.
  - `isIncoming` (boolean) REQUIRED: Indicates if the message was incoming to your system.
  - `sender` (object{userId:integer, personId:integer, relationshipId:integer, participantId:integer, name:string, email:string, phone:string}) REQUIRED: Who sent the message. Can be a FUB User, a FUB Person, or an unrelated entity such as an AI bot.
    - `userId` (integer): A FUB User ID. Mutually exclusive to other IDs.
    - `personId` (integer): A FUB Person ID. Mutually exclusive to other IDs.
    - `relationshipId` (integer): A FUB Relationship ID. Mutually exclusive to the other ID fields.
    - `participantId` (integer): The ID of a conversation participant returned when adding the sender. Mutually exclusive to other IDs.
    - `name` (string): The sender's name if you do not know the sender's User or Person ID.
    - `email` (string): The sender's email if you do not know the sender's User or Person ID.
    - `phone` (string): The sender's name if you do not know the sender's User or Person ID.
  - `isAutomation` (boolean) default=False: Whether the sender is an automated system. Defaults to false.
  - `person` (object{id:integer, name:string, email:string, phone:string}): The person associated with the conversation. A Person ID is preferred, but name, email, and/or phone are acceptable if the person does not exist in FUB yet. Required on the first message in a conversation.
    - `id` (integer): The FUB Person ID.
    - `name` (string): The person's name if you do not know the person's User ID.
    - `email` (string): The person's name if you do not know the person's User ID.
    - `phone` (string): The person's name if you do not know the person's User ID.
  - `owner` (object{userId:integer, inboxId:string}): The owner of the conversation. Can be a FUB User or FUB Team Inbox. Required on the first message in a conversation.
    - `userId` (integer): The FUB User who this conversation should belong to. The FUB Team Inbox who this conversation should belong to. Mutually exclusive with inboxId.
    - `inboxId` (string): The FUB Team Inbox who this conversation should belong to. Mutually exclusive with userId.
  - `deliveryStatus` (string enum['Sent', 'Delivered', 'Read', 'Not Delivered']): The message's delivery status.
  - `deliveryStatusErrorMessage` (string): Optional user-facing error message for Not Delivered statuses.
  - `attachments` (array<object{filename:string, url:string}>): 
    - `filename` (string): The attachment's filename (for example, "house.jpg")
    - `url` (string): The URL to the attachment. Must have a TTL of at least 20 minutes to allow adequate time for FUB to process and download the attachment.
  - `richObjects` (array<string>): List of Rich Object URLs.
- RESPONSE 201 example: {
    "id": 1,
    "created": "2024-01-01T12:00:00Z",
    "updated": "2024-01-01T12:00:00Z",
    "sentAt": "2024-01-01T12:00:00Z",
    "deliveryStatus": null,
    "deliveryStatusErrorMessage": null,
    "createdById": 1,
    "updatedById": 1,
    "isIncoming": true,
    "message": "An example message.",
    "userId": 0,
    "personId": 1,
    "sender": {
        "personId": 1,
        "name": "Joh
- RESPONSE 400 example: {
    "errorMessage": "isIncoming must be a boolean."
}


=================== https://docs.followupboss.com/reference/inbox-apps-add-note.md
# Add Note

Adds a note to an Inbox App conversation.

### POST /inboxApps/{inboxAppId}/note  — Adds a note to an Inbox App conversation.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID adding the note.
- BODY (application/json):
  - `externalConversationId` (string) REQUIRED: The unique identifier that references the conversation you are adding a note for.
  - `body` (string) REQUIRED: The plaintext body of the note.
  - `user` (object{id:string, name:string, email:string}) REQUIRED: The user adding the note.
    - `id` (string): The User ID that is adding the note. Mutually exclusive with other fields.
    - `name` (string): The name of the user that is adding the note, if an ID is not available.
    - `email` (string): The email of the user that is adding the note, if an ID is not available.
- RESPONSE 201 example: {
    "id": 4,
    "created": "2024-01-01T12:00:00Z",
    "updated": "2024-01-01T12:00:00Z",
    "createdById": 1,
    "updatedById": 1,
    "createdBy": "John Doe",
    "updatedBy": "John Doe",
    "conversationId": 1,
    "body": "An example note.",
    "isHtml": false,
    "type": "ConversationNote",
    "conversationDeepLinkUrl": "https://app.followupboss.com/2/inbox-new/0/inbox/1"
}
- RESPONSE 400 example: {
	"errorMessage": "body is required."
}


=================== https://docs.followupboss.com/reference/inbox-apps-add-system-confirmation-message.md
# Add System Confirmation Message

Adds a system confirmation message to an existing or new Inbox App conversation.

### POST /inboxApps/{inboxAppId}/systemMessage  — Adds a system confirmation message to an existing or new Inbox App conversation.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID adding the message.
- BODY (application/json):
  - `externalConversationId` (string) REQUIRED: A unique identifier that references this conversation.
  - `externalMessageId` (string) REQUIRED: A unique identifier that references this message.
  - `message` (string) REQUIRED: A plaintext message body.
  - `type` (string enum['success', 'info', 'error']): The system confirmation message type.
  - `person` (object{id:integer, name:string, email:string, phone:string}): The person associated with the conversation. A Person ID is preferred, but name, email, and/or phone are acceptable if the person does not exist in FUB yet. Required on the first message in a conversation.
    - `id` (integer): The FUB Person ID.
    - `name` (string): The person's name if you do not know the person's User ID.
    - `email` (string): The person's name if you do not know the person's User ID.
    - `phone` (string): The person's name if you do not know the person's User ID.
  - `owner` (object{userId:integer, inboxId:string}): The owner of the conversation. Can be a FUB User or FUB Team Inbox. Required on the first message in a conversation.
    - `userId` (integer): The FUB User who this conversation should belong to. The FUB Team Inbox who this conversation should belong to. Mutually exclusive with inboxId.
    - `inboxId` (string): The FUB Team Inbox who this conversation should belong to. Mutually exclusive with userId.
- RESPONSE 201 example: {
    "id": 1,
    "created": "2024-01-01T12:00:00Z",
    "updated": "2024-01-01T12:00:00Z",
    "sentAt": "2024-01-01T12:00:00Z",
    "deliveryStatus": null,
    "deliveryStatusErrorMessage": null,
    "createdById": 1,
    "updatedById": 1,
    "isIncoming": true,
    "message": "An example system confirmation message.",
    "isSystem": true,
  	"systemType": "success",
		"userId": 0,
    "perso
- RESPONSE 400 example: {
    "errorMessage": "type must be one of success, info, error."
}


=================== https://docs.followupboss.com/reference/inbox-apps-create-participant.md
# Add Participant

Adds a participant to an Inbox App conversation.

### POST /inboxApps/{inboxAppId}/conversations/{extConversationId}/participants  — Adds a participant to an Inbox App conversation.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID sending the message.
- [path] `extConversationId` (string) REQUIRED: The unique identifier that references the conversation you are updating.
- BODY (application/json):
  - `personId` (integer): A FUB Person ID. Mutually exclusive to other fields.
  - `userId` (integer): A FUB User ID. Mutually exclusive to other fields.
  - `relationshipId` (integer): A FUB Relationship ID. Mutually exclusive to the other ID fields.
  - `name` (string): The participant's name if you do not know the participant's Person or User ID.
  - `email` (string): The participant's email address if you do not know the participant's Person or User ID.
  - `phone` (string): The participant's phone number if you do not know the participant's Person or User ID.
  - `isAutomation` (boolean) default=False: Whether the participant is an automated system. Defaults to false.
- RESPONSE 201 example: {
    "id": 1,
    "status": "active",
    "userId": null,
    "personId": null,
    "name": "John Doe",
    "phone": "+14075550123",
    "email": "john@example.com",
    "isAutomation": false
}
- RESPONSE 400 example: {
	"errorMessage": "externalConversationId is required."
}


=================== https://docs.followupboss.com/reference/inbox-apps-deactivate.md
# Deactivate Inbox App

Deactivates an installation of your Inbox App. Useful when a customer unsubscribes from your service, or requests that you turn off Inbox App functionality for them.

> 📘 **Learn more about the Inbox Apps Installation Lifecycle**
>
> See our [Installation Lifecycle Guide](https://docs.followupboss.com/docs/inbox-apps-installation-lifecycle) for more information on installing and deactivating Inbox Apps.

### DELETE /inboxApps/{inboxAppId}  — Deactivates an installation of your Inbox App. Useful when a customer unsubscribes from your service, or requests that you turn off Inbox App functionality for them.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID to deactivate.
- RESPONSE 204 example: 
- RESPONSE 400 example: {
  "errorMessage": "inboxAppId is required."
}


=================== https://docs.followupboss.com/reference/inbox-apps-delete-participant.md
# Remove Participant

Deletes an Inbox App conversation participant.

### DELETE /inboxApps/{inboxAppId}/conversations/{extConversationId}/participants/{participantId}  — Deletes an Inbox App conversation participant.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID sending the message.
- [path] `extConversationId` (string) REQUIRED: The unique identifier that references the conversation you are updating.
- [path] `participantId` (string) REQUIRED: The participant's ID
- RESPONSE 204 example: {}
- RESPONSE 400 example: {
	"errorMessage": "externalConversationId is required."
}


=================== https://docs.followupboss.com/reference/inbox-apps-get-participants.md
# Get Participants

Retrieves participants in an Inbox App conversation.

### GET /inboxApps/{inboxAppId}/conversations/{extConversationId}/participants  — Retrieves participants in an Inbox App conversation.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID sending the message.
- [path] `extConversationId` (string) REQUIRED: The unique identifier that references the conversation you are updating.
- RESPONSE 200 example: [
    {
        "id": 1,
        "status": "active",
        "userId": null,
        "personId": null,
        "name": "John Doe",
        "phone": "+14075550123",
        "email": "john@example.com",
        "isAutomation": false
    },
    {
        "id": 2,
        "status": "active",
        "userId": 1,
        "personId": null,
        "name": null,
        "phone": null,
        "email": nu
- RESPONSE 400 example: {
	"errorMessage": "externalConversationId is required."
}


=================== https://docs.followupboss.com/reference/inbox-apps-install.md
# Install Inbox App

Installs your Inbox App for an account.

> 📘 **Learn more about the Inbox Apps Installation Lifecycle**
>
> See our [Installation Lifecycle Guide](https://docs.followupboss.com/docs/inbox-apps-installation-lifecycle) for more information on installing and deactivating Inbox Apps.

> ℹ️ Inbox Apps are only available to integration partners at this time.
>
> Inbox Apps are only available to established integration partners at this time. A self-service option to support individual real estate teams with in-house developers is coming in the future.

### POST /inboxApps/install  — Installs your Inbox App for an account.
- BODY (application/json):
  - `publishedInboxAppId` (integer) REQUIRED: Your Published Inbox App ID.
  - `userId` (integer) REQUIRED: The User ID to scope the Inbox App to, or 0 for account-wide scope.
  - `subscriptionUrl` (string) REQUIRED: The webhook URL you will receive Inbox App replies at.
- RESPONSE 201 example: {
    "id": 1,
    "created": "2024-01-01T12:00:00Z",
    "updated": "2024-01-01T12:00:00Z",
    "createdById": 1,
    "updatedById": 1,
    "status": 10,
    "name": "Example Inbox App",
    "publishedInboxAppId": 1,
    "userId": 1,
    "canReply": true
}
- RESPONSE 400 example: {
  "errorMessage": "publishedInboxAppId is required."
}


=================== https://docs.followupboss.com/reference/inbox-apps-update-conversation.md
# Update Conversation

Updates an Inbox App conversation.

### PUT /inboxApps/{inboxAppId}/conversations/{extConversationId}  — Updates an Inbox App conversation.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID sending the message.
- [path] `extConversationId` (string) REQUIRED: The unique identifier that references the conversation you are updating.
- BODY (application/json):
  - `subject` (string): Sets or updates the subject of the conversation if included.
  - `archived` (boolean): Archives or unarchives the conversation if included.
  - `permanentlyArchived` (boolean): Disables replies/notes and does not allow users to un-archive the conversation.
  - `person` (object{id:integer, name:string, email:string, phone:string}): Updates the person associated with the conversation. Can only be changed if a Person ID has not been set.
    - `id` (integer): The FUB Person ID.
    - `name` (string): The person's name if you do not know the person's User ID.
    - `email` (string): The person's name if you do not know the person's User ID.
    - `phone` (string): The person's name if you do not know the person's User ID.
  - `assignedUserId` (integer): The User ID to reassign the conversation to. Set to 0 to revert back to the conversation owner.
  - `assignedInboxId` (integer): The Team Inbox ID to reassign the conversation to. Set to 0 to revert back to the conversation owner.
- RESPONSE 200 example: {
    "externalConversationId": "",
    "created": "2024-01-01T12:00:00Z",
    "updated": "2024-01-01T12:00:00Z",
    "createdById": "John Doe",
    "updatedById": "John Doe",
    "ownerUserId": 1,
    "ownerSharedInboxId": 0,
    "assignedUserId": 0,
    "assignedSharedInboxId": 1,
    "subject": "A Conversation Subject",
    "archived": false,
    "person": {
        "id": 1,
        "name": nul
- RESPONSE 400 example: {
	"errorMessage": "archived must be a boolean."
}


=================== https://docs.followupboss.com/reference/inbox-apps-update-message.md
# Update Message

Update an Inbox App Message.

### PUT /inboxApps/{inboxAppId}/message  — Update an Inbox App Message.
- [path] `inboxAppId` (string) REQUIRED: The Inbox App ID updating the message.
- BODY (application/json):
  - `id` (integer): FUB ID of the Inbox App Message. Used to identify which message you are updating.
  - `externalMessageId` (string): Your unique identifier that represents this message. When provided by itself, it is used to identify which message you are updating. When provided alongside an "id", the message will be identified by its ID and the "externalMessageId" will be updated.
  - `deliveryStatus` (string enum['Sent', 'Delivered', 'Read', 'Not Delivered']): The message's delivery status.
  - `deliveryStatusErrorMessage` (string): Optional user-facing error message for Not Delivered statuses.
- RESPONSE 200 example: {
    "id": 1,
    "created": "2024-01-01T12:00:00Z",
    "updated": "2024-01-01T12:00:00Z",
    "sentAt": "2024-01-01T12:00:00Z",
    "deliveryStatus": "Not Delivered",
    "deliveryStatusErrorMessage": "Recipient has opted out of communications",
    "createdById": 1,
    "updatedById": 1,
    "isIncoming": true,
    "message": "An example message.",
    "userId": 0,
    "personId": 1,
    "send
- RESPONSE 400 example: {
  "errorMessage": "id or externalMessageId is required."
}


=================== https://docs.followupboss.com/reference/me.md
# /me

Retrieve information about the currently authenticated user.

### GET /me  — Retrieve information about the currently authenticated user.
- RESPONSE 200 example: {
  "id": 1,
  "name": "Gerald Leenerts",
  "role": "admin",
  "email": "gerald@followupboss.com",
  "phone": "(123) 456-7890",
  "timeZone": "America/Chicago",
  "signature": "<div>Cheers,<br></div><div>-Gerald</div>",
  "rawSignature": "<div>Cheers,<br></div><div>-Gerald</div>",
  "apiKey": "...",
  "algoliaKey": "...",
  "intercomSettings": {
    "app_id": "...",
    "created_at": "1313236940",


=================== https://docs.followupboss.com/reference/merge-fields.md

# Merge Fields

# Overview

Email Templates need a way to incorporate contact information into the final email that is to be sent. The way we do it is by unique identifiable text within an email template.

For example if your email template looked like: `Hello %contact_name%`. And your contact's name was William Riker, the result of the email template would be `Hello William Riker`.

# User Merge Field Mappings

The following merge fields can be obtained with a call to `/v1/users/:id`.

| Merge field          | JSON field  |
| :------------------- | :---------- |
| `%agent_name%`       | `name`      |
| `%agent_first_name%` | `firstName` |
| `%agent_last_name%`  | `lastName`  |
| `%agent_email%`      | `email`     |
| `%agent_phone%`      | `phone`     |

# Person Merge Field Mappings

The following merge fields can be obtained with a call to `/v1/people/:id`.

[block:parameters]
{
  "data": {
    "h-0": "Merge field",
    "h-1": "JSON field",
    "0-0": "`%contact_name%`",
    "0-1": "`name`",
    "1-0": "`%contact_first_name%`",
    "1-1": "`firstName`",
    "2-0": "`%contact_last_name%`",
    "2-1": "`lastName`",
    "3-0": "`%contact_email%`",
    "3-1": "`emails[0].value`",
    "4-0": "`%contact_phone%`",
    "4-1": "`phones[0].value`",
    "5-0": "`%contact_address%`",
    "5-1": "Combination of Fields:  \n  \n`addresses[0].street\naddresses[0].city, addresses[0].code`",
    "6-0": "`%contact_street%`",
    "6-1": "`addresses[0].street`",
    "7-0": "`%contact_city%`",
    "7-1": "`addresses[0].city`",
    "8-0": "`%contact_state%`",
    "8-1": "`addresses[0].state`",
    "9-0": "`%contact_zipcode%`",
    "9-1": "`addresses[0].code`",
    "10-0": "`%contact_country%`",
    "10-1": "`addresses[0].country`",
    "11-0": "`%source_name%`",
    "11-1": "`source`"
  },
  "cols": 2,
  "rows": 12,
  "align": [
    "left",
    "left"
  ]
}
[/block]

# Inquiry Merge Field Mappings

The following merge fields can be obtained with a call to `/v1/events/:personId`

| Merge field         | JSON field        |
| :------------------ | :---------------- |
| `%inquiry_address%` | `property.street` |

The inquiry address merge field is intended to be used as the subject of an email without any surrounding text, it should perform some basic substitutions in case there is no inquiry event for the person:

* If `property.street` is empty and `%source_name%` is not empty, then: `%inquiry_address%` is "Your property inquiry from `%source_name%`".
* If both `property.street` is empty and `%source_name%` are empty, then: `%inquiry_address%` is "Your property inquiry".

=================== https://docs.followupboss.com/reference/notes-id-delete.md
# /notes/:id

Delete a note.

### DELETE /notes/{id}  — Delete a note.
- [path] `id` (integer) REQUIRED: The ID of the note to delete.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/notes-id-get.md
# /notes/:id

Retrieve a note by id.

> 🚧 Additional Note Restrictions
>
> There are two restrictions in place that may prevent you from successfully retrieving a note:
>
> 1. A note was created by a system that restricts further access outside of Follow Up Boss.
> 2. A note was created by a system that contains email content and is restricted for privacy reasons.
>
> In both cases, you may get a `404 Not Found` response despite the note `id` being valid in Follow Up Boss.

### GET /notes/{id}  — Retrieve a note by id.
- [path] `id` (integer) REQUIRED: The ID of the note.
- [query] `includeThreadedReplies` (boolean): When set to true, will include threaded replies attached to the note. Replies may include HTML tags in their bodies.
- [query] `includeReactions` (boolean): When set to true, will include the reactions that have been left on the note (as well as the replies if those have also been requested). Reactions are keyed by the emoji reaction. The value is an array of user IDs who have left that reaction.
- RESPONSE 200 example: {
    "id": 12345,
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "createdById": 1,
    "updatedById": 1,
    "createdBy": "Mark Hamill",
    "updatedBy": "Mark Hamill",
    "personId": 15,
    "showContent": true,
    "subject": "",
    "body": "Hello team!",
    "type": "",
    "isHtml": false,
    "actionPlanId": null,
    "isExternal": false,
    "systemId": 


=================== https://docs.followupboss.com/reference/notes-id-put.md
# /notes/:id

Edit a note.

### PUT /notes/{id}  — Edit a note.
- [path] `id` (integer) REQUIRED: The ID of the note to update.
- BODY (application/json):
  - `personId` (integer): The ID of a person associated with this note.
  - `subject` (string): You can give a note a title or subject using this field.
  - `body` (string): The content of the note.
  - `isHtml` (boolean): If enabled, will render the HTML tags contained within the body on the Follow Up Boss user interface.
- RESPONSE 200 example: {
  "id": 1819,
  "created": "2014-06-19T18:32:26Z",
  "updated": "2014-06-19T18:32:26Z",
  "createdBy": "Agent White",
  "updatedBy": "Agent White",
  "personId": 12235,
  "subject": "Some note subject",
  "body": "Plans to sell within the next three months.",
  "type": "",
  "isHtml": 0
}


=================== https://docs.followupboss.com/reference/notes-post.md
# /notes

Add a note.

### POST /notes  — Add a note.
- BODY (application/json):
  - `personId` (integer) REQUIRED: The ID of a person.
  - `subject` (string): Gives a note a title or subject.
  - `body` (string): The content of the note.
  - `isHtml` (boolean): If enabled, will render the HTML tags contained within the body on the Follow Up Boss user interface.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/pagination.md

# Pagination

# Overview

List methods that return a collection of resources are paginated using `next` or `offset` and `limit` query parameters.

> 📘 Default Values
>
> The default limit value is `10` and default offset value is `0`.

> 📘 Descending Order
>
> Resources are returned in reverse order by `id` by default, meaning the API returns the last 10 resources in a collection.
>
> Why use descending order? It makes it easier to retrieve the most recent records, for example to get 5 most recently created people use:
>
> ```http HTTP
> GET /v1/people?limit=5
> ```

To obtain the next page of 10 resources use the `next` query parameter value (*recommended*) or specify `offset=10` query parameter, then `offset=20` and so on.

You can increase the number of resources returned at a time using the `limit` parameter.

> 📘 Maximum Limit
>
> The maximum value for the limit parameter is `100`.

> 📘 Deep Pagination Support
>
> If you are going deep into result sets with high offset values, and keyset pagination is possible, the API enforces the use of the `next` parameter for pagination instead of `offset`. It is **highly** encouraged to use `next` instead of `offset` for all API interactions that require pagination when possible.

Responses contain a `_metadata` section that includes total number of records available and pagination parameters used in the request:

```json
{
  "_metadata": {
    "collection": "people",
    "offset": 50,
    "limit": 25,
    "total": 1000,
    "next": "eyJzaW5jZUlkIjoxMDV9",  
    "nextLink": "https:\/\/api.followupboss.com\/v1\/people?limit=25&&next=eyJzaW5jZUlkIjoxMDV9"
  },
  "people": [
    {
      "id": 950,
      "created": "2012-04-23T02:23:11Z",
      ...
    },
    {
      "id": 949,
      "created": "2012-04-22T02:23:11Z",
      ...
    },
    ...
    {
      "id": 926,
      "created": "2012-04-19T02:23:11Z",
      ...
    }
  ]
}
```

# Example

Return the third page of most recently created people with 25 people per page:

```http
GET /v1/people?offset=50&limit=25
```

=================== https://docs.followupboss.com/reference/people-checkduplicate.md
# /people/checkDuplicate

Check whether a person exists in Follow Up Boss.

The `checkDuplicate` endpoint allows you to quickly verify that a particular person does not already exist in Follow Up Boss.  This call will tell you if a person exists or not, even if you do not have access to that person with the API key you're using for this API call.

If the person you're looking for already exists, the response will tell you whether they were found by the specified email address or phone number and which agent is currently the assigned agent for that person.

### GET /people/checkDuplicate  — Check whether a person exists in Follow Up Boss.
- [query] `email` (string): The email address to search for.
- [query] `phone` (string): The phone number to search for.
- RESPONSE 200 example: {
  "found": true,
  "matchedBy": "email",
  "assignedTo": "Agent Smith"
}
- RESPONSE 200 example: {"found": false}


=================== https://docs.followupboss.com/reference/people-claim.md
# /people/claim

Claim a lead.

If a new lead was offered to you via First To Claim, you can use this endpoint to claim the lead. If you successfully claimed the lead you will get a `200 OK` response with full details about the lead.  If claiming failed, typically because the lead has already been claimed by someone else, you will get a `409 Conflict` response.

### POST /people/claim  — Claim a lead.
- [path] `personId` (integer) REQUIRED: Include the person ID of the lead you want to claim either like this or in the POST body
- BODY (application/json):
  - `personId` (integer): Include the person ID of the lead you want to claim either like this or as part of the path itself.
- RESPONSE 200 example: {
  "id": 31227,
  "created": "2017-07-17T14:29:40Z",
  "updated": "2017-07-17T14:45:44Z",
  "createdVia": "API",
  "lastActivity": "2017-07-17T14:45:47Z",
  "name": "Sergio Pared",
  "firstName": "Sergio",
  "lastName": "Pared",
  "stage": "Sphere",
  "stageId": 10,
  "source": "Zillow",
  "sourceUrl": "https://example.com/lead/123",
  "contacted": 0,
  "price": 15000,
  "assignedLenderId": null,
- RESPONSE 409 example: {
  "id": 31227,
  "created": "2017-07-17T14:29:40Z",
  "name": "Sergio Pared",
  "firstName": "Sergio",
  "lastName": "Pared",
  "source": "Zillow",
  "sourceId": 99,
  "picture": {
    "small": "https://example.com/avatar/123.jpg"
  },
  "claimed": true
}


=================== https://docs.followupboss.com/reference/people-get.md
# /people

Search for people.

> 🚧 `Trash` Stage
>
> By default, this endpoint does not return People in the `Trash` stage. Set the `includeTrash` flag to `true` to include people that are in this stage.

> 📘 Available Response Fields
>
> When making a GET request to `/v1/people`, not all available fields are included in the response by default.  Use the `fields` argument to request exactly the fields you need.
>
> You can use "allFields" in `fields` during development while you are unsure of what you need, but as this may return very large responses **it is recommended to update this to specify exactly the fields you need for your production deployments** to minimize the payload.

> 📘 Including Relationships
>
> You do not need to perform separate calls to `/v1/peopleRelationships` to gather those associations. Include "relationships" in the `fields` query parameter to include relationship information.

> 📘 Determining Lead Type
>
> If you are trying to determine the lead type, such as "Buyer" or "Seller", this can be done by looking at the returned tags. If the lead is a "Seller" type, there will be a "Seller" tag initially set when the lead is created, otherwise the lead is a "Buyer".

> 📘 Custom Fields
>
> If the account has custom fields defined, you can also filter on these when searching for a person. You can use the [customFields endpoint](custom-fields-get) to see which custom fields are available in the current account.
>
> When querying for `date` Custom Fields, you can use the following syntax:
>
> `,YYYY-MM-DD` means less than or equal to the date.
>
> `YYYY-MM-DD` means greater than or equal to the date.
>
> `YYYY-MM-DD,YYYY-MM-DD` means date inclusive.

## Other People Response Fields

| Key        | Description                                                                                                                                           |
| :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| createdVia | This value indicates how this person was created. Possible values include "API", "Email Parsing", "Historic Email Parsing", "Import", and "Manually". |

### GET /people  — Search for people.
- [query] `id` (string): The ID(s) of a person or people. (e.g., "123,456")
- [query] `sort` (string) default=created: The sort order, can be one of the following: `id`, `created`, `updated`, `name`, `firstName`, `lastName`, `price`, `stage`, `lastActivity`, `lastCommunication`, `lastReceivedEmail`, `lastSentEmail`, `lastEmail`, `emailsReceived`, `emailsSent`, `lastIncomingCall`, `lastOutgoingCall`, `lastCall`, `firstCall`, `callsIncoming`, `callsOutgoing`, `callsDuration`, `lastReceivedText`, `lastSentText`, `lastText`, `lastLeadActivity`, `lastEmEventActivity`, `lastIdxVisit`, `textsReceived`, `textsSent`, `propertiesViewed`, `propertiesSaved`, `pagesViewed` or `nextTask`. <br /><br />Custom Fields (e.g. `customClosePrice`) can also be used in sorting.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip, before starting to return results.
- [query] `fields` (string): Comma separated list of fields to return or use `allFields` to return all fields. (e.g., `firstName,lastName,timeframeId,timeframeUpdated,timeframeStatus,customFieldName`).  Note: All custom fields should be prefixed with `custom` (i.e. customBirthday, customField).   <br><br> Special values include `allCustom` (returns all custom fields) and `allFields` (returns all fields, including custom fields).  <br><br> When using the `fields` parameter to filter the response, the `id` field will be included (even when not specified explicitly).
- [query] `lastActivityAfter` (string): Search for last activity after a given time. (e.g., "2016-11-23 01:02:03")
- [query] `lastActivityBefore` (string): Search for last activity before a given time. (e.g., "2016-11-23 01:02:03")
- [query] `name` (string): Search for person with a name like what is given. (e.g., If you search for "drew", it might return a contact like "Andrew".)
- [query] `firstName` (string): Search for person with a first name like what is given. (e.g., If you search for "drew", it might return a contact like "Andrew".)
- [query] `lastName` (string): Search for person with a last name like what is given. (e.g., If you search for "drew", it might return a contact like "Andrew".)
- [query] `email` (string): Search for a person by email address.
- [query] `phone` (string): Search for a person by phone number.
- [query] `stage` (string): Search for person by stage name. (e.g., "Lead" or "Trash". See [stages API endpoint](ref:stages-get) for available stages.)
- [query] `source` (string): Search for a person by lead source.
- [query] `assignedTo` (string): Search for a person by the user that is assigned to them. (e.g., Passing "William Riker" would return any person assigned to them.)
- [query] `assignedUserId` (integer): Search for people by the assigned user ID.
- [query] `assignedPondId` (integer): Search for a person by the assigned pond id.
- [query] `assignedLenderName` (string): Search for people by the assigned lender name.
- [query] `assignedLenderId` (integer): Search for people by the assigned lender user ID.
- [query] `contacted` (boolean): Search for people by whether or not they have been contacted.
- [query] `priceAbove` (integer): Search for people who have specified a price above a given value.
- [query] `priceBelow` (integer): Search for people who have specified a price below a given value.
- [query] `smartListId` (integer): Search for people that match a smart list with given ID.
- [query] `includeTrash` (boolean) default=False: Set whether to include people in the "trash" stage. (By default responses from /people will not include any people with a "trash" stage.)
- [query] `includeUnclaimed` (boolean) default=False: Set to include unclaimed leads offered to the current user.
- [query] `tags` (string): Search for people that match one or more tags. (e.g., "Foo,Bar" will match contacts with tags that include Foo OR Bar.)
- [query] `custom*` (string): You can include any of your Custom Fields in the request, these must be prefixed with "custom".  For example, if you have a *Closing Date* custom field, the JSON key for that field will be `customClosingDate`.  See [Custom Fields](doc:custom-fields-get) for more about Custom Fields.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "people",
    "offset": 0,
    "limit": 10,
    "total": 35
  },
  "people": [
    {
      "id": 10763,
      "created": "2013-10-31T23:04:30Z",
      "updated": "2014-06-27T13:11:23Z",
      "createdVia": "API",
      "lastActivity": "2014-06-27T13:11:23Z",
      "name": "Tom Minch",
      "firstName": "Tom",
      "lastName": "Minch",
      "stage": "Lead",
 


=================== https://docs.followupboss.com/reference/people-id-delete.md
# /people/:id

Delete a person by id.

### DELETE /people/{id}  — Delete a person by id.
- [path] `id` (integer) REQUIRED: ID of person.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/people-id-get.md
# /people/:id

Retrieve a person by id.

### GET /people/{id}  — Retrieve a person by id.
- [path] `id` (integer) REQUIRED: ID of the person.
- [query] `fields` (string): Comma separated list of fields to return. (e.g., `firstName,lastName,timeframeId,timeframeUpdated,timeframeStatus,customFieldName`) <br><br> Special values include `allCustom` (returns all custom fields) and `allFields` (returns all fields, including custom fields).
- RESPONSE 200 example: {
  "id": 14412,
  "created": "2016-03-31T16:42:27Z",
  "updated": "2016-11-17T03:44:00Z",
  "createdVia": "API",
  "lastActivity": "2016-11-17T05:01:02Z",
  "name": "William Riker",
  "firstName": "William",
  "lastName": "Riker",
  "prequalified": false,
  "stage": "Lead",
  "stageId": 2,
  "source": "<unspecified>",
  "sourceUrl": "",
  "contacted": 1,
  "price": 310000,
  "assignedLenderId": n
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/people-id-put.md
# /people/:id

Update a person by id.

> ❗️ Tag updates will overwrite all existing tags
>
> Please note that when using the tags property, all existing tags for a person will be overwritten to use the new list of tags provided.
>
> To merge new tags with the contact's existing tag list, set the `mergeTags` query parameter in the request URL to true.

> ❗️ Phone number updates will overwrite existing phone numbers
>
> The `phones` argument will overwrite all existing phone numbers, including those associated with relationships.
>
> For example, if a contact has phone numbers of `123-456-7890` and `123-456-7891` and you want to edit the second one to `123-456-7892`, you'll need to send the first one along with the updated second number. Similarly, if you wanted to add a number you need to send that with the existing set of phone numbers.

> 🚧 Altering email addresses and phone numbers of relationships
>
> Email addresses and phone numbers associated to relationships can be edited and deleted through `/v1/people` , however you cannot alter the `relationshipId` of a given email address or phone number through `/v1/people`. This must be done through [`/v1/peopleRelationships`](https://docs.followupboss.com/reference/peoplerelationships-id-put).

> 🚧 Changing the `contacted` field
>
> Changing the `contacted` field to `true` will pause action plans.

> 📘 Custom Fields
>
> If the account has custom fields defined you can also set these when updating a person. You can use the [customFields endpoint](https://docs.followupboss.com/docs/custom-fields-get)  to see which custom fields are available in the current account.
>
> To delete a custom field value on a person, set its value to null. (e.g., `customBirthday: null`)

### PUT /people/{id}  — Update a person by id.
- [path] `id` (integer) REQUIRED: ID of the person.
- [query] `mergeTags` (boolean) default=False: If set to true, this will merge the tags sent in the `tags` argument with the current list of tags. By default, it overwrites the existing tags.
- BODY (application/json):
  - `firstName` (string): The first/given name of the person.
  - `lastName` (string): The last/family name of the person.
  - `stage` (string) default=Lead: The stage the person is in. (e.g., "Lead" or "Trash". See [stage API endpoint](ref:stages-get) for more options.)
  - `contacted` (boolean): Whether the person has been contacted. (**Note**: Changing the `contacted` field to `true` will pause action plans.)
  - `price` (integer): The price of the property of the person's first inquiry, or the estimated sell/buy price for this person.
  - `assignedTo` (string): Full name of the agent assigned to this person.
  - `assignedUserId` (integer): ID of the agent assigned to this person.
  - `assignedPondId` (integer): ID of the pond assigned to this person.
  - `assignedLenderName` (string): Full name of the lender assigned to this person.
  - `assignedLenderId` (integer): ID of the lender assigned to this person.
  - `emails` (array<object{value:string, type:string, isPrimary:boolean}>): A list of email addresses associated with the person.
    - `value` (string) REQUIRED: The email address.
    - `type` (string): The type of email address (e.g., "work", "home")
    - `isPrimary` (boolean) default=False: Sets whether the email address is the primary address.
  - `phones` (array<object{value:string, isPrimary:boolean, type:string}>): A list of phone numbers associated with the person.
    - `value` (string) REQUIRED: The phone number. (e.g., 888-555-1234)
    - `isPrimary` (boolean) default=False: Sets whether this is the primary phone number.
    - `type` (string): Type of number (e.g., "mobile", "home", "fax", etc.)
  - `addresses` (array<object{type:string, street:string, city:string, state:string, code:string, country:string}>): A list of addresses associated with the person. (This is the address where this person can be contacted, it is not the address of a property this person may be interested in selling or buying).
    - `type` (string) default=home: The address type. (e.g., "home", "work", "mailing", "investment", etc.)
    - `street` (string): Street address. (e.g., "3595 South Higuera St., Suite B")
    - `city` (string): City name.
    - `state` (string): Abbreviated state code. (e.g., "CA", "NY", etc.)
    - `code` (string): Zipcode. (As a string, not a number.)
    - `country` (string): Country name. (e.g., "United States", "Japan", etc.)
  - `tags` (array<string>): A list of tags applied to the person. **This list will overwrite any existing tags for the person.** (To merge the tags passed with any existing tags,set the `mergeTags` query parameter in your request to true.)
  - `background` (string): Background information on the person. (Can be a multi-line string.)
  - `custom*` (string): You can include any of your Custom Fields in the request, these must be prefixed with "custom".  For example, if you have a *Closing Date* custom field, the JSON key for that field will be `customClosingDate`.  See [Custom Fields](doc:custom-fields-get) for more about Custom Fields.
  - `timeframeId` (integer): ID of the timeframe to move (Refer to the /timeframes endpoint for valid values of timeframeId.)
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/people-ignoreunclaimed.md
# /people/ignoreUnclaimed

Ignore a lead.

This endpoint is used to confirm that the user received a First To Claim offer, but chose not to claim the lead.

This endpoint will return `204 No Content` if ignoring the lead claim was successful and a `404 Not Found` if there is no person found that can be unclaimed.  Currently ignoring a claim doesn't do anything other than log when the user ignored the First To Claim offer.  (This helps us measure reliability of the First To Claim process.)

Ignored unclaimed leads will still be returned along with any other unclaimed leads.

### POST /people/ignoreUnclaimed  — Ignore a lead.
- [path] `personId` (integer) REQUIRED: Include the person ID of the lead you want to ignore either like this or in the POST body.
- BODY (application/json):
  - `personId` (integer): Include the person ID of the lead you want to ignore either like this or as part of the path.
- RESPONSE 204 example: 
- RESPONSE 404 example: {
  "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/people-post.md
# /people

Manually add a new person.

> ❗️ Avoid sending leads through /v1/people!
>
> Do not use `POST /v1/people` to send leads into Follow Up Boss. This will only create the person and **will not** run any automations.
>
> The best way to send leads into Follow Up Boss from an IDX website, real estate portal, your custom website or any other lead source is to use event notifications ([`POST /v1/events`](https://docs.followupboss.com/reference/events-post)).
>
> Advantages of using this method include:
>
> * Avoid creating duplicates. Follow Up Boss will automatically search for an existing contact and update it.
> * Event information (inquiry, viewed property, saved property as a favorite, etc) is recorded and shown in contact history and the dashboard.
> * Agent is notified about new lead via email / text message.
> * Action plans are applied to the lead (if configured).
> * Correct agent is assigned as per the Lead Flow screen.
> * Automatically searches for social profiles.

> 🚧 Source Information Can Only Be Set on Creation
>
> The `source` and `sourceUrl` fields can only be set once on the creation of a person. This **cannot** be changed via the [PUT request](https://docs.followupboss.com/reference/people-id-put).

> 📘 Custom Fields
>
> If the account has custom fields defined, you can also set these when adding a person. You can use the [customFields endpoint](https://docs.followupboss.com/docs/custom-fields-get)  to see which custom fields are available in the current account.

### POST /people  — Manually add a new person.
- [query] `deduplicate` (boolean) default=False: By default new people will be created even if there are existing people with the same email or phone. By passing true, deduplication logic will be used and, if a person is found, a 200 response will be returned along with response data for that existing person. No changes will be made based on the payload.
- BODY (application/json):
  - `createdAt` (string): Will set the creation time for the person, if wanting to create historical leads.
  - `firstName` (string): The first/given name of the person.
  - `lastName` (string): The last/family name of the person.
  - `stage` (string) default=Lead: The stage the person is in. (e.g., "Lead" or "Trash". See [stage API endpoint](ref:stages-get) for more options.)
  - `source` (string): The source of the lead.
  - `sourceUrl` (string): This is a direct link to the information about a person at the lead provider.
  - `contacted` (boolean): Whether the person has been contacted or not.
  - `price` (integer): The price of the property of the person's first inquiry, or the estimated sell/buy price for this person.
  - `assignedTo` (string): Full name of the agent assigned to this person.
  - `assignedUserId` (integer): ID of the agent assigned to this person.
  - `assignedPondId` (integer): ID of the pond assigned to this person.
  - `assignedLenderName` (string): Full name of the lender assigned to this person.
  - `assignedLenderId` (integer): ID of the lender assigned to this person.
  - `emails` (array<object{value:string, type:string, isPrimary:boolean}>): A list of email addresses associated with the person. (Specify type and value, isPrimary is not expected. The first email in the list will be the primary email address.)
    - `value` (string) REQUIRED: The email address.
    - `type` (string): The type of email address (e.g., "work", "home")
    - `isPrimary` (boolean) default=False: Sets whether the email address is the primary address.
  - `phones` (array<object{value:string, isPrimary:boolean, type:string}>): A list of phone numbers associated with the person. (Specify type and value, isPrimary is not expected. The first phone in the list will be the primary phone number.)
    - `value` (string) REQUIRED: The phone number. (e.g., 888-555-1234)
    - `isPrimary` (boolean) default=False: Sets whether this is the primary phone number.
    - `type` (string): Type of number (e.g., "mobile", "home", "fax", etc.)
  - `addresses` (array<object{type:string, street:string, city:string, state:string, code:string, country:string}>): A list of addresses associated with the person. (These are the addresses where this person can be contacted, it is not the address of a property this person may be interested in selling or buying).
    - `type` (string) default=home: The address type. (e.g., "home", "work", "mailing", "investment", etc.)
    - `street` (string): Street address. (e.g., "3595 South Higuera St., Suite B")
    - `city` (string): City name.
    - `state` (string): Abbreviated state code. (e.g., "CA", "NY", etc.)
    - `code` (string): Zipcode. (As a string, not a number.)
    - `country` (string): Country name. (e.g., "United States", "Japan", etc.)
  - `tags` (array<string>): A list of tags applied to the person.
  - `background` (string): Background information on the person. (Can be a multi-line string.)
  - `collaborators` (array<integer>): List of user ids to set as collaborators on this person. Not including a collaborator's user id in this array will remove them as a collaborator.
  - `custom*` (string): You can include any of your Custom Fields in the request, these must be prefixed with "custom".  For example, if you have a *Closing Date* custom field, the JSON key for that field will be `customClosingDate`.  See [Custom Fields](doc:custom-fields-get) for more about Custom Fields.
  - `timeframeId` (integer): ID of the timeframe to move (Refer to the /timeframes endpoint for valid values of timeframeId.)
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/peoplerelationships-id-delete.md
# /peopleRelationships/:id

Delete a relationship.

[block:callout]
{
  "type": "warning",
  "title": "Delete Access",
  "body": "To delete a relationship, you must have access to the parent person."
}
[/block]

### DELETE /peopleRelationships/{id}  — Delete a relationship.
- [path] `id` (integer) REQUIRED: The relationship ID to delete.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/peoplerelationships-id-get.md
# /peopleRelationships/:id

Get a specific relationship.

### GET /peopleRelationships/{id}  — Get a specific relationship.
- [path] `id` (integer) REQUIRED: The ID of a given relationship.
- RESPONSE 200 example: {
    "id": 423,
    "created": "2021-02-19T14:12:36Z",
    "updated": "2021-02-19T14:12:41Z",
    "createdById": 41,
    "updatedById": 41,
    "personId": 46977,
    "name": "Billy Bob",
    "firstName": "Billy",
    "lastName": "Bob",
    "type": "",
    "isPriority": false,
    "emails": [],
    "phones": [
        {
            "value": "5551113333",
            "type": "mobile",
            
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/peoplerelationships-id-put.md
# /peopleRelationships/:id

Update details of a specific relationship.

[block:callout]
{
  "type": "warning",
  "title": "Update Access",
  "body": "To update a relationship, you must have access to the parent person.\n\nThe `personId` of an existing relationship **cannot** be altered after it is created."
}
[/block]

[block:callout]
{
  "type": "danger",
  "title": "Updating Email Addresses, Phones, and Addresses",
  "body": "Sending an array of email address, phone, or address objects will **overwrite** the values that are already present for a relationship. (e.g., If there are two emails listed and you send one new email address, the two emails are removed and just the new one is saved.)\n\nIf you want to maintain existing email address, phone, and/or address objects while adding new ones, you must resend the current list and add any new ones to that array. \n\n(If these arrays are left blank, no changes are made.)"
}
[/block]

### PUT /peopleRelationships/{id}  — Update details of a specific relationship.
- [path] `id` (integer) REQUIRED: The ID of a given relationship.
- BODY (application/json):
  - `firstName` (string): The first/given name of the relationship.
  - `lastName` (string): The last/family name of the relationship.
  - `type` (string): The type of relationship. (e.g., `Spouse`, `Brother`, `Partner` , etc.)
  - `emails` (array<object{value:string, type:string, isPrimary:boolean}>): A list of email addresses associated with the relationship. (Specify type and value, `isPrimary` is not expected. The first email in the list will be the primary email address for the relationship.)
    - `value` (string) REQUIRED: The email address.
    - `type` (string): The type of email address (e.g., "work", "home")
    - `isPrimary` (boolean) default=False: Sets whether the email address is the primary address.
  - `phones` (array<object{value:string, isPrimary:boolean, type:string}>): A list of phone numbers associated with the relationship. (Specify type and value, `isPrimary` is not expected. The first phone in the list will be the primary phone number for the relationship.)
    - `value` (string) REQUIRED: The phone number. (e.g., 888-555-1234)
    - `isPrimary` (boolean) default=False: Sets whether this is the primary phone number.
    - `type` (string): Type of number (e.g., "mobile", "home", "fax", etc.)
  - `addresses` (array<object{type:string, street:string, city:string, state:string, code:string, country:string}>): A list of addresses associated with the relationship. (This is the address where this person can be contacted, it is not the address of a property this person may be interested in selling or buying).
    - `type` (string) default=home: The address type. (e.g., "home", "work", "mailing", "investment", etc.)
    - `street` (string): Street address. (e.g., "3595 South Higuera St., Suite B")
    - `city` (string): City name.
    - `state` (string): Abbreviated state code. (e.g., "CA", "NY", etc.)
    - `code` (string): Zipcode. (As a string, not a number.)
    - `country` (string): Country name. (e.g., "United States", "Japan", etc.)
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/peoplerelationships-post.md
# /peopleRelationships

Create a new relationship for a person.

### POST /peopleRelationships  — Create a new relationship for a person.
- BODY (application/json):
  - `personId` (integer) default=None: Person ID this relationship is associated with.
  - `firstName` (string): The first/given name of the relationship.
  - `lastName` (string): The last/family name of the relationship.
  - `type` (string): The type of relationship, e.g. `Spouse`, `Brother`, `Partner` , etc.
  - `emails` (array<object{value:string, type:string, isPrimary:boolean}>): A list of email addresses associated with the relationship. (Specify type and value, `isPrimary` is not expected. The first email in the list will be the primary email address for the relationship.)
    - `value` (string) REQUIRED: The email address.
    - `type` (string): The type of email address (e.g., "work", "home")
    - `isPrimary` (boolean) default=False: Sets whether the email address is the primary address.
  - `phones` (array<object{value:string, isPrimary:boolean, type:string}>): A list of phone numbers associated with the relationship. (Specify type and value, `isPrimary` is not expected. The first phone in the list will be the primary phone number for the relationship.)
    - `value` (string) REQUIRED: The phone number. (e.g., 888-555-1234)
    - `isPrimary` (boolean) default=False: Sets whether this is the primary phone number.
    - `type` (string): Type of number (e.g., "mobile", "home", "fax", etc.)
  - `addresses` (array<object{type:string, street:string, city:string, state:string, code:string, country:string}>): A list of addresses associated with the relationship. (This is the address where this person can be contacted, it is not the address of a property this person may be interested in selling or buying).
    - `type` (string) default=home: The address type. (e.g., "home", "work", "mailing", "investment", etc.)
    - `street` (string): Street address. (e.g., "3595 South Higuera St., Suite B")
    - `city` (string): City name.
    - `state` (string): Abbreviated state code. (e.g., "CA", "NY", etc.)
    - `code` (string): Zipcode. (As a string, not a number.)
    - `country` (string): Country name. (e.g., "United States", "Japan", etc.)
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/peoplerelationships.md
# /peopleRelationships

Get relationships between people in Follow Up Boss.

[block:callout]
{
  "type": "info",
  "title": "Relationship information available with /v1/people",
  "body": "If you are already using [`/v1/people`](https://docs.followupboss.com/reference/people-get) , it will include the email addresses and phone numbers of associated relationships. To include relationship information within `/v1/people` , add `relationships` to the `fields` query parameter of `/v1/people`. \n\nThis means for many use cases, `/v1/people` can still be primarily used to gather all pertinent information about a person and their relationships."
}
[/block]

[block:callout]
{
  "type": "info",
  "title": "isPriority",
  "body": "The `isPriority` boolean indicates that the `type` for this relationship is considered a priority for the current industry of the account. For example, `isPriority` is `true` occurs when the `type` indicates a spousal relationship with values such as `wife`, `husband`, `spouse`, etc."
}
[/block]

### GET /peopleRelationships  — Get relationships between people in Follow Up Boss.
- [query] `sort` (string): The sort order. Can be one of the following: `id`, `created`, `updated`, `name`, `firstName`, `lastName`, `personId`.
- [query] `personId` (integer): Filter relationships by a person ID.
- [query] `name` (string): Searches for person with a name like what is given. (e.g., If you search for `drew`, it might return a contact like `Andrew`.)
- [query] `firstName` (string): Searches for person with a first name like what is given. (e.g., If you search for `drew`, it might return a contact like `Andrew.`)
- [query] `lastName` (string): Searches for person with a last name like what is given. (e.g., If you search for `drew`, it might return a contact like `Andrew.`)
- RESPONSE 200 example: {
    "id": 423,
    "created": "2021-02-19T14:12:36Z",
    "updated": "2021-02-19T14:12:41Z",
    "createdById": 41,
    "updatedById": 41,
    "personId": 46977,
    "name": "Bily Bob",
    "firstName": "Billy",
    "lastName": "Bob",
    "type": "Husband",
    "isPriority": true,
    "emails": [],
    "phones": [
        {
            "value": "5551113333",
            "type": "mobile",
       
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/peopleunclaimed.md
# /people/unclaimed

Get unclaimed leads.

This endpoint lists leads which have not been claimed yet and can be claimed by the user whose API key you are using.  Unclaimed leads will be assigned to a fallback agent after a short amount of time (default is 15 minutes), so this list is usually empty.

[block:callout]
{
  "type": "info",
  "body": "If you want to see both regular and unclaimed leads, use [/people](https://docs.followupboss.com/reference/people-get) instead and specify `includeUnclaimed=true` as a query argument.",
  "title": "Getting All Leads"
}
[/block]

### GET /people/unclaimed  — Get unclaimed leads.
- [query] `limit` (integer) default=10: Number of results to return. (Max 100.)
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "people",
    "offset": 0,
    "limit": 10,
    "total": 1,
    "next": null,
    "nextLink": null,
  },
  "people": [
    {
      "id": 47362,
      "created": "2021-04-23T15:22:29Z",
      "name": "Toribio Sinaluisa",
      "firstName": "Toribio",
      "lastName": "Sinaluisa",
      "source": "Zillow",
      "sourceId": 730,
      "delayed": false,
       "p


=================== https://docs.followupboss.com/reference/personattachments-id-delete.md
# /personAttachments/:id

Delete an attachment by ID.

[block:callout]
{
  "type": "danger",
  "body": "External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).",
  "title": "Restricted - Registered Systems Only"
}
[/block]

### DELETE /personAttachments/{id}  — Delete an attachment by ID.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- [path] `id` (integer) REQUIRED: ID of the attachment.
- RESPONSE 200 example: {}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this API endpoint."
}
- RESPONSE 404 example: {
    "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/personattachments-id-get.md
# /personAttachments/:id

Retrieve an attachment by ID.

[block:callout]
{
  "type": "danger",
  "title": "Restricted - Registered Systems Only",
  "body": "External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification)."
}
[/block]

[block:callout]
{
  "type": "info",
  "body": "The attachments returned are limited to those **created by your registered system**. No other attachments will be returned.",
  "title": "Response Limitations"
}
[/block]

### GET /personAttachments/{id}  — Retrieve an attachment by ID.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- [path] `id` (integer) REQUIRED: ID of the attachment.
- RESPONSE 200 example: {
    "personId": 1,
    "fileName": "test.jpg",
    "fileSize": null,
    "id": 2,
    "mimeType": "link",
    "uri": "https://test.com/myfile",
    "thumbnailUri": null,
    "status": "created",
    "createdAt": "2022-11-16T03:44:52Z",
    "createdById": 1,
    "createdByName": "Olivia Admin",
    "is_external": 1,
    "system_id": 123
}
- RESPONSE 403 example: Third parties are not authorized to upload attachments via the API.


=================== https://docs.followupboss.com/reference/personattachments-id-put.md
# /personAttachments/:id

Update an attachment by ID.

[block:callout]
{
  "type": "danger",
  "body": "External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).",
  "title": "Restricted - Registered Systems Only"
}
[/block]

[block:callout]
{
  "type": "warning",
  "body": "The URI should be a link to a file location stored outside of Follow Up Boss. If a URI is not provided, the API will treat the request as an attempt to upload a file to our servers and return a 403.",
  "title": "URI - File Location"
}
[/block]

### PUT /personAttachments/{id}  — Update an attachment by ID.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- [path] `id` (integer) REQUIRED: ID of the attachment.
- BODY (application/json):
  - `personId` (integer) REQUIRED: ID of the person.
  - `uri` (string) REQUIRED: URI of an externally hosted file.
  - `fileName` (string) REQUIRED: Name of the file.
  - `fileSize` (integer): Size of the file in bytes.
- RESPONSE 200 example: {
    "personId": 1,
    "fileName": "test.jpg",
    "fileSize": null,
    "id": 2,
    "mimeType": "link",
    "uri": "https://test.com/myfile",
    "thumbnailUri": null,
    "status": "created",
    "createdAt": "2022-11-16T03:44:52Z",
    "createdById": 1,
    "createdByName": "Olivia Admin"
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this API endpoint."
}
- RESPONSE 404 example: {
    "errorMessage": "Requested resource was not found."
}


=================== https://docs.followupboss.com/reference/personattachments-post.md
# /personAttachments

Attach a file to a person.

[block:callout]
{
  "type": "danger",
  "body": "External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).",
  "title": "Restricted - Registered Systems Only"
}
[/block]

[block:callout]
{
  "type": "warning",
  "body": "The URI should be a link to a file location stored outside of Follow Up Boss. If a URI is not provided, the API will treat the request as an attempt to upload a file to our servers and return a 403.",
  "title": "URI - File Location"
}
[/block]

### POST /personAttachments  — Attach a file to a person.
- [header] `X-System` (string) REQUIRED: Registered system name.
- [header] `X-System-Key` (string) REQUIRED: Registered system API key.
- BODY (application/json):
  - `personId` (integer) REQUIRED: ID of the person.
  - `uri` (string) REQUIRED: URI of an externally hosted file.
  - `fileName` (string) REQUIRED: Name of the file.
  - `fileSize` (integer): Size of the file in bytes.
- RESPONSE 201 example: {
    "personId": 1,
    "fileName": "test.jpg",
    "fileSize": null,
    "id": 2,
    "mimeType": "link",
    "uri": "https://test.com/myfile",
    "thumbnailUri": null,
    "status": "created",
    "createdAt": "2022-11-16T03:44:52Z",
    "createdById": 1,
    "createdByName": "Olivia Admin"
}
- RESPONSE 403 example: {
    "errorMessage": "You do not have access to this endpoint."
}


=================== https://docs.followupboss.com/reference/pipelines-get.md
# /pipelines

Search for pipelines.

### GET /pipelines  — Search for pipelines.
- [query] `name` (string): The pipeline name to lookup. (Must be an exact match.)
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "pipelines",
    "offset": 0,
    "limit": 10,
    "total": 1
  },
  "pipelines": [
    {
      "id": 1,
      "name": "My Pipeline",
      "description": "A very cool pipeline",
      "orderWeight": 1000,
      "stages": [
        {
          "id": 10,
          "name": "Prospect",
          "description": "Prospective deals",
          "orderWeight": 1000
   
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/pipelines-id-delete.md
# /pipelines/:id

Delete a pipeline.

### DELETE /pipelines/{id}  — Delete a pipeline.
- [path] `id` (integer) REQUIRED: The id of the pipeline.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/pipelines-id-get.md
# /pipelines/:id

Retrieve a pipeline by id.

### GET /pipelines/{id}  — Retrieve a pipeline by id.
- [path] `id` (integer) REQUIRED: The id of the pipeline.
- RESPONSE 200 example: {
  "id": 1,
  "name": "Contact Pipeline",
  "description": "A pipeline for contacts",
  "orderWeight": 1000,
  "stages": [
    {
      "id": 1,
      "name": "Contact",
      "description": "",
      "orderWeight": 3000,
      "color": "#FFFFFF"
    },
    {
      "id": 2,
      "name": "Lead",
      "description": "",
      "orderWeight": 4000,
      "color": ""
    }
  ]
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/pipelines-id-put.md
# /pipelines/:id

Update a pipeline.

> 🚧 Require owner permissions
>
> Only the owner has access to create and modify pipelines.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

> 📘 Stage Updates
>
> If you wish to modify the stages of a pipeline, you may do so by passing the id of the stage with your stage objects. **Any stage objects that are missing ids will be created as new stages.**

### PUT /pipelines/{id}  — Update a pipeline.
- [path] `id` (integer) REQUIRED: The id of the pipeline.
- BODY (application/json):
  - `name` (string): Name of the pipeline.
  - `description` (string): Description of the pipeline.
  - `stages` (array<object{id:integer, name:string, description:string, orderWeight:integer, color:string, closedStage:boolean}>): An array of stage objects that should be associated with the pipeline.
    - `id` (integer): 
    - `name` (string) REQUIRED: 
    - `description` (string): 
    - `orderWeight` (integer): 
    - `color` (string): 
    - `closedStage` (boolean) REQUIRED default=False: 
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
  "name": "Buyer pipeline",
  "description": "A pipeline for buyers",
  "orderWeight": 1000,
  "stages": [
    {
      "id": 17,
      "name": "First Stage",
      "description": "",
      "orderWeight": 1000,
      "color": "#FFFFFF",
      "closedStage": false
    },
    {
      "id": 18,
      "name": "Second Stage",
      "description": "",
      "orderWeight": 2000,
      "color": "#000000"
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/pipelines-post.md
# /pipelines

Add a pipeline.

> 🚧 Require owner permissions
>
> Only the owner has access to create and modify pipelines.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### POST /pipelines  — Add a pipeline.
- BODY (application/json):
  - `name` (string) REQUIRED: Name of the pipeline.
  - `description` (string): Description of the pipeline.
  - `stages` (array<object{name:string, description:string, orderWeight:integer, color:string, closedStage:boolean}>): An array of stage objects that should be associated with the pipeline.
    - `name` (string) REQUIRED: 
    - `description` (string): 
    - `orderWeight` (integer): 
    - `color` (string): 
    - `closedStage` (boolean) REQUIRED default=False: 
  - `orderWeight` (integer): Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
	"name": "Buyer pipeline",
	"description": "A pipeline for buyers",
  "orderWeight": 1000,
  "stages": [
        {
          "name": "First Stage",
          "description": "",
          "orderWeight": 1000,
          "color": "#FFFFFF",
          "closedStage": false
        },
        {
          "name": "Second Stage",
          "description": "",
          "orderWeight": 2000,
          "clo
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/ponds-get.md
# /ponds

Get a list of ponds.

> 📘 User Id Information
>
> The `userId` field lists the Pond Lead Agent.
>
> For any contacts who have been released to a pond their `assigned_user_id` will be set to the Pond Lead Agent.  See [Lead Ponds Overview](https://help.followupboss.com/hc/en-us/articles/360048829034) for more information.
>
> The `userIds` (plural) field lists all the members of the pond.

### GET /ponds  — Get a list of ponds.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "ponds",
    "offset": 0,
    "limit": 10,
    "total": 2
  },
  "ponds": [
    {
      "id": 23,
      "name": "Palm Beach Pond",
      "userId": 14,
      "userIds": [ 14, 23, 24 ]
    },
    {
      "id": 79,
      "name": "Miami Pond",
      "userId": 15,
      "userIds": [ 26, 23, 15 ]
    }
  ]
}


=================== https://docs.followupboss.com/reference/ponds-id-delete.md
# /ponds/:id

Delete a pond by id.

> 📘 Reassigning Agents
>
> When deleting a Pond, Follow Up Boss will re-assign any contacts still in the pond to the agent you specify with the `assignTo` parameter.  The `assignTo` parameter is required.

### DELETE /ponds/{id}  — Delete a pond by id.
- [query] `assignTo` (integer) REQUIRED: Select which agent should receive any contacts currently in this pond after it is deleted.
- [path] `id` (integer) REQUIRED: The pond id.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/ponds-id-get.md
# /ponds/:id

Get a pond by id.

### GET /ponds/{id}  — Get a pond by id.
- [path] `id` (integer) REQUIRED: The pond id.
- RESPONSE 200 example:  {
      "id": 23,
      "name": "Palm Beach Pond",
      "userId": 14,
      "userIds": [ 14, 23, 24 ]
 }
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/ponds-id-put.md
# /ponds/:id

Update a pond by id.

> 🚧 Updating Pond Members
>
> You should always send the complete list of User ids in the `userIds` field if the field is present in your request.  To remove a user from the pond, first make a GET request to [/ponds/:id](ponds-id-get) to get the current members, remove any ids you wish to remove from the pond, add any ids of user you wish to add to the pond, and then send the full list of user ids back with a PUT request to this endpoint.

### PUT /ponds/{id}  — Update a pond by id.
- [path] `id` (integer) REQUIRED: The pond id.
- BODY (application/json):
  - `name` (string): Set this value to change the name of the Pond
  - `userId` (string): Set this value to change the Pond Lead Agent
  - `userIds` (string): Set this value to add or remove members from the pond
- RESPONSE 200 example: {
  "id": 83,
  "name": "Orlando Pond",
  "userId": 281,
  "userIds": [ 281, 301 ]
}


=================== https://docs.followupboss.com/reference/ponds-post.md
# /ponds

Create a pond.

> 📘 User Id Information
>
> The `userId` field sets the Pond Lead Agent.
>
> For any contacts who have been released to a pond their `assigned_user_id` will be set to the Pond Lead Agent.  See [Lead Ponds Overview](https://help.followupboss.com/hc/en-us/articles/360048829034) for more information.

### POST /ponds  — Create a pond.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of the pond you want to create
  - `userId` (integer) REQUIRED: The Pond Lead Agent
  - `userIds` (array<integer>) REQUIRED: IDs of all users to add as members of the pond
- RESPONSE 200 example: {
  "id": 83,
  "name": "Orlando Pond",
  "userId": 327,
  "userIds": [ 281, 301, 327 ]
}


=================== https://docs.followupboss.com/reference/rate-limiting.md

# Rate Limiting

# Overview

> 📘 System Identification
>
> Please ensure you have registered your system with Follow Up Boss as indicated in the [Identification](https://docs.followupboss.com/reference#identification) section.

> 📘 Rate Limit Increase
>
> If your system needs bigger limits, please email <api@followupboss.com> explaining your use case.

Rate limiting is enforced by the API and is based on a sliding 10 second window.

Within every response from our API, the following headers indicate the current limit, remaining requests before reaching the limit, the window of time evaluated in seconds, and the context.

Additionally, we indicate the context for which this rate limit applies. Any given endpoint will only be subject to one context. For example /v1/events may have an 'events' context, for which there may be stricter limits, requests to this endpoint would not affect other contexts, such as 'global'.

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 156
X-RateLimit-Window: 10
X-RateLimit-Context: global
```

Systems that exhaust their limits will receive a [429 (Too Many Requests)](https://httpstatuses.com/429) response code, and a Retry-After header.

If you receive a 429 response code, your request was not processed and you will have to retry the request.  The Retry-After header indicates how long to wait (in seconds) before retrying (or sending any other request).

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 0
X-RateLimit-Window: 10
X-RateLimit-Context: global
Retry-After: 8
```

# Default Settings

Here are the contexts available and their limits as they are currently set.  We will make changes as needed, so always check the headers for the most up-to-date values applicable to your requests.

| Context     | Limit       | Endpoints associated | Method |
| :---------- | :---------- | :------------------- | :----- |
| POST.events | unlimited\* | /v1/events           | POST   |
| events      | 20          | /v1/events           | GET    |
| global      | 250         | ALL                  | ALL    |
| PUT.people  | 25          | /v1/people           | PUT    |
| notes       | 10          | /v1/notes            | ALL    |

If you are making requests without a valid X-System-Key header, the allowed rate is much lower:

| Context     | Limit       | Endpoints associated | Method |
| :---------- | :---------- | :------------------- | :----- |
| POST.events | unlimited\* | /v1/events           | POST   |
| events      | 10          | /v1/events           | GET    |
| global      | 125         | ALL                  | ALL    |
| PUT.people  | 25          | /v1/people           | PUT    |
| PUT.notes   | 10          | /v1/notes            | PUT    |

You may in some cases also receive a [429 (Too Many Requests)](https://httpstatuses.com/429) even if you still have requests remaining.  Perhaps because we temporarily have less capacity than usual, or we notice an exceptionally high number of requests from a particular IP address or system.

Please make sure your system respects the 429 header even if X-RateLimit-Remaining shows you should have requests remaining.

# Monitoring Your Usage

Registered systems can query their own rate-limit usage and currently-configured limits via two endpoints:

* [`GET /v1/rateLimit/usage`](https://docs.followupboss.com/reference/ratelimit-usage-get) — 24-hour rolling totals (total requests, rate-limited requests, percentage, peak hour) alongside the currently-configured limits.
* [`GET /v1/rateLimit/limits`](https://docs.followupboss.com/reference/ratelimit-limits-get) — currently-configured limits only. Cheaper than `/usage` (no aggregation), use when you only need the limit values.

Both endpoints authenticate with your system credentials (`X-System` / `X-System-Key`) and return data scoped to your registered system only.

=================== https://docs.followupboss.com/reference/ratelimit-limits-get.md
# /rateLimit/limits

Currently-configured rate limits for the calling partner system. Cheaper than /v1/rateLimit/usage (no Redis fan-out).

> 📘 Currently-configured limits
>
> Returns the rate-limit configuration applied to the calling registered system.

> 📘 Use this for cheap polling
>
> If you only need to know your limits — not your usage — call this endpoint. It avoids the Redis aggregation that powers `/v1/rateLimit/usage`.

> 📘 Authentication
>
> Requires valid `X-System` and `X-System-Key` as request headers.

## Response

| Field                                | Type   | Description                                                                                                                             |
| :----------------------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `system`                             | string | The calling system's registered name.                                                                                                   |
| `current_limits.across_all_accounts` | object | Per-route global ceilings shared across all accounts using this system. `default` is the catch-all; named keys are per-route overrides. |
| `current_limits.per_account`         | object | Per-account ceilings (each individual account using this system gets this many requests).                                               |

## Example response

```json
{
  "system": "your-system",
  "current_limits": {
    "across_all_accounts": { "default": 750, "GET.people": 100 },
    "per_account": { "default": 25 }
  }
}
```

## Errors

| Status | Meaning                                         |
| :----- | :---------------------------------------------- |
| 401    | Missing or invalid user API key.                |
| 403    | Only registered systems can call this endpoint. |

## Related

* [GET /v1/rateLimit/usage](rate-limit-usage-get) — same `current_limits` plus 24h usage totals.
* [Rate Limiting](rate-limiting) — overview of how rate limiting is enforced.

### GET /v1/rateLimit/limits  — Currently-configured rate limits for the calling partner system. Cheaper than /v1/rateLimit/usage (no Redis fan-out).
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- RESPONSE 200 example: {
  "system": "your-system",
  "current_limits": {
    "across_all_accounts": { "default": 750, "GET.people": 100 },
    "per_account": { "default": 25 }
  }
}
- RESPONSE 403 example: {
  "error": "Only registered systems can use this endpoint."
}


=================== https://docs.followupboss.com/reference/ratelimit-usage-get.md
# /rateLimit/usage

24-hour request volume, rate-limit hits, and currently-configured limits for the calling partner system.

> 📘 Partner self-service visibility
>
> Returns a 24-hour rolling summary of API calls made by the calling registered system, plus the currently-configured rate limits. Use this in place of scraping per-response `X-RateLimit-...` headers when you want a wider view than the most-recent request.

> 📘 Authentication
>
> Requires valid `X-System` and `X-System-Key` request headers.

> 📘 Cache window
>
> The response is cached server-side for 30 seconds. Frequent polling within that window returns identical data — design your client to poll at most once per minute.

> 🚧 Limiter attribution not included
>
> This response totals *all* rate-limited requests but does not break them down by which limiter (global, per-route, per-account) triggered.

## Response

The aggregate window is exactly the last 24 hours, bucketed hourly. Per-hour buckets are summed for the totals; `peak_hour` is the hour with the highest combined (rate-limited + non-rate-limited) request count.

| Field                                      | Type         | Description                                                                                             |
| :----------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------ |
| `system`                                   | string       | The calling system's registered name.                                                                   |
| `period`                                   | string       | Always `last_24h`.                                                                                      |
| `usage.total_requests`                     | int          | All API calls attributed to this system in the trailing 24h.                                            |
| `usage.rate_limited_requests`              | int          | Subset of `total_requests` rejected by a global rate limiter.                                           |
| `usage.rate_limit_percentage`              | float        | `(rate_limited_requests / total_requests) * 100`, rounded to two decimals. `0` if there was no traffic. |
| `usage.peak_hour`                          | string\|null | ISO 8601 hour bucket (`YYYY-MM-DDTHH:00:00Z`) with the highest call count. `null` when no traffic.      |
| `usage.current_limits.across_all_accounts` | object       | Per-route global ceilings. `default` is the catch-all; named keys are per-route overrides.              |
| `usage.current_limits.per_account`         | object       | Per-account ceilings. Same shape as `across_all_accounts`.                                              |

## Example response

```json
{
  "system": "your-system",
  "period": "last_24h",
  "usage": {
    "total_requests": 1247,
    "rate_limited_requests": 23,
    "rate_limit_percentage": 1.84,
    "peak_hour": "2026-05-19T14:00:00Z",
    "current_limits": {
      "across_all_accounts": { "default": 750, "GET.people": 100 },
      "per_account": { "default": 25 }
    }
  }
}
```

## Errors

| Status | Meaning                                         |
| :----- | :---------------------------------------------- |
| 401    | Missing or invalid user API key.                |
| 403    | Only registered systems can call this endpoint. |

## Related

* [GET /v1/rateLimit/limits](rate-limit-limits-get) — currently-configured limits only (cheaper).
* [Rate Limiting](rate-limiting) — overview of how rate limiting is enforced.

### GET /v1/rateLimit/usage  — 24-hour request volume, rate-limit hits, and currently-configured limits for the calling partner system.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- RESPONSE 200 example: {
  "system": "your-system",
  "period": "last_24h",
  "usage": {
    "total_requests": 1247,
    "rate_limited_requests": 23,
    "rate_limit_percentage": 1.84,
    "peak_hour": "2026-05-19T14:00:00Z",
    "current_limits": {
      "across_all_accounts": { "default": 750, "GET.people": 100 },
      "per_account": { "default": 25 }
    }
  }
}
- RESPONSE 403 example: {
  "error": "Only registered systems can use this endpoint."
}


=================== https://docs.followupboss.com/reference/reactions-reftype-refid-delete.md
# /reactions/:refType/:refId

Delete a reaction

### DELETE /reactions/{refType}/{refId}  — Delete a reaction
- [path] `refType` (string enum['Note', 'Call', 'ThreadedReply']) REQUIRED: The type of entity that is being reacted to.
- [path] `refId` (string) REQUIRED: The ID of the type of item that is being reacted to.
- [query] `emoji` (string): Single character emoji reaction to delete
- BODY (application/json):
- RESPONSE 204 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/reactions-reftype-refid-post.md
# /reactions/:refType/:refId

Add a reaction to a corresponding reference data object, e.g. "Note" or "ThreadedReply"

### POST /reactions/{refType}/{refId}  — Add a reaction to a corresponding reference data object, e.g. "Note" or "ThreadedReply"
- [path] `refType` (string enum['Note', 'Call', 'ThreadedReply']) REQUIRED: The type of entity that is being reacted to.
- [path] `refId` (integer) REQUIRED: The ID of the type of item that is being reacted to.
- BODY (application/json):
  - `body` (string): The single-character emoji reaction.
- RESPONSE 201 example: []
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/reactions.md

# Reactions

Add a reaction to a corresponding reference data object, e.g. "Note" or "ThreadedReply".

> 🚧 Beta Feature
>
> This is a beta feature! These API endpoints are subject to change.

> 📘 refType Arguments
>
> For the `refType` arguments, the only valid values are: `Note` and `ThreadedReply`.

The api key owner will always be the creator of a Reaction. Therefore, only the api key owner can delete their own reaction.

[Requesting Notes](https://docs.followupboss.com/reference/notes-id-get) with the `includeReactions=true` parameter will include the reactions within the note payload:

```json json
{
    "_metadata": { ... },
    "notes": [
        {
            "id": 2138636,
            ...
          "reactions": [
           		{
              		"id": 1363,
                  "created": "2024-03-21T21:14:13Z",
                  "createdBy": "Tom Minch",
                  "createdById": 1,
                  "refType": "Note",
                  "refId": 2144705,
                  "body": "🤯"
            	}
          ]
        }
    ]
}
```

=================== https://docs.followupboss.com/reference/reactionsnoteid.md
# /reactions/:id

Fetch a reaction

### GET /reactions/{id}  — Fetch a reaction
- [path] `id` (integer) REQUIRED: The ID of the reaction.
- RESPONSE 200 example: {
    "id": 1363,
    "created": "2024-03-21T21:14:13Z",
    "createdBy": "Tom Minch",
    "createdById": 1,
    "refType": "Note",
    "refId": 2144705,
    "body": "🤯"
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/requests-and-responses.md

# Requests and Responses

# Overview

Follow Up Boss API uses JSON encoding. When sending POST and PUT requests, the request body should contain JSON-encoded data to create or update a resource. We also recommend including a header indicating the content type of the request body: `Content-Type: application/json`

For example, to update the first name of a person with ID = 123 you can use the following request:

```http
PUT /v1/people/123 HTTP/1.1
Content-Type: application/json
...
{"firstName": "Mary"}
```

Likewise, the response body is also encoded using JSON format.

```json
{
   "id": 123,
   "created": "2012-04-23T02:23:11Z",
   "updated": "2012-04-23T02:23:11Z",
   "lastActivity": "2012-04-23T02:23:11Z",
   "name": "Mary Mcmillan",
   "firstName": "Mary",
   "lastName": "Mcmillan",
   "stage": "Lead",
   "source": "Zillow",
   ...
}
```

# Date Format

We use the [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) standard for all date and time values.

Time is always expressed in the UTC time zone.

# Response Codes

On success for new resources, you will get a `201 Created` or `200 OK` response if an existing resource was updated.

# Response Bodies

In general, response bodies for creating or updating resources will be in the same format as returned by a GET request for that resource.

=================== https://docs.followupboss.com/reference/searching.md

# Searching

# Overview

When listing resources in a collection you can filter results by specifying search conditions as query parameters in the URL. For example, to search person by email address you can use this:

```http
GET /v1/people?email=john%40gmail.com
```

You can specify multiple search criteria and they will be combined using "AND" logic. For example, to find past clients that came from Zillow use this request:

```http
GET /v1/people?stage=Past%20Client&source=Zillow
```

=================== https://docs.followupboss.com/reference/send-in-a-lead.md

# Sending in Leads

# Overview

The best way to send leads into Follow Up Boss from an IDX website, real estate portal, custom website, or any other lead source is to use the [event notifications endpoint](https://boss.readme.io/docs/events-post) (Example, `POST /v1/events`).

The advantages of using this method include:

* Avoid creating duplicates, Follow Up Boss will automatically search for existing contacts and update them.
* Event information (inquiry, viewed property, saved property as a favorite, etc) is recorded and shown in contact history and dashboard.
* Agent is notified about new leads via email/text message.
* Action plan is applied to the lead (if configured and when particular event types are used).
* Correct agent is assigned as per Lead Flow screen.
* Automatic search for social profiles.

> ❗️ Avoid sending leads through `POST /v1/people`.
>
> Please do not use `POST /v1/people` to send leads into FUB. It will create a person but **will not** run any automations listed above. Instead, use `POST /v1/events`.

=================== https://docs.followupboss.com/reference/smartlist-id-get.md
# /smartLists/:id

Retrieve a Smart List by id.

### GET /smartLists/{id}  — Retrieve a Smart List by id.
- [path] `id` (integer) REQUIRED: The ID of the Smart List.
- RESPONSE 200 example: {
  "id": 6,
  "name": "Pending"
}


=================== https://docs.followupboss.com/reference/smartlists-get.md
# /smartLists

Get a list of Smart Lists.

### GET /smartLists  — Get a list of Smart Lists.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `fub2` (boolean) default=False: By default this endpoint only returns Smart Lists created in the classic version of our UI. To return Smart Lists created in our current version, use this parameter.
- [query] `all` (boolean) default=False: Use this parameter to show all smart lists, whether from FUB Classic or FUB.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "smartlists",
    "offset": 0,
    "limit": 100,
    "total": 3
  },
  "smartlists": [
        {
            "id": 14,
            "name": "Stay In Touch",
            "isFub2": false,
            "description": null,
            "defaultSmartListId": null
        },
        {
            "id": 13,
            "name": "Email Activity",
            "isFub2": fal


=================== https://docs.followupboss.com/reference/stage-id-delete.md
# /stages/:id

Delete a stage.

> ❗️ Protected Stages
>
> If the `isProtected` property of a stage is `true`, you can not delete the stage.

### DELETE /stages/{id}  — Delete a stage.
- [path] `id` (integer) REQUIRED: The id of the stage to delete.
- [query] `assignStageId` (integer) REQUIRED: The stage id to assign to action plans referencing the deleted stage.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/stages-get.md
# /stages

Retrieve a list of stages.

### GET /stages  — Retrieve a list of stages.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `sort` (string) default=orderWeight: Sorts the stages by `orderWeight`, `id` or `name`.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "stages",
    "offset": 0,
    "limit": 20,
    "total": 8
  },
  "stages": [
    {
      "id": 1,
      "name": "Contact",
      "orderWeight": 1000,
      "isProtected": false,
      "peopleCount": 16
    },
    {
      "id": 5,
      "name": "Buyer",
      "orderWeight": 2000,
      "isProtected": false,
      "peopleCount": 40
    },
    {
      "id": 2,
  


=================== https://docs.followupboss.com/reference/stages-id-get.md
# /stages/:id

Get a stage by id.

### GET /stages/{id}  — Get a stage by id.
- [path] `id` (integer) REQUIRED: The id of the stage to retrieve.
- RESPONSE 200 example: {
  "id": 7,
  "name": "Pending",
  "orderWeight": 7000,
  "isProtected": false,
  "peopleCount": 10
}


=================== https://docs.followupboss.com/reference/stages-id-put.md
# /stages/:id

Update a stage.

> 🚧 Protected Stages
>
> If the `isProtected` property of a stage is `true`, you can not update the name.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been updated, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### PUT /stages/{id}  — Update a stage.
- [path] `id` (integer) REQUIRED: The id of the stage to update.
- BODY (application/json):
  - `name` (string): Name of the stage
  - `orderWeight` (integer): Helps to set a specific sort order.
- RESPONSE 200 example: {
  "id": 7,
  "name": "Pending",
  "orderWeight": 7000,
  "isProtected": false,
  "peopleCount": 10
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/stages-post.md
# /stages

Create a new stage.

> 📘 Order Weights
>
> You can create a custom sort order by setting the `orderWeight` field. For example, if you have one option with an `orderWeight` of 10000 and another of 11000, you can create a new stage with an `orderWeight` of 10500 that would be placed between them.
>
> However, once the stage has been created, the `orderWeight` for all stages will be recalculated to enforce the new ordering with gaps of 1000. In the previous example, that means the value that was at 11000 will be moved to 12000 and the new one created at 10500 becomes 11000.

### POST /stages  — Create a new stage.
- BODY (application/json):
  - `name` (string) REQUIRED: Name of the stage.
  - `orderWeight` (integer) default=1000: Set this value to enforce a specific sort order.
- RESPONSE 200 example: {
  "id": 7,
  "name": "Pending",
  "orderWeight": 7000,
  "isProtected": false,
  "peopleCount": 10
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/support-and-help.md

# Support and Help

Need help with using our API? Have questions about how to build an integration with us?

Email us at <api@followupboss.com> and we'll be happy to assist!

=================== https://docs.followupboss.com/reference/tasks-get.md
# /tasks

Get a list of tasks.

### GET /tasks  — Get a list of tasks.
- [query] `personId` (integer): Find tasks by a person's id.
- [query] `assignedTo` (string): Find tasks assigned to a specific user using their full name.
- [query] `assignedUserId` (integer): Find tasks assigned to a specific user by id.
- [query] `name` (string): Find tasks where the name is like what you pass in. (e.g., "world" would find a task named "hello world")
- [query] `type` (string): Find tasks by the following types: `Follow Up`, `Call`, `Email`, `Text`, `Appointment`, `Showing`, `Closing`, `Open House` or `Thank You`. (Note: A comma separated list of types is accepted.)
- [query] `isCompleted` (boolean): Find tasks that have been completed or not completed.
- [query] `due` (string): Find tasks that fall into the following ranges: `today`, `overdue` and `upcoming`.
- [query] `dueStart` (string): Finds tasks that are due from this time forward.
- [query] `dueEnd` (string): Find tasks that are due from this time and before.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "tasks",
    "offset": 0,
    "limit": 1,
    "total": 126
  },
  "tasks": [
    {
      "id": 4066,
      "created": "2016-12-07T15:50:47Z",
      "updated": "2016-12-07T15:50:47Z",
      "completed": "2017-01-24T17:20:49Z",
      "createdBy": "Gerald Leenerts",
      "updatedBy": "Gerald Leenerts",
      "personId": 15013,
      "AssignedTo": "Gerald Leenerts


=================== https://docs.followupboss.com/reference/tasks-id-delete.md
# /tasks/:id

Delete a task.

### DELETE /tasks/{id}  — Delete a task.
- [path] `id` (integer) REQUIRED: The id of the task to delete.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/tasks-id-get.md
# /tasks/:id

Get a task by id.

### GET /tasks/{id}  — Get a task by id.
- [path] `id` (integer) REQUIRED: The ID of the task to get.
- RESPONSE 200 example: {
  "id": 4066,
  "created": "2016-12-07T15:50:47Z",
  "updated": "2016-12-07T15:50:47Z",
  "completed": null,
  "createdBy": "Gerald Leenerts",
  "updatedBy": "Gerald Leenerts",
  "personId": 15013,
  "AssignedTo": "Gerald Leenerts",
  "assignedUserId": 1,
  "name": "Follow Up",
  "type": "Follow Up",
  "isCompleted": 0,
  "dueDate": null,
  "dueDateTime": null,
  "person": {
    "id": 15013,
   


=================== https://docs.followupboss.com/reference/tasks-id-put.md
# /tasks/:id

Update a task.

### PUT /tasks/{id}  — Update a task.
- [path] `id` (integer) REQUIRED: The id of the task to update.
- BODY (application/json):
  - `personId` (integer): The id of the person this task is related to.
  - `assignedTo` (string): The full name of the agent to assign to this task.
  - `assignedUserId` (integer): The id of the user to assign to this task.
  - `name` (string): The name of the task.
  - `type` (string enum['Follow Up', 'Call', 'Text', 'Email', 'Appointment', 'Showing', 'Closing', 'Open House', 'Thank You']): Type can be one of the following: `Follow Up`, `Call`, `Email`, `Appointment`, `Showing`, `Closing`, `Open House` or `Thank You`
  - `isCompleted` (boolean): Sets whether the task is completed or not.
- RESPONSE 200 example: {
  "id": 4066,
  "created": "2016-12-07T15:50:47Z",
  "updated": "2016-12-07T15:50:47Z",
  "completed:" null,
  "createdBy": "Gerald Leenerts",
  "updatedBy": "Gerald Leenerts",
  "personId": 15013,
  "AssignedTo": "Gerald Leenerts",
  "assignedUserId": 1,
  "name": "Follow Up",
  "type": "Follow Up",
  "isCompleted": 0,
  "dueDate": null,
  "dueDateTime": null,
  "person": {
    "id": 15013,
   


=================== https://docs.followupboss.com/reference/tasks-post.md
# /tasks

Create a new task.

### POST /tasks  — Create a new task.
- BODY (application/json):
  - `personId` (integer) REQUIRED: The id of the person this task is related to.
  - `assignedTo` (string): The full name of the agent to assign this task. (Note: This is required if `assignedUserId` is empty.)
  - `assignedUserId` (integer): The id of the user to assign to this task. (Note: This is required if `assignedTo` is empty.)
  - `name` (string): The name of the task.
  - `type` (string enum['Follow Up', 'Call', 'Text', 'Email', 'Appointment', 'Showing', 'Closing', 'Open House', 'Thank You']): Type can be one of the following: `Follow Up`, `Call`, `Text`, `Email`, `Appointment`, `Showing`, `Closing`, `Open House` or `Thank You`
  - `isCompleted` (boolean): Sets whether the task is completed or not.
  - `dueDate` (string): Due date for this task in YYYY-MM-DD format.
  - `dueDateTime` (string): Due date for this task with a time included that also supports timezone suffixes. (e.g., 2004-11-16T03:00:00 -05:00)
  - `remindSecondsBefore` (integer): Set a reminder for the task to be sent via email and desktop notification. This is only available for tasks with a due time set.
- RESPONSE 200 example: {
  "id": 4066,
  "created": "2016-12-07T15:50:47Z",
  "updated": "2016-12-07T15:50:47Z",
  "createdBy": "Gerald Leenerts",
  "updatedBy": "Gerald Leenerts",
  "personId": 15013,
  "AssignedTo": "Gerald Leenerts",
  "assignedUserId": 1,
  "name": "Follow Up",
  "type": "Follow Up",
  "isCompleted": 0,
  "dueDate": null,
  "dueDateTime": null,
  "completed": null,
  "person": {
    "id": 15013,
   


=================== https://docs.followupboss.com/reference/teaminboxes.md
# /teamInboxes

Get a list of Team Inboxes

This endpoint returns a list of shared Team Inboxes for your FUB account, along with their names, IDs, and a list of Users who have access to each Team Inbox.

### GET /teamInboxes  — Get a list of Team Inboxes
- RESPONSE 200 example: {
    "_metadata": {
        "collection": "teamInboxes",
        "offset": 0,
        "limit": 10,
        "total": 2,
        "next": "abc123",
        "nextLink": "https://yourdomain.reclients.com/api/v1/teamInboxes?next=abc123",
    },
    "teamInboxes": [
        {
            "id": 123,
            "name": "My Team Inbox",
            "users": [
                {
                    "id": 11
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/teams-get.md
# /teams

Get a list of teams.

> ❗️ Teams Access
>
> Not all plans have access to the teams feature. If you do not have access to teams, this endpoint will return a `200 OK` response with an empty teams list.

> 🚧 Team Icons
>
> In the Follow Up Boss user interface, teams also have a unicode icon associated with them. This is currently **not** available via the API.  Please use the Admin -> Teams user interface in Follow Up Boss to edit team icons.

> 📘 Default Team
>
> The team id of 1 is the default company team and always includes all users in the account.

### GET /teams  — Get a list of teams.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "teams",
    "offset": 0,
    "limit": 10,
    "total": 3,
    "next": null,
  },
  "teams": [
    {
      "id": 8,
      "name": "Palm Beach Team",
      "userIds": [ 12, 14, 23 ],
      "leaderIds": [ 14 ]
    },
    {
      "id": 5,
      "name": "Orlando Team",
      "userIds": [ 11, 15 ],
      "leaderIds": [ 11 ]
    },
    {
      "id": 1,
      "name": 


=================== https://docs.followupboss.com/reference/teams-id-delete.md
# /teams/:id

Delete a team by id.

> 📘 Moving Team Members
>
> If you wish to merge two teams, you can set the optional `moveToTeamId` parameter.  If `moveToTeamId` is set, any members of the team being deleted will be made a member of the specified team.

### DELETE /teams/{id}  — Delete a team by id.
- [path] `id` (string) REQUIRED: The team id.
- [query] `moveToTeamId` (integer): If you wish to merge two teams, use this parameter to indicate that all members of the current team should be made a member of the target team before this team is deleted.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/teams-id-get.md
# /teams/:id

Get a team by id.

### GET /teams/{id}  — Get a team by id.
- [path] `id` (string) REQUIRED: The team id.
- RESPONSE 200 example:  {
      "id": 8,
      "name": "Palm Beach Team",
      "userIds": [ 12, 14, 23 ],
      "leaderIds": [ 14 ]
 }


=================== https://docs.followupboss.com/reference/teams-id-put.md
# /teams/:id

Update a team by id.

> 🚧 Updating Team Members
>
> You should always send the complete list of User IDs in the `userIds` and `leaderIds` fields if the field is present in your request.  To remove a user from the team, first make a GET request to [/teams/:id](teams-id-get) to get the current list of users, remove the id you wish to remove from the team, and then send the now changed full list of user ids back with a PUT request to this endpoint.
>
> Similarly, to make someone a leader of the team, or demote someone to a regular member of the team, first make a GET request to [/teams/:id](teams-id-get) to get the current list of leaders, make your changes, and send back the changed list with a PUT request to this endpoint.

### PUT /teams/{id}  — Update a team by id.
- [path] `id` (integer) REQUIRED: The team id.
- BODY (application/json):
  - `name` (string): The team name.
  - `userIds` (array<integer>): The complete list of members of this team.
  - `leaderIds` (array<integer>): The complete list of team leaders.
- RESPONSE 200 example: {
  "name": "Miami Team",
  "userIds": [
    18,
    23,
    281,
    301
  ],
  "leaderIds": [23 ]
}


=================== https://docs.followupboss.com/reference/teams-post.md
# /teams

Create a new team.

### POST /teams  — Create a new team.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of the team.
  - `userIds` (array<integer>) REQUIRED: An array of user IDs that will be member of this team.
  - `leaderIds` (array<integer>): The complete list of team leaders.
- RESPONSE 200 example: {
  "id": 24,
  "name": "Miami Team",
  "userIds": [
    18,
    281,
    301
  ],
  "leaderIds": []
}
- RESPONSE 403 example: {"errorMessage":"You do not have access to teams."}


=================== https://docs.followupboss.com/reference/templates-get.md
# /templates

Lists all email templates.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

### GET /templates  — Lists all email templates.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "templates",
    "offset": 0,
    "limit": 10,
    "total": 5
  },
  "templates": [
    {
      "id": 6,
      "created": "2014-02-28T08:45:46Z",
      "updated": "2014-08-12T17:24:22Z",
      "createdById": 14,
      "updatedById": 14,
      "name": "I am here to help",
      "isMobile": 1,
      "isShared": true,
      "body": "Hi %contact_first_name%, I am h


=================== https://docs.followupboss.com/reference/templates-id-delete.md
# /templates/:id

Delete an email template.

> 🚧 Templates and Action Plans
>
> If you try to delete a template which is still in use by an Action Plan, you will get a `403 Forbidden` response.
>
> You can make a GET request to [/templates/:id](templates-id-get) to see which Action Plans are currently using the template.

### DELETE /templates/{id}  — Delete an email template.
- [path] `id` (integer) REQUIRED: The ID of the template to delete.
- RESPONSE 200 example: {}
- RESPONSE 403 example: {"errorMessage":"This template cannot be deleted."}


=================== https://docs.followupboss.com/reference/templates-id-get.md
# /templates/:id

Retrieve an email template by id, optionally merging fields.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

### GET /templates/{id}  — Retrieve an email template by id, optionally merging fields.
- [path] `id` (integer) REQUIRED: The ID of the template.
- [query] `mergePersonId` (integer): When specified, the returned template will have its merge fields filled out with the specified person record and the current user record.
- RESPONSE 200 example: {
  "id": 6,
  "created": "2014-02-28T08:45:46Z",
  "updated": "2014-08-12T17:24:22Z",
  "createdById": 14,
  "updatedById": 14,
  "name": "I am here to help",
  "isMobile": 1,
  "isShared": true,
  "body": "Hi %contact_first_name%, I am here to help, ...",
  "subject": "Your property inquiry from Zillow",
  "isEditable": true,
  "isDeletable": true,
  "actionPlans": [
    {
        "id": 1,
     


=================== https://docs.followupboss.com/reference/templates-id-put.md
# /templates/:id

Update an email template.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

> 🚧 Merge Field Support
>
> Only the `subject` and `body` support Merge Fields.

### PUT /templates/{id}  — Update an email template.
- [path] `id` (string) REQUIRED: The ID of the email template.
- BODY (application/json):
  - `name` (string) REQUIRED: The new name for the email template.
  - `subject` (string) REQUIRED: The new subject for the email template.
  - `body` (string) REQUIRED: The new body for the email template.
- RESPONSE 200 example: {
  "id": 845,
  "name": "Beach House promo",
  "subject": "Check out this beach house!",
  "body": "%greeting_time%,&nbsp;%contact_first_name%<br><br>Check out this beach house: <a href=\"https://example.com\">https://example.com</a><br><br>",
  "isShared": true
}


=================== https://docs.followupboss.com/reference/templates-merge.md
# /templates/merge

Merge an email template with multiple recipients.

If you are merging an email sent to multiple recipients, you can include their details in the "recipients" field.  This field should have a "to" field with all the recipients from the To: email field.  You can include "cc", "bcc", and "from" keys as well, but they're currently not used.

The "recipients.to" field should be an array of recipients, with each entry containing the email address of that recipient, and optionally their name.

The first recipient in this list which matches either the Person ID or one of their relationships will be used for all %contact\_\*% merge fields.  The %contact\_rels\_first\_name% field will return the list of first names.

For example, with the request body below you would get:

* %contact\_name% is replaced with "Bob Alvarez"
* %contact\_rels\_first\_name% is replaced with "Bob, Alice and Carol"

### POST /templates/merge  — Merge an email template with multiple recipients.
- BODY (application/json):
  - `templateId` (integer): The ID of the email template.
  - `mergePersonId` (integer): Person ID to use for merge fields like %contact_name%.
  - `recipients` (object{to:array<object{name:string, email:string}>}): List of recipients in the To: field of this email.
    - `to` (array<object{name:string, email:string}>): 
      - `name` (string): 
      - `email` (string): 
- RESPONSE 200 example: {
  "id": 6,
  "created": "2014-02-28T08:45:46Z",
  "updated": "2021-08-15T17:24:22Z",
  "createdById": 14,
  "updatedById": 14,
  "name": "I am here to help",
  "isMobile": 1,
  "isShared": true,
  "body": "Hi Bob, I am here to help, ...",
  "subject": "Your property inquiry from Zillow",
  "isEditable": true,
  "isDeletable": true
}


=================== https://docs.followupboss.com/reference/templates-post.md
# /templates

Create a new email template.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

> 🚧 Merge Field Support
>
> Only the `subject` and `body` support Merge Fields.

### POST /templates  — Create a new email template.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of the new email template.
  - `subject` (string) REQUIRED: The email subject used when this email template is selected.
  - `body` (string) REQUIRED: The HTML body of the email template.
  - `isShared` (boolean): Indicates whether this email template should be shared with other users in the same Follow Up Boss account.
- RESPONSE 201 example: {
  "id": 526,
  "created": "2021-06-21T21:23:12Z",
  "updated": "2021-06-21T21:23:12Z",
  "createdById": 15,
  "updatedById": 15,
  "name": "Beach House promo",
  "imported": 0,
  "isMobile": 0,
  "isShared": true,
  "body": "%greeting_time%, %contact_first_name%<br /><br />Check out this beach house: <a href=\"https://example.com\">https://example.com</a><br /><br />",
  "subject": "Check out th


=================== https://docs.followupboss.com/reference/textmessages-get.md
# /textMessages

List text messages for a person or phone number.

> 🚧 Restricted Results
>
> Some text message data is not accessible via API and is only visible within the Follow Up Boss application.

> 📘 Participants
>
> The `participants` field in the response is only present on group texts.

### GET /textMessages  — List text messages for a person or phone number.
- [query] `personId` (integer): Filter text messages for a specific person id only.
- [query] `toNumber` (string): Filter text messages sent to a specific recipient's phone number.
- [query] `fromNumber` (string): Filter text messages sent from a specific sender's phone number.
- RESPONSE 200 example: {
    "_metadata": {
        "collection": "textmessages",
        "offset": 0,
        "limit": 10,
        "total": 1,
        "next": null,
        "nextLink": null
    },
    "textmessages": [
        {
            "id": 14,
            "created": "2020-08-06T21:07:51Z",
            "updated": "2020-08-06T21:07:51Z",
            "createdById": 1,
            "updatedById": 1,
            "pers
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/textmessages-id-get.md
# /textMessages/:id

Retrieve a text message by id.

> 🚧 Restricted Results
>
> Some text message data is not accessible via API and is only visible within the Follow Up Boss application.

### GET /textMessages/{id}  — Retrieve a text message by id.
- [path] `id` (integer) REQUIRED: The id of the text message record.
- RESPONSE 200 example: {
    "id": 752,
    "created": "2020-08-07T20:28:31Z",
    "updated": "2020-08-07T20:28:31Z",
    "createdById": 1,
    "updatedById": 1,
    "personId": 1,
    "name": "William Riker",
    "firstName": "William",
    "lastName": "Riker",
    "picture": null,
    "userId": 1,
    "userName": "Tom Minch",
    "status": "Sent",
    "message": "Content is hidden for privacy reasons.",
    "fromNumbe
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/textmessages-post.md
# /textMessages

Create a record of an externally sent text message.

> ❗️ Restricted - Registered Systems Only
>
> External systems requesting to hit this endpoint must be registered with Follow Up Boss. To learn more, see the section on [Identification](https://docs.followupboss.com/reference/identification).

Text messages created through the API are recorded as logs only. **No actual text messages are sent.**

### POST /textMessages  — Create a record of an externally sent text message.
- [header] `X-System` (string) REQUIRED: The name of the registered system sending the API request.
- [header] `X-System-Key` (string) REQUIRED: The secret key of the registered system sending the API request.
- BODY (application/json):
  - `personId` (integer) REQUIRED: The id of the person associated with the text message.
  - `message` (string) REQUIRED: The body of the text message.
  - `toNumber` (string) REQUIRED: The phone number the text message was sent to (e.g., 888-555-1234).
  - `fromNumber` (string) REQUIRED: The phone number the text messages was sent from (e.g., 888-555-9876).
  - `isIncoming` (boolean) default=False: Set whether the text was outgoing to a person or incoming from a person.
  - `externalLabel` (string): An optional descriptive text that appears in the byline of the text message record on the person's timeline.
  - `externalUrl` (string): An optional link that will appear in the byline of the text message record in the timeline.
- RESPONSE 200 example: {
    "id": 752,
    "created": "2020-08-07T20:28:31Z",
    "updated": "2020-08-07T20:28:31Z",
    "createdById": 1,
    "updatedById": 1,
    "personId": 1,
    "name": "William Riker",
    "firstName": "William",
    "lastName": "Riker",
    "picture": null,
    "userId": 1,
    "userName": "Tom Minch",
    "status": "Sent",
    "message": "Free for coffee?",
    "fromNumber": "8885551234",
    
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/textmessagetemplates-get.md
# /textMessageTemplates

Lists all text message templates.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

### GET /textMessageTemplates  — Lists all text message templates.
- [query] `limit` (string) default=10: Number of results to return. Max 100.
- [query] `offset` (string) default=0: Specifies the number of rows to skip before starting to return results.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "textmessagetemplates",
    "offset": 0,
    "limit": 2,
    "total": 24,
    "next": "eyJvZmZzZXQiOjN9",
    "nextLink": "https://api.followupboss.com/v1/textMessageTemplates?limit=3&next=eyJvZmZzZXQiOjN9"
  },
  "textmessagetemplates": [
    {
      "id": 110,
      "name": "Agent > Client + Lender intro",
      "totalSent": 1,
      "totalReplies": 1,
      


=================== https://docs.followupboss.com/reference/textmessagetemplates-id-delete.md
# /textMessageTemplates/:id

> 🚧 Templates and Action Plans
>
> If you try to delete a text message template which is still in use by an Action Plan, you will get a `403 Forbidden` response.
>
> You can make a GET request to [/textMessageTemplates/:id](textmessagetemplates-id-get) to see which Action Plans are currently using the text message template.

### DELETE /textMessageTemplates/{id}  — 
- [path] `id` (integer) REQUIRED: The ID of the text message template to delete.
- RESPONSE 200 example: {}


=================== https://docs.followupboss.com/reference/textmessagetemplates-id-get.md
# /textMessageTemplates/:id

Retrieve a text message template by id.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

### GET /textMessageTemplates/{id}  — Retrieve a text message template by id.
- [path] `id` (integer) REQUIRED: The ID of the template.
- RESPONSE 200 example: {
  "id": 110,
  "name": "Agent > Client + Lender intro",
  "totalSent": 1,
  "totalReplies": 1,
  "message": "%lender_first_name% - %contact_first_name% is a client of mine who's going to be buying a property shortly. Can you please take point on getting them pre-approved?",
  "isShared": true,
  "createdBy": -1,
  "isEditable": true,
  "isDeletable": true,
  "isShareable": false,
  "sentPeopleId


=================== https://docs.followupboss.com/reference/textmessagetemplates-id-put.md
# /textMessageTemplates/:id

Update a text message template.

> 📘 Merge Info
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

### PUT /textMessageTemplates/{id}  — Update a text message template.
- [path] `id` (string) REQUIRED: The ID of the text message template to update.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of your text message template.
  - `message` (string) REQUIRED: The body of your text message template.
  - `isShared` (boolean): Set to true if this template should be shared with other users in the same Follow Up Boss account.
- RESPONSE 200 example: {
  "id": 182,
  "name": "Beach House promo",
  "totalSent": 0,
  "totalReplies": 0,
  "message": "%greeting_time%, %contact_first_name%\n\nCheck out this beach house: https://example.com",
  "isShared": true,
  "createdBy": 15,
  "isEditable": true,
  "isShareable": true,
  "isDeletable": true,
  "categories": [],
  "sentPeopleCount": 0,
  "actionPlans": [],
  "effectivenessScore": null,
  "windo


=================== https://docs.followupboss.com/reference/textmessagetemplates-merge.md
# /textMessageTemplates/merge

Merge a text message template with multiple recipients.

If you are merging a group text, you can include details about all recipients in the "recipients" field.  This field should have a "to" field with all the recipients, and optionally a "from" field, although that is currently unused.

The "recipients.to" field should be an array of recipients, with each entry containing the phone number of that recipient, and optionally their name.

The first recipient in this list which matches either the Person ID or one of their relationships will be used for all %contact\_\*% merge fields.  The %contact\_rels\_first\_name% field will return the list of first names.

For example, the request body above is merged as follows:

* %contact\_name% is replaced with "Bob Alvarez"
* %contact\_rels\_first\_name% is replaced with "Bob, Alice and Carol"

### POST /textMessageTemplates/merge  — Merge a text message template with multiple recipients.
- BODY (application/json):
  - `templateId` (integer) REQUIRED: The ID of the text message template.
  - `personId` (integer): Person ID to use for merge fields like %contact_name%.
  - `recipients` (object{to:array<object{name:string, phone:string}>}): List of recipients of this text message.
    - `to` (array<object{name:string, phone:string}>): 
      - `name` (string): 
      - `phone` (string): 
- RESPONSE 200 example: {
  "mergedTemplate"; "Hey Bob, Alice and Carol..."
}


=================== https://docs.followupboss.com/reference/textmessagetemplates-post.md
# /textMessageTemplates

Create a text message template.

> 📘 Merge Fields
>
> Within templates, we need a way to insert contact data. In Follow Up Boss, these are called these Merge Fields. For more information, see [Merge Fields](https://docs.followupboss.com/reference/merge-fields).

### POST //textMessageTemplates  — Create a text message template.
- BODY (application/json):
  - `name` (string) REQUIRED: The name of your text message template.
  - `message` (string) REQUIRED: The body of your text message template.
  - `isShared` (boolean): Set to true if this template should be shared with other users in the same Follow Up Boss account.
- RESPONSE 200 example: {
  "id": 182,
  "name": "Beach House promo",
  "totalSent": 0,
  "totalReplies": 0,
  "message": "%greeting_time%, %contact_first_name%\n\nCheck out this beach house: https://example.com",
  "isShared": true,
  "createdBy": 15,
  "isEditable": true,
  "isShareable": true,
  "isDeletable": true,
  "categories": [],
  "sentPeopleCount": 0,
  "actionPlans": [],
  "effectivenessScore": null,
  "windo


=================== https://docs.followupboss.com/reference/threaded-replies.md

# Threaded Replies

Threaded replies allow users to reply to various data entities within Follow Up Boss, such as a note. This allows for more seamless team communication within Follow Up Boss.

> 🚧 Beta Feature
>
> This is a beta feature! These API endpoints are subject to change.

> 📘 refType Arguments
>
> For the `refType` arguments, the only valid values are: `Note`.

The api key owner will always be the creator of a Threaded Reply. Therefore, only the api key owner can edit or delete their own reply.

[Requesting Notes](https://docs.followupboss.com/reference/notes-id-get) with the `includeThreadedReplies=true` parameter will include the replies within the note payload:

```json json
{
    "_metadata": { ... },
    "notes": [
        {
            "id": 20,
            ...
            "replies": [
                {
                    "id": 1,
                    "refId": 20,
                    "refType": "Note",
                    "picture": {
                        "original": "https://my-image.jpeg",
                        "162x162": "https://my-162px-image.jpeg",
                        "60x60": "https://my-60px-image.jpeg",
                    },
                    "createdById": 1,
                    "createdBy": "Mark Hamill",
                    "created": "2024-01-01T00:00:00Z",
                    "updated": "2024-01-01T00:00:00Z",
                    "body": "Hello world!",
                    "starred": false
                }
            ]
        }
    ]
}
```

=================== https://docs.followupboss.com/reference/threadedreplies-copy.md
# /threadedReplies/:id

Fetches a threaded reply

### GET /threadedReplies/{id}  — Fetches a threaded reply
- [path] `id` (integer) REQUIRED: The ID of the reply to return.
- RESPONSE 200 example: {
    "id": 1,
    "created": "2024-01-11T18:50:12Z",
    "updated": "2024-01-26T19:13:27Z",
    "createdById": 1,
    "refType": "Note",
    "refId": 468,
    "body": "Hello world part 2",
    "reactions": {
   		"id": 1363,
      "created": "2024-03-21T21:14:13Z",
      "createdBy": "Tom Minch",
      "createdById": 1,
      "refType": "Note",
      "refId": 2144705,
      "body": "🤯"
   	}
}


=================== https://docs.followupboss.com/reference/timeframes-get.md
# /timeframes

Get a list of timeframes.

### GET /timeframes  — Get a list of timeframes.
- RESPONSE 200 example: {
    "_metadata": {
        "collection": "timeframes",
        "offset": 0,
        "limit": 10,
        "total": 0,
        "next": null,
        "nextLink": null
    },
    "timeframes": [
        {
            "id": 1,
            "timeframe": "0-3 Months"
        },
        {
            "id": 2,
            "timeframe": "3-6 Months"
        },
        {
            "id": 3,
            "tim


=================== https://docs.followupboss.com/reference/users-get.md
# /users

Search for users.

> 📘 Calling Information
>
> By default, this endpoint does not return `calling` information about the phone number associated with Follow Up Boss.
>
> In order to retrieve this additional information, use the `fields` argument and include `calling` and any other fields needed from the user object.

> 📘 Role Mapping
>
> Currently, the `role` value in the response will only map to three options: `Agent`, `Broker` and `Lender`. `Broker` is the same as an Owner in the front end of Follow Up Boss if `isOwner` is also `true`, otherwise they are just an Admin.
>
> By utilizing the `teamLeaderOf` results in the response along with the role itself, you can make other connections. For example, if a user is an `Agent` and `teamLeaderOf` contains the id of `1` in the list, that means the user is a Team Leader / ISA Role in Follow Up Boss.

### GET /users  — Search for users.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `sort` (string): Field to sort by. (Currently only `id`, `name` and `created` are available.)
- [query] `role` (string): Find users by a specific role. (e.g., "Broker", "Agent", "Lender")
- [query] `name` (string): Find a user by their full name. (Exact matches only, no partial matching available.)
- [query] `email` (string): Find a user by their email.
- [query] `fields` (string): Comma separated list of fields (e.g., id,name,calling) to return or use allFields to return all fields (except for calling information, unless included like allFields,calling). <br><br> When using the fields parameter to filter the response, the id field will be included (even when not specified explicitly).
- [query] `includeDeleted` (boolean) default=False: Setting this to `true` will include users that have been deleted.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "users",
    "offset": 0,
    "limit": 10,
    "total": 5,
    "next": null,
    "nextLink": null
  },
  "users": [
    {
      "id": 1,
      "created": "2023-03-06T19:48:47Z",
      "updated": "2023-04-24T14:38:13Z",
      "name": "Jean-Luc Picard",
      "firstName": "Jean-Luc",
      "lastName": "Picard",
      "email": "jeanluc@enterprise.uss",
      "phon


=================== https://docs.followupboss.com/reference/users-id-delete.md
# /users/:id

Delete a user.

[block:callout]
{
  "type": "warning",
  "title": "Delete Access",
  "body": "This method can only be accessed by administrators."
}
[/block]

### DELETE /users/{id}  — Delete a user.
- [path] `id` (integer) REQUIRED: ID of user to delete.
- [query] `assignTo` (integer) REQUIRED: ID of another user to reassign the deleted user's leads to.
- RESPONSE 200 example: {}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/users-id-get.md
# /users/:id

Retrieve a user by id.

> 📘 Role Mapping
>
> Currently, the `role` value in the response will only map to three options: `Agent`, `Broker` and `Lender`. `Broker` is the same as an Owner in the front end of Follow Up Boss if `isOwner` is also `true`, otherwise they are just an Admin.
>
> By utilizing the `teamLeaderOf` results in the response along with the role itself, you can make other connections. For example, if a user is an `Agent` and `teamLeaderOf` contains the id of `1` in the list, that means the user is a Team Leader / ISA Role in Follow Up Boss.

### GET /users/{id}  — Retrieve a user by id.
- [path] `id` (integer) REQUIRED: The ID of a user.
- RESPONSE 200 example: {
  "id": 5,
  "created": "2013-05-05T22:55:19Z",
  "updated": "2014-03-06T08:52:25Z",
  "name": "Daniel Corkill",
  "firstName": "Daniel",
  "lastName": "Corkill",
  "email": "dan@example.com",
  "phone": "",
  "role": "Broker",
  "status": "Active",
  "timezone": "Asia/Beirut",
  "beta": false,
  "isOwner": false,
  "leadEmailAddress": "dan.corkill@followupboss.me",
  "groups": [
    {
      "id


=================== https://docs.followupboss.com/reference/view-inbox-app-installations.md
# View Installed Inbox Apps

Lists Inbox App installation(s) and ID(s) for your Published Inbox App on the current FUB account.

> 📘 **Learn more about the Inbox Apps Installation Lifecycle**
>
> See our [Installation Lifecycle Guide](https://docs.followupboss.com/docs/inbox-apps-installation-lifecycle) for more information on installing and deactivating Inbox Apps.

### GET /inboxApps/installedApps/{publishedInboxAppId}  — Lists Inbox App installation(s) and ID(s) for your Published Inbox App on the current FUB account.
- [path] `publishedInboxAppId` (string) REQUIRED: Your Published Inbox App ID, to display installations of.
- RESPONSE 200 example: {
  "inboxApps": [
    {
      "inboxAppId": 1,
      "userId": 0,
      "created": "2025-01-01T12:12:12Z"
    },
    {
      "inboxAppId": 9,
      "userId": 5,
      "created": "2025-01-01T12:12:12Z"
    }
  ]
}
- RESPONSE 403 example: {
  "errorMessage": "You do not have permission to view installations for this Published Inbox App."
}


=================== https://docs.followupboss.com/reference/webhookevents-get.md
# /webhookEvents/:id

Get a list of events for a given webhook.

> 📘 Detailed Webhook Guide
>
> For more details and information about webhooks, see the full guide [here](webhooks-guide).

> 🚧 Restricted Access
>
> Retrieving webhooks is restricted to the account owner and the associated registered system.

This endpoint will retrieve a list of events that were triggered for a given endpoint for your registered system.

### GET /webhookEvents/:id  — Get a list of events for a given webhook.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- RESPONSE 200 example: {
  "id": "db36048a6b06d80e7f9d3440233ae915",
  "eventCreated": "2016-12-12T18:36:26Z",
  "event": "peopleUpdated",
  "resourceIds": [1234,3422,4343],
  "uri": "https://api.followupboss.com/v1/people?id=1234,3422,4343"
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/webhooks-get.md
# /webhooks

Get a list of webhooks.

> 📘 Detailed Webhook Guide
>
> For more details and information about webhooks, see the full guide [here](webhooks-guide).

> 🚧 Restricted Access
>
> Retrieving webhooks is restricted to the account owner and the associated registered system.

### GET /webhooks  — Get a list of webhooks.
- [query] `sort` (string) default=created: The sort order. Can be one of the following: `id`, `created`, `updated`, `status` or `event`.
- [query] `offset` (integer) default=0: Specifies the number of rows to skip before starting to return results.
- [query] `limit` (integer) default=10: Number of results to return. Max 100.
- [query] `event` (string): Search for webhooks by event. (e.g., `peopleCreated` or `peopleUpdated`)
- [query] `status` (string enum['Active', 'Disabled']): Search for webhooks by status. Status can be `Active` or `Disabled`.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- RESPONSE 200 example: {
  "_metadata": {
    "collection": "webhooks",
    "offset": 0,
    "limit": 10,
    "total": 3
  },
  "webhooks": [
    {
      "id": 1001,
      "event": "peopleCreated",
      "status": "Active",
      "url": "https://acmeLeadProvider.com/callbacks/peopleCreated"
    },
    {
      "id": 1002,
      "event": "peopleUpdated",
      "status": "Active",
      "url": "https://acmeLeadProvider.com
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/webhooks-guide.md

# Webhooks

Use webhooks to be notified about events that happen in a Follow Up Boss account.

> 🚧 Owner Permissions Required
>
> Only the owner has access to creating, updating, or deleting webhooks.

# Overview

Webhooks post JSON to a specific URL every time an event listed below is triggered. Webhooks remove the need to poll for changes. When an event occurs--for example a person is assigned to a different agent, this event will be sent to your system as an HTTP POST to the webhook URL configured for the `peopleUpdated` event.

Examples of what you might use webhooks for:

* Update a person's name in your database when it is changed in Follow Up Boss
* Update a person's email or phone in your database when it is changed in Follow Up Boss
* Re-assign a person in your system when it is re-assigned in Follow Up Boss
* When a Zillow lead is added to Follow Up Boss you add it to your IDX search website

> 📘 Batch Updates
>
> The following actions can result in a large number of people updates:
>
> * Tags added or removed
> * Stage updated
> * Source updated
> * Agent re-assigned
> * Lender re-assigned
>
> If one of these actions result in a large number of people being updated, the webhook event notification may be split into multiple requests.

# Supported webhook events

## People

`peopleCreated`, `peopleUpdated`, `peopleDeleted`, `peopleTagsCreated`, `peopleStageUpdated`,`peopleRelationshipCreated`,`peopleRelationshipUpdated`,`peopleRelationshipDeleted`

### peopleUpdated

One or more of the following fields are updated in a person:

* Name `name` `firstName` `lastName`
* Emails `emails`
* Phone Numbers `phones`
* Address `addresses`
* Price `price`
* Background `background`
* Assigned Agent `assignedTo` `assignedUserId`
* Assigned Lender `assignedLenderName` `assignedLenderId`
* Contacted `contacted`
* Stage `stage` `stageId`
* Lead Source `source` `sourceUrl`
* Tags `tags`
* Custom Fields
* Relationship is created, updated, or deleted

> 📘 Custom Fields
>
> If you want to view custom field data following a `peopleUpdated` event, make sure you add the query parameter `fields=allFields` to your `GET /people` request, custom fields are not returned by default.

### peopleDeleted

When a person is deleted all associated data is deleted as well e.g. notes, calls, text messages, etc. There will not be any delete events triggered for these resources when this happens.

JSON sample of event notification:

```
{
    "eventId": "64d0ad74-3aab-4b30-89c9-7337398cf8b4",
    "eventCreated": "2016-12-12T15:19:21+00:00",
    "event": "peopleDeleted",
    "resourceIds": [1234,5322,29456],
    "uri": null
}
```

### peopleTagsCreated

When a tag is added to a person, the payload will include the name of the new tag. Multiple tags and person ids may be included. Note: The webhook will fire regardless of whether a tag was previously removed and re-added to a contact.

JSON sample of event notification:

```
{
    "eventId": "e8d9f150-5dac-4c53-8c0f-06560dc4ec08",
    "eventCreated": "2019-07-01T17:22:28+00:00",
    "event": "peopleTagsCreated",
    "resourceIds": [
        40773,
        40772
    ],
    "uri": "https://api.followupboss.com/v1/people?id=40773,40772",
    "data": {
        "tags": [
            "Kingsbury"
        ]
    }
}
```

### peopleStageUpdated

When a person's stage is updated, the payload will include the name of the new stage.

JSON sample of event notification:

```
{
    "eventId": "e0ac086a-879a-4d8b-869a-fe53151e34f4",
    "eventCreated": "2019-07-01T17:12:32+00:00",
    "event": "peopleStageUpdated",
    "resourceIds": [
        40942
    ],
    "uri": "https://api.followupboss.com/v1/people?id=40942",
    "data": {
        "stage": "Free Trial"
    }
}
```

## Notes

`notesCreated`, `notesUpdated`, `notesDeleted`

## Reactions (Beta)

`reactionCreated`,`reactionDeleted`

```
{
    "eventId": "e0ac086a-879a-4d8b-869a-fe53151e34f4",
    "eventCreated": "2019-07-01T17:12:32+00:00",
    "event": "reactionCreated",
    "resourceIds": [9387],
    "uri": "https://api.followupboss.com/v1/reactions/9387",
    "data": {
        "refType": "Note",
        "refId": 3827,
        "refUri": "https://api.followupboss.com/v1/notes/3827?includeReactions=true"
    }
}
```

## Threaded Replies (Beta)

`threadedReplyCreated`, `threadedReplyUpdated`, `threadedReplyDeleted`

```
{
    "eventId": "e0ac086a-879a-4d8b-869a-fe53151e34f4",
    "eventCreated": "2019-07-01T17:12:32+00:00",
    "event": "threadedReplyCreated",
    "resourceIds": [9387],
    "uri": "https://api.followupboss.com/v1/threadedReplies/9387",
    "data": {
        "refType": "Note",
        "refId": 3827,
        "refUri": "https://api.followupboss.com/v1/notes/3827?includeThreadedReplies=true"
    }
}
```

## Emails

`emailsCreated`, `emailsUpdated`, `emailsDeleted`

## Tasks

`tasksCreated`, `tasksUpdated`, `tasksDeleted`

## Appointments

`appointmentsCreated`, `appointmentsUpdated`, `appointmentsDeleted`\
These webhooks only fires when the appointment was created in Follow Up Boss, not when we sync appointments created on Integrated Calendars (i.e. Google or Office 365 calendars).

## Text Messages

`textMessagesCreated`, `textMessagesUpdated`, `textMessagesDeleted`

## Calls

`callsCreated`, `callsUpdated`, `callsDeleted`

## Email Marketing Events

`emEventsOpened`\
People open an email marketing email.

`emEventsClicked`\
People click a link in an email marketing email.

`emEventsUnsubscribed`\
People unsubscribe from email marketing emails.

## Deals

`dealsCreated`, `dealsUpdated`, `dealsDeleted`

> 📘 `dealsUpdated` Event
>
> This event does **not** fire for `files` being changed on the deal.

## Stages

`stageCreated`, `stageUpdated`, `stageDeleted`

> 🚧 Stage Events
>
> The Stage-specific webhooks are used when the values of the Stage field are changed in the admin area (or API) of Follow Up Boss and **not when the Stage is changed for a lead**.
>
> The primary use case for these events is for integrations that need to know when the name of a stage has been added, updated, or removed.

## People Events

`eventsCreated`\
People perform an action on your IDX website, e.g. view a property.

## Pipeline Events

`pipelineCreated` `pipelineUpdated` `pipelineDeleted`\
A pipeline is created, updated, or deleted in the system.

> 📘 `pipelineUpdated` Event
>
> 1. This event triggers when any **Pipeline** property is updated.
> 2. Additionally, when a pipeline's order weight is changed, it may also trigger additional `pipelineUpdated` events for other pipelines whose order weights are automatically adjusted.

## Pipeline Stage Events

`pipelineStageCreated` `pipelineStageUpdated` `pipelineStageDeleted`\
A pipeline stage is created, updated, or deleted.

> 📘 Pipeline stage events
>
> 1. This event triggers when any **Pipeline Stage** property is updated.
> 2. Additionally, when a pipeline stage's order weight is changed, it may also trigger additional `pipelineStageUpdated` events for other pipeline stages whose order weights are automatically adjusted.

## Custom Fields Events

`customFieldsCreated` `customFieldsUpdated` `customFieldsDeleted`\
Custom fields are created, updated or deleted.

> 🚧 Custom Field Properties Only
>
> Note that this webhook is specific to the custom field configuration only, not the values.

> 📘 `customFieldsUpdated` Event
>
> 1. This event triggers when any **Custom field** property is updated.
> 2. Additionally, when a custom field's order weight is changed, it may also trigger additional `customFieldsUpdated` events for other custom fields whose order weights are automatically adjusted.

## Deal Custom Fields Events

`dealCustomFieldsCreated` `dealCustomFieldsUpdated` `dealCustomFieldsDeleted`\
Deal custom fields are created, updated or deleted.

> 🚧 Deal Custom Field Properties Only
>
> Note that this webhook is specific to the deal custom field configuration only, not the values.

> 📘 `dealCustomFieldsUpdated` Event
>
> 1. This event triggers when any **Deal custom field** property is updated.
> 2. Additionally, when a deal custom field's order weight is changed, it may also trigger additional `dealCustomFieldsUpdated` events for other deal custom fields whose order weights are automatically adjusted.

# Registering a webhook

Send an HTTPS POST to the [`/v1/webhooks`](https://docs.followupboss.com/reference/webhooks-post) endpoint with a JSON object that specifies the event and callback URL.

> 🚧 Limited number of webhooks per event
>
> There is a limit of **two** web hooks per event per system which can be registered.
>
> Unused webhooks should be unregistered to prevent hitting the limit. In order to unregister a webhook, first call the GET [`/v1/webhooks`](https://docs.followupboss.com/reference/webhooks-get) API with the account owner API key and the X-System header that you are using for the webhook subscriptions to retrieve the list of webhooks that are registered along with the IDs. From there, make a call to the DELETE [`/v1/webhooks/:id`](https://docs.followupboss.com/reference/webhooks-delete-id)  API and unregister any unused webhooks.
>
> If multiple endpoints for an event are desired, a single webhook should be registered which in turn handles the fan out to multiple endpoints internally to your system. Keep in mind the best practices below about de-coupling the message receiving and workload so that the initial call does not timeout.

> 🚧 Webhook Security
>
> When registering a webhook, you should use a unique identifier that maps a user to your system. **Do not use API keys as part of a URL request.**

> ❗️ HTTPS Only
>
> Callback URLs must be a secure endpoint.

> ❗️ X-System Header is Required
>
> The X-System HTTP Header is required for all requests to /v1/webhooks endpoints.

```http
POST /v1/webhooks HTTP/1.1
Content-Type: application/json
X-System: AcmeLeadProvider
...
{
  "event": "peopleCreated",
  "url": "https://acmeLeadProvider.com/callbacks/fub/peopleCreated"
}
```

The response will be JSON encoded representation of the webhook created.

```json
{
  "id": 1244,
  "status": "Active",
  "event": "peopleCreated",
  "url": "https://acmeLeadProvider.com/callbacks/fub/peopleCreated"
}
```

# Receiving webhook events

Create an endpoint that accepts HTTP POST requests at the URL specified in the registered webhook. The body of the request will be JSON encoded. To acknowledge the receipt, your endpoint should respond within 10 seconds with a `2XX` HTTP status code such as `200` or `204`. Any other response will indicate that you did not receive the webhook and we will continue to retry at various intervals for up to 8 hours.

For example, the endpoint at `https://acmeleadprovider.com/callbacks/fub/peoplecreated` would receive the following HTTP POST when a person is created in Follow Up Boss:

```http
POST /callbacks/fub/peoplecreated HTTP/1.1
Content-Type: application/json
...
{
  "eventId": "152d60c0-79da-4018-a9af-28aec8a71c94",
  "eventCreated": "2016-12-12T15:19:21+00:00",
  "event": "peopleCreated",
  "resourceIds": [1234,3244,3232],
  "uri": "https://api.followupboss.com/v1/people?id=1234,3244,3232"
}
```

# Retrying webhook events

Upon receiving status codes less than `200` and greater than or equal to `300` from your system, Follow Up Boss will attempt to retry the request up to 5 times. The retry timing works as follows:

Attempt 1 → 2: Wait 1 minute (60 seconds)\
Attempt 2 → 3: Wait 5 minutes (300 seconds)\
Attempt 3 → 4: Wait 5 minutes (300 seconds)\
Attempt 4 → 5: Wait 10 minutes (600 seconds)\
Attempt 5 → 6: Wait 30 minutes (1800 seconds)

# Verify the request

With each request, we pass along a `FUB-Signature` header. You can use this string value to verify the request is from us using your X-System-Key provided when you registered your system.

You will want to base64 encode the JSON payload you received from the request (non-prettified), then produce a SHA256 hash with this base64 encode value and your X-System-Key , this value should match the FUB-Signature value.

```php
function isFromFollowUpBoss(string $context, string $signature): boolean {
    $calculated = hash_hmac('sha256', base64_encode($context), YOUR_X-SYSTEM-KEY);

    return $signature === $calculated;
}

if (isFromFollowUpBoss($jsonPayload, $signatureFromHeader)) {
    // do something
}
```

# Handling webhook events

The endpoint that handles events should do an HTTP GET to the resource URI specified in the event. Then compare the response to the local database and apply changes that are found.

See the code samples below for handling webhook events:

```php
<?php
const FUB_API_KEY = 'API Key for an Admin user in the Follow Up Boss Account';

// Retrieve the request's body and parse it as JSON
$input = @file_get_contents("php://input");
$event_json = json_decode($input);

$event = $event_json->{'event'};
$resource_uri = $event_json->{'uri'};

// for peopleCreated and peopleUpdated events fetch the people
// at the resource URI

$curl = curl_init($resource_uri);

$headers = array(
    'Authorization: Basic '. base64_encode(FUB_API_KEY . ":")
);

curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($curl);
curl_close($curl);

$remote_records = json_decode($result);

// Compare the remote record with your local record

http_response_code(200); // PHP 5.4 or greater

echo('OK');
```

# Requesting webhook events

Individual webhook events can be requested from [`/v1/webhookEvents/:id`](https://docs.followupboss.com/reference/webhookeventsuuid). This can useful if your system was unavailable to receive events for some reason and there are events older than 3 days that were missed.

> 🚧 Webhook Event Retries
>
> If your system is unavailable or responds with an HTTP status code other than `2XX` such as `200` or `204`, FUB will continue to retry for up to 8 hours.

# Disabling webhooks

In order to disable a webhook manually, you need to call the DELETE event for [`/v1/webhooks/`](https://docs.followupboss.com/reference/webhooks-delete-id) with the corresponding ID for your registered webhook.

> 👍 Automatic Webhook Disabling
>
> It is recommended that you set up your webhooks to return an HTTP code of `406` or `410` when you want them deleted automatically (such as when a customer is no longer utilizing your system).
>
> Additionally, Follow Up Boss will automatically disable webhooks that have significant failures (greater than 50% over a 48 hour period) if they have not recovered on their own within a week's time.

<br />

# Webhook best practices

Setup your system to de-couple receiving webhook events from fetching the resource specified in the event. For example--the web service that receives events could record the event in a local database table. A separate backend process could be created to monitor this table for new rows and fetch the resource specified in the event. By separating these, the web service that handles receiving webhooks is doing less and is, therefore less likely to fail. The process that processes the events can contain all the complex logic to fetch the resource from Follow Up Boss, reconcile with your local system and mark the event as processed in the table. If this process fails or breaks it can be debugged independently of the web service. The table that stores events is the source of truth as to what webhook events have been received and processed.

# Debugging webhooks

Since webhooks require a publicly accessible URL to function they can be hard to test from your local machine. It is recommended that you use a service like [Request Bin](https://requestbin.com/) when you are developing your webhook endpoints.

# Common webhook mistakes

* Make sure you provide the correct URL when registering a webhook. You can list all your webhooks at the [`/v1/webhooks`](https://docs.followupboss.com/reference/webhooks-get) endpoint.
* Make sure the webhook endpoint is returning a `2XX` HTTP status code such as `200`
* When registering a webhook make sure you are setting the `X-System` header. You can also include the system param in the query string or post data. For example: `https://api.followupboss.com/v1/webhooks/32?system=AcmeCo`
* If you are setting up webhooks for multiple Follow Up Boss accounts be sure to include a Follow Up Boss account identifier in the registered webhook URLs. Your webhook URLs should look like this: `https://acmeLeadProvider.com/callbacks/fub/account12/peopleCreated` or `https://acmeLeadProvider.com/callbacks/fub/peopleCreated?fub_account=12`

# Inbox App webhooks

Inbox App webhooks behave differently from other Follow Up Boss webhooks and can not be updated using `/v1/webhooks` APIs. Please see the [Inbox Apps webhooks guide](https://docs.followupboss.com/docs/inbox-apps-webhooks) for information on available Inbox App webhooks.

=================== https://docs.followupboss.com/reference/webhooks-id-delete.md
# /webhooks/:id

Delete a webhook.

> 🚧 Restricted Access
>
> Deleting webhooks is restricted to the account owner and the associated registered system.

### DELETE /webhooks/{id}  — Delete a webhook.
- [path] `id` (integer) REQUIRED: The ID of the webhook.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- RESPONSE 200 example: 
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/webhooks-id-get.md
# /webhooks/:id

Get details of a specific webhook.

> 🚧 Restricted Access
>
> Retrieving webhooks is restricted to the account owner and the associated registered system.

### GET /webhooks/{id}  — Get details of a specific webhook.
- [path] `id` (integer) REQUIRED: The ID of the webhook.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- RESPONSE 200 example: {
	"id": 1004,
  "status": "Active",
  "event": "peopleCreated",
  "url": "https://acmeLeadProvider.com/callbacks/followupboss/peopleCreated"
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/webhooks-id-put.md
# /webhooks/:id

Update a webhook.

> 🚧 Restricted Access
>
> Updating webhooks is restricted to the account owner and the associated registered system.

### PUT /webhooks/{id}  — Update a webhook.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [path] `id` (integer) REQUIRED: The id of the webhook.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- BODY (application/json):
  - `event` (string enum['peopleCreated', 'peopleUpdated', 'peopleDeleted', 'peopleTagsCreated', 'peopleStageUpdated', 'peopleRelationshipCreated', 'peopleRelationshipUpdated', 'peopleRelationshipDeleted', 'notesCreated', 'notesUpdated', 'notesDeleted', 'emEventsOpened', 'emEventsClicked', 'emEventsUnsubscribed', 'tasksCreated', 'tasksUpdated', 'tasksDeleted', 'appointmentsCreated', 'appointmentsUpdated', 'appointmentsDeleted', 'textMessagesCreated', 'textMessagesUpdated', 'textMessagesDeleted', 'callsCreated', 'callsUpdated', 'callsDeleted', 'dealsCreated', 'dealsUpdated', 'dealsDeleted', 'emailsCreated', 'emailsUpdated', 'emailsDeleted', 'eventsCreated']): The event the webook responds to. Should be one of the following: `peopleCreated`, `peopleUpdated`, `peopleDeleted`, `notesCreated`, `notesUpdated`, `notesDeleted`, `emEventsOpened`, `emEventsClicked`, `emEventsUnsubscribed`, `tasksCreated`, `tasksUpdated`, `tasksDeleted`, `appointmentsCreated`, `appointmentsUpdated`, `appointmentsDeleted`, `textMessagesCreated`, `textMessagesUpdated`, `textMessagesDeleted`, `callsCreated`, `callsUpdated`, `callsDeleted`, `emailsCreated`, `emailsUpdated`, `emailsDeleted` or `eventsCreated`
  - `url` (string): The url of the webhook. Must be a secure endpoint (https).
  - `status` (string enum['Active', 'Disabled']): The status of the webhook. Can be `Active` or `Disabled`
- RESPONSE 200 example: {
  "id": 1004,
  "status": "Disabled",
  "event": "peopleCreated",
  "url": "https://acmeLeadProvider.com/callbacks/followupboss/peopleCreated"
}
- RESPONSE 400 example: {}


=================== https://docs.followupboss.com/reference/webhooks-post.md
# /webhooks

Subscribe to a new webhook.

> 🚧 Restricted Access
>
> Creating new webhooks is restricted to the account owner and registered systems only.

> 📘 Detailed Webhook Guide
>
> For more details and information about webhooks, see the full guide [here](webhooks-guide).

### POST /webhooks  — Subscribe to a new webhook.
- [header] `X-System` (string) REQUIRED: The name of the registered system.
- [header] `X-System-Key` (string) REQUIRED: The key of the registered system.
- BODY (application/json):
  - `event` (string enum['peopleCreated', 'peopleUpdated', 'peopleDeleted', 'peopleTagsCreated', 'peopleStageUpdated', 'peopleRelationshipCreated', 'peopleRelationshipUpdated', 'peopleRelationshipDeleted', 'notesCreated', 'notesUpdated', 'notesDeleted', 'emEventsOpened', 'emEventsClicked', 'emEventsUnsubscribed', 'tasksCreated', 'tasksUpdated', 'tasksDeleted', 'appointmentsCreated', 'appointmentsUpdated', 'appointmentsDeleted', 'textMessagesCreated', 'textMessagesUpdated', 'textMessagesDeleted', 'callsCreated', 'callsUpdated', 'callsDeleted', 'dealsCreated', 'dealsUpdated', 'dealsDeleted', 'emailsCreated', 'emailsUpdated', 'emailsDeleted', 'eventsCreated', 'stageCreated', 'stageUpdated', 'stageDeleted']) REQUIRED: The event the webook responds to. This should be one of the following: `peopleCreated`, `peopleUpdated`, `peopleDeleted`, `peopleTagsCreated`, `peopleStageUpdated`, `peopleRelationshipCreated`,`peopleRelationshipUpdated`,`peopleRelationshipDeleted`, `notesCreated`, `notesUpdated`, `notesDeleted`, `emEventsOpened`, `emEventsClicked`, `emEventsUnsubscribed`, `tasksCreated`, `tasksUpdated`, `tasksDeleted`, `appointmentsCreated`, `appointmentsUpdated`, `appointmentsDeleted`, `textMessagesCreated`, `textMessagesUpdated`, `textMessagesDeleted`, `callsCreated`, `callsUpdated`, `callsDeleted`,  `dealsCreated`, `dealsUpdated`, `dealsDeleted`, `emailsCreated`, `emailsUpdated`, `emailsDeleted`, `eventsCreated`, `stageCreated`, `stageUpdated`, or `stageDeleted`
  - `url` (string) REQUIRED: The url of the webhook. Must be a secure endpoint (https).
- RESPONSE 200 example: {
  "id": 1004,
  "status": "Active",
	"event": "peopleCreated",
  "url": "https://acmeLeadProvider.com/callbacks/followupboss/peopleCreated"
}
- RESPONSE 400 example: {}
