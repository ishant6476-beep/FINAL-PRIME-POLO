import type { Session } from "@supabase/supabase-js";
import { BarChart3, Check, ChevronDown, CircleUserRound, Download, Inbox, LogOut, Mail, MessageSquareText, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageIntro, PrimaryButton } from "../components/ui";
import { isSupabaseConfigured, type ChatRecord, type LeadRecord, type LeadStatus, supabase, supabaseConfigStatus } from "../lib/supabase";

const statuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

function StaffLogin({ onLogin }: { onLogin: (session: Session) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
    });
    if (authError) setError(authError.message);
    else if (data.session) onLogin(data.session);
    setLoading(false);
  };
  if (!isSupabaseConfigured) return <div className="admin-login glass-elite"><span><ShieldCheck /></span><h2>Supabase connection required</h2><p>The staff CRM activates once the public project URL and anon key are added to your environment. Status: {supabaseConfigStatus}</p></div>;
  return (
    <form className="admin-login glass-elite" onSubmit={submit}>
      <span><ShieldCheck /></span>
      <small>Restricted Workspace</small>
      <h2>Staff sign in</h2>
      <p>Access is granted only to authenticated staff with the appropriate role in the database.</p>
      <label><span>Email</span><input name="email" type="email" placeholder="staff@primepolo.com" required /></label>
      <label><span>Password</span><input name="password" type="password" placeholder="••••••••" required /></label>
      {error && <div className="form-notice error">{error}</div>}
      <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Signing in..." : "Access CRM"}</button>
    </form>
  );
}

function LeadRow({ lead, onSaved }: { lead: LeadRecord; onSaved: (lead: LeadRecord) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");
  const [followUp, setFollowUp] = useState(lead.follow_up_date?.slice(0, 10) || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { data } = await supabase
      .from("leads")
      .update({ status, notes: notes.trim() || null, follow_up_date: followUp || null })
      .eq("id", lead.id)
      .select()
      .single();
    if (data) onSaved(data as LeadRecord);
    setSaving(false);
  };
  return (
    <article className={`lead-row ${expanded ? "expanded" : ""}`}>
      <button className="lead-summary" onClick={() => setExpanded((value) => !value)}>
        <span className={`status-dot ${lead.status}`} />
        <div>
          <strong>{lead.name}</strong>
          <small>{lead.email}</small>
        </div>
        <span className="lead-meta">
          {lead.company && <span>{lead.company}</span>}
          {lead.service && <span>{lead.service}</span>}
        </span>
        <ChevronDown size={16} />
      </button>
      {expanded && (
        <div className="lead-details">
          <div className="detail-group">
            <div>
              <span>Email</span>
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </div>
            {lead.phone && (
              <div>
                <span>Phone</span>
                <a href={`tel:${lead.phone}`}>{lead.phone}</a>
              </div>
            )}
          </div>
          <div className="detail-group">
            {lead.company && (
              <div>
                <span>Company</span>
                <p>{lead.company}</p>
              </div>
            )}
            {lead.service && (
              <div>
                <span>Service</span>
                <p>{lead.service}</p>
              </div>
            )}
            {lead.budget && (
              <div>
                <span>Budget</span>
                <p>{lead.budget}</p>
              </div>
            )}
          </div>
          <div className="detail-group full">
            <span>Message</span>
            <p>{lead.message}</p>
          </div>
          <div className="detail-group">
            <label>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.currentTarget.value as LeadStatus)}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Follow-up date</span>
              <input type="date" value={followUp} onChange={(e) => setFollowUp(e.currentTarget.value)} />
            </label>
          </div>
          <label className="full-width">
            <span>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.currentTarget.value)} placeholder="Internal notes..." />
          </label>
          <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </article>
  );
}

function Analytics({ leads }: { leads: LeadRecord[] }) {
  const values = statuses.map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length }));
  const max = Math.max(1, ...values.map((item) => item.count));
  const won = values.find((item) => item.status === "won")?.count || 0;
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;
  return (
    <div className="admin-analytics">
      <div className="admin-kpis">
        <div>
          <Inbox />
          <span>
            Total leads<strong>{leads.length}</strong>
          </span>
        </div>
        <div>
          <UsersRound />
          <span>
            Qualified<strong>{values.find((item) => item.status === "qualified")?.count || 0}</strong>
          </span>
        </div>
        <div>
          <Check />
          <span>
            Conversion<strong>{conversion}%</strong>
          </span>
        </div>
      </div>
      <div className="admin-chart">
        <div className="chart-bars">
          {values.map((item) => (
            <div key={item.status} className={`bar-item ${item.status}`}>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${(item.count / max) * 100}%` }} />
              </div>
              <span>{item.count}</span>
              <small>{item.status}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffCRM({ session, staffRole, onLogout }: { session: Session; staffRole: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"leads" | "chat" | "analytics">("leads");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const [leadResponse, chatResponse] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("chat_logs").select("*").order("created_at", { ascending: false }),
    ]);
    setLeads((leadResponse.data || []) as LeadRecord[]);
    setChats((chatResponse.data || []) as ChatRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      leads.filter(
        (lead) =>
          `${lead.name} ${lead.email} ${lead.company || ""} ${lead.service || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [leads, query],
  );

  const updateLead = (updated: LeadRecord) => setLeads((items) => items.map((item) => (item.id === updated.id ? updated : item)));

  const downloadCsv = () => {
    const rows = [
      ["Name", "Email", "Phone", "Company", "Service", "Budget", "Status", "Created"],
      ...filtered.map((lead) => [
        lead.name,
        lead.email,
        lead.phone || "",
        lead.company || "",
        lead.service || "",
        lead.budget || "",
        lead.status,
        new Date(lead.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "prime-polo-leads.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="crm-shell">
      <div className="crm-top">
        <div>
          <span className="live-dot" />
          Secure staff session
          <h2>Growth Operations</h2>
          <p>
            {session.user.email} <b>{staffRole}</b>
          </p>
        </div>
        <div className="crm-actions">
          <button onClick={() => void load()}><RefreshCw /> Refresh</button>
          {tab === "leads" && <button onClick={downloadCsv}><Download /> Export CSV</button>}
          <button onClick={() => void onLogout()}><LogOut /> Log Out</button>
        </div>
      </div>

      <div className="crm-tabs">
        <button className={tab === "leads" ? "active" : ""} onClick={() => setTab("leads")}>
          <Mail /> Leads ({leads.length})
        </button>
        <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>
          <MessageSquareText /> Conversations ({chats.length})
        </button>
        <button className={tab === "analytics" ? "active" : ""} onClick={() => setTab("analytics")}>
          <BarChart3 /> Analytics
        </button>
      </div>

      {tab === "leads" && (
        <div className="crm-content">
          <div className="crm-search">
            <Search />
            <input
              type="text"
              placeholder="Search by name, email, company, service..."
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
          </div>
          {loading ? (
            <div className="crm-loading">
              <RefreshCw /> Loading leads...
            </div>
          ) : filtered.length > 0 ? (
            <div className="leads-list">{filtered.map((lead) => <LeadRow key={lead.id} lead={lead} onSaved={updateLead} />)}</div>
          ) : (
            <div className="crm-empty">
              <Inbox />
              <p>{query ? "No leads match your search." : "No leads yet."}</p>
            </div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <div className="crm-content">
          {loading ? (
            <div className="crm-loading">
              <RefreshCw /> Loading conversations...
            </div>
          ) : chats.length > 0 ? (
            <div className="chats-list">
              {chats.map((chat, index) => (
                <article key={index} className="chat-record glass-elite">
                  <div className="chat-meta">
                    <small>{new Date(chat.created_at).toLocaleString()}</small>
                  </div>
                  <div className="chat-exchange">
                    <div className="message user">
                      <p>{chat.user_message}</p>
                    </div>
                    <div className="message bot">
                      <p>{chat.bot_reply}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="crm-empty">
              <MessageSquareText />
              <p>No chat conversations yet.</p>
            </div>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <div className="crm-content">
          <Analytics leads={leads} />
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [staffRole, setStaffRole] = useState("");
  const [checking, setChecking] = useState(true);
  const [rejected, setRejected] = useState(false);

  const verify = async (candidate: Session) => {
    setChecking(true);
    setRejected(false);
    const { data, error } = await supabase.from("staff_roles").select("role").eq("id", candidate.user.id).maybeSingle();
    if (error || !data) {
      setRejected(true);
      setSession(null);
      await supabase.auth.signOut();
    } else {
      setSession(candidate);
      setStaffRole(data.role);
    }
    setChecking(false);
  };

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => (data.session ? verify(data.session) : setChecking(false)));
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStaffRole("");
  };

  return (
    <main className="admin-page">
      <PageIntro tag="Staff Operations" title="Prime Polo CRM" copy="Protected lead intelligence, conversation history and pipeline visibility for authorized staff." />
      <section className="section admin-content">
        <div className="container-elite">
          {checking ? (
            <div className="admin-loading">
              <RefreshCw /> Verifying access...
            </div>
          ) : rejected ? (
            <div className="admin-rejected glass-elite">
              <ShieldCheck />
              <h2>Access Denied</h2>
              <p>Your account does not have permission to access the staff CRM. Contact an administrator.</p>
            </div>
          ) : session ? (
            <StaffCRM session={session} staffRole={staffRole} onLogout={logout} />
          ) : (
            <StaffLogin onLogin={verify} />
          )}
        </div>
      </section>
    </main>
  );
}
