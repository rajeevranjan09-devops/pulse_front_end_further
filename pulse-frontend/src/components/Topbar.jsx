// src/components/Topbar.jsx
import { useEffect, useRef, useState } from "react";
import { fetchOrganizations } from "../services/gh";

export default function Topbar({ user, onLogout, org, setOrg, onReload }) {
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgErr, setOrgErr] = useState("");

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close avatar menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // load orgs on mount
  useEffect(() => {
    (async () => {
      setLoadingOrgs(true);
      setOrgErr("");
      try {
        const list = await fetchOrganizations();
        setOrgs(list);
        // default org: saved or first from list
        const saved = localStorage.getItem("selected_org");
        if (!org && (saved || list[0])) {
          setOrg(saved || list[0]);
        }
      } catch (e) {
        setOrgErr(e?.response?.data?.error || "Failed to load organizations");
      } finally {
        setLoadingOrgs(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist org selection
  useEffect(() => {
    if (org) localStorage.setItem("selected_org", org);
  }, [org]);

  const onOrgChange = (e) => {
    const sel = e.target.value;
    setOrg(sel);
    onReload && onReload(); // optional immediate refresh
  };

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: brand + org selector */}
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">Pulse_AI</div>

          <div className="ml-2">
            <select
              disabled={loadingOrgs}
              value={org || ""}
              onChange={onOrgChange}
              className="border rounded-lg px-3 py-2 min-w-[220px]"
              title="Select GitHub organization"
            >
              {!org && <option value="">Select organization</option>}
              {orgs.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {orgErr && <span className="text-xs text-red-600 ml-2">{orgErr}</span>}
        </div>

        {/* Right: avatar menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold"
            title={user?.username}
          >
            {initials || "U"}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow">
              <div className="px-4 py-3 border-b">
                <div className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">{user?.username}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}