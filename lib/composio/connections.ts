import { getComposio, isComposioConfigured } from "@/lib/composio/client";

export type ComposioToolkit = "gmail" | "googlecalendar";

export type ToolkitConnectionStatus = {
  toolkit: ComposioToolkit;
  label: string;
  connected: boolean;
  status?: string;
  connectedAccountId?: string;
  authConfigMissing: boolean;
};

const TOOLKIT_LABEL: Record<ComposioToolkit, string> = {
  gmail: "Gmail",
  googlecalendar: "Google Calendar",
};

type ConnectedAccountRow = {
  id?: string;
  status?: string;
  isDisabled?: boolean;
  toolkit?: { slug?: string };
};

type ConnectionRequestLike = {
  id?: string;
  redirectUrl?: string;
  redirect_url?: string;
};

function pickRedirectUrl(req: ConnectionRequestLike | null | undefined): string | undefined {
  return req?.redirectUrl || req?.redirect_url;
}

/**
 * Hermes-style connect: only COMPOSIO_API_KEY is required.
 * `session.authorize(toolkit)` auto-creates a managed Auth Config and returns a Connect Link.
 */
export async function getToolkitConnectionStatuses(
  userId: string
): Promise<ToolkitConnectionStatus[]> {
  const toolkits: ComposioToolkit[] = ["gmail", "googlecalendar"];

  if (!isComposioConfigured()) {
    return toolkits.map((toolkit) => ({
      toolkit,
      label: TOOLKIT_LABEL[toolkit],
      connected: false,
      authConfigMissing: false,
    }));
  }

  const composio = getComposio();
  let accounts: ConnectedAccountRow[] = [];

  try {
    const listed = await composio.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: toolkits,
    });
    accounts = ((listed as { items?: ConnectedAccountRow[] }).items ?? []) as ConnectedAccountRow[];
  } catch (err) {
    console.error("[composio] connectedAccounts.list failed:", err);
  }

  return toolkits.map((toolkit) => {
    const match = accounts.find(
      (a) =>
        a.toolkit?.slug?.toLowerCase() === toolkit &&
        !a.isDisabled &&
        String(a.status ?? "ACTIVE").toUpperCase() === "ACTIVE"
    );
    return {
      toolkit,
      label: TOOLKIT_LABEL[toolkit],
      connected: Boolean(match?.id),
      status: match?.status,
      connectedAccountId: match?.id,
      authConfigMissing: false,
    };
  });
}

export async function createConnectLink(input: {
  userId: string;
  toolkit: ComposioToolkit;
  callbackUrl: string;
}): Promise<{ redirectUrl: string; connectionId?: string }> {
  if (!isComposioConfigured()) {
    throw new Error("COMPOSIO_API_KEY is not configured.");
  }

  const composio = getComposio();

  // Primary path (Hermes / current Composio docs): session + authorize by toolkit slug.
  try {
    const session = await composio.create(input.userId, {
      toolkits: [input.toolkit],
      manageConnections: { callbackUrl: input.callbackUrl },
    });
    const connectionRequest = (await session.authorize(input.toolkit, {
      callbackUrl: input.callbackUrl,
    })) as ConnectionRequestLike;
    const redirectUrl = pickRedirectUrl(connectionRequest);
    if (redirectUrl) {
      return { redirectUrl, connectionId: connectionRequest.id };
    }
  } catch (err) {
    console.warn("[composio] session.authorize failed, trying toolkits.authorize:", err);
  }

  // Fallback: toolkits.authorize auto-creates an auth config if needed.
  const viaToolkit = (await composio.toolkits.authorize(
    input.userId,
    input.toolkit
  )) as ConnectionRequestLike;
  const redirectUrl = pickRedirectUrl(viaToolkit);
  if (!redirectUrl) {
    throw new Error("Composio did not return an OAuth redirect URL.");
  }
  return { redirectUrl, connectionId: viaToolkit.id };
}

export async function disconnectToolkit(input: {
  userId: string;
  toolkit: ComposioToolkit;
}): Promise<void> {
  if (!isComposioConfigured()) {
    throw new Error("COMPOSIO_API_KEY is not configured.");
  }

  const statuses = await getToolkitConnectionStatuses(input.userId);
  const row = statuses.find((s) => s.toolkit === input.toolkit);
  if (!row?.connectedAccountId) return;

  const composio = getComposio();
  await composio.connectedAccounts.delete(row.connectedAccountId);
}
