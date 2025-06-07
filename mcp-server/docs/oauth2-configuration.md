# OAuth2 Configuration

This API uses OAuth2 for authentication. The MCP server can handle OAuth2 authentication in the following ways:

1. **Using a pre-acquired token**: You provide a token you've already obtained
2. **Using client credentials flow**: The server automatically acquires a token using your client ID and secret

## Environment Variables

### oauth2

This API uses OAuth 2.0 with the authorization code grant flow.

**Configuration Variables:**

- `OAUTH_CLIENT_ID_OAUTH2`: Your OAuth client ID
- `OAUTH_CLIENT_SECRET_OAUTH2`: Your OAuth client secret
- `OAUTH_TOKEN_OAUTH2`: Pre-acquired OAuth token (required for authorization code flow)

**Authorization Code Flow:**

- Authorization URL: `https://app.attio.com/authorize`
- Token URL: `https://app.attio.com/oauth/token`

**Available Scopes:**

- `user_management:read`: View workspace members.
- `user_management:read-write`: View workspace members.
- `record_permission:read`: View, and optionally write, records.
- `record_permission:read-write`: View, and optionally write, records.
- `object_configuration:read`: View, and optionally write, the configuration and attributes of objects.
- `object_configuration:read-write`: View, and optionally write, the configuration and attributes of objects.
- `list_entry:read`: View, and optionally write, the entries in a list.
- `list_entry:read-write`: View, and optionally write, the entries in a list.
- `list_configuration:read`: View, and optionally write, the configuration and attributes of lists.
- `list_configuration:read-write`: View, and optionally write, the configuration and attributes of lists.
- `public_collection:read`: View, and optionally write, both the settings and information within public collections.
- `public_collection:read-write`: View, and optionally write, both the settings and information within public collections.
- `private_collection:read`: View, and optionally modify, both the settings and information of all collections within the workspace, regardless of their access settings.
- `private_collection:read-write`: View, and optionally modify, both the settings and information of all collections within the workspace, regardless of their access settings.
- `comment:read`: View comments (and threads), and optionally write comments.
- `comment:read-write`: View comments (and threads), and optionally write comments.
- `task:read`: View, and optionally write, tasks.
- `task:read-write`: View, and optionally write, tasks.
- `note:read`: View, and optionally write, notes.
- `note:read-write`: View, and optionally write, notes.
- `webhook:read`: View, and optionally manage, webhooks.
- `webhook:read-write`: View, and optionally manage, webhooks.

## Token Caching

The MCP server automatically caches OAuth tokens obtained via client credentials flow. Tokens are cached for their lifetime (as specified by the `expires_in` parameter in the token response) minus 60 seconds as a safety margin.

When making API requests, the server will:
1. Check for a cached token that's still valid
2. Use the cached token if available
3. Request a new token if no valid cached token exists
