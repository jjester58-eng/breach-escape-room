Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
"use client";

import { useEffect, useState } from "react";

type CampaignRecord = { xp?: number; completedMissions?: string[] };

export default function CampaignProgress() {
  const [record, setRecord] = useState<CampaignRecord>({});
  useEffect(() => {
    function refresh() {
      try { setRecord(JSON.parse(window.localStorage.getItem("breach-campaign") || "{}")); }
      catch { setRecord({}); }
    }
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  return <span className="campaign-progress-chip"><strong>{Number(record.xp || 0)} XP</strong><span>{record.completedMissions?.length || 0} CLEARED</span></span>;
}

