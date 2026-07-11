"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  disconnectToolkitConnection,
  getIntegrationsStatus,
  startToolkitConnect,
  type ConnectionsData,
} from "@/app/dashboard/settings/actions";
import type { ComposioToolkit } from "@/lib/composio/connections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GmailLogo, GoogleCalendarLogo } from "@/components/icons/AppLogos";

const POPUP_NAME = "scholarpath_composio_oauth";

const TOOLKIT_LOGO: Record<ComposioToolkit, typeof GmailLogo> = {
  gmail: GmailLogo,
  googlecalendar: GoogleCalendarLogo,
};

export function IntegrationsPanel({ initial }: { initial: ConnectionsData }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const res = await getIntegrationsStatus();
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setData(res.data);
    });
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "composio-oauth-done") return;
      setInfo(
        event.data.toolkit
          ? `${event.data.toolkit === "gmail" ? "Gmail" : "Google Calendar"} connection finished — refreshing status…`
          : "Connection finished — refreshing status…"
      );
      refresh();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refresh]);

  function connect(toolkit: ComposioToolkit) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await startToolkitConnect({ toolkit });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }

      const popup = window.open(
        res.data.redirectUrl,
        POPUP_NAME,
        "popup=yes,width=560,height=720"
      );

      if (!popup) {
        // Popup blocked — fall back to same-tab redirect
        window.location.href = res.data.redirectUrl;
        return;
      }

      setInfo("Complete Google authorization in the popup window…");
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          setInfo("Popup closed — refreshing connection status…");
          refresh();
        }
      }, 800);
    });
  }

  function disconnect(toolkit: ComposioToolkit) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await disconnectToolkitConnection({ toolkit });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setInfo("Disconnected.");
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-lg font-medium text-foreground">Connected apps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Gmail and Google Calendar so Deadlines can send reminders to your inbox and
          calendar. Only a Composio API key is required on the server — click Connect and finish
          Google authorization in the popup (same flow as Hermes).
        </p>
        {!data.configured && (
          <p className="mt-3 text-sm text-warning">
            Server is missing <code className="text-foreground">COMPOSIO_API_KEY</code>. Add it to
            the environment, then reload.
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Your connection is saved under Composio user{" "}
          <code className="text-foreground">{data.composioUserId}</code> (your ScholarPath account
          id — no manual setup needed).
        </p>
      </Card>

      {info && <p className="text-sm text-success">{info}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-3">
        {data.connections.map((row) => {
          const Logo = TOOLKIT_LOGO[row.toolkit];
          return (
          <Card key={row.toolkit} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo className="h-9 w-9" />
                <div>
                  <p className="font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {!data.configured
                      ? "Composio API key not configured on the server"
                      : row.connected
                        ? "Connected and ready for deadline reminders"
                        : "Not connected — click Connect for a Google popup"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={row.connected ? "text-success" : "text-warning"}>
                  {row.connected ? "Connected" : "Not connected"}
                </Badge>
                {row.connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => disconnect(row.toolkit)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending || !data.configured}
                    onClick={() => connect(row.toolkit)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      <Button variant="outline" size="sm" disabled={isPending} onClick={refresh}>
        Refresh status
      </Button>
    </div>
  );
}
