"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "ledger", label: "Ledger", background: "" },
  { id: "temple", label: "Temple", background: "/bg1.jpg" },
  { id: "mist", label: "Mist", background: "/bg2.png" },
  { id: "paper", label: "Paper", background: "/bg3.png" },
  { id: "gold", label: "Gold", background: "/bg4.png" },
];

export default function ThemeSettings() {
  const [theme, setTheme] = useState("ledger");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ahpoji-theme") || "ledger";
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  function changeTheme(event) {
    const nextTheme = event.target.value;
    setTheme(nextTheme);
    window.localStorage.setItem("ahpoji-theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  return (
    <label className="theme-settings">
      <span className="stamp text-[10px] text-paper/40">theme</span>
      <select value={theme} onChange={changeTheme} aria-label="Choose theme">
        {THEMES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );
}
