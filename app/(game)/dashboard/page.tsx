// app/(game)/dashboard/page.tsx
// Figma: full-screen pixel-art village dashboard with parallax scroll and dynamic points color.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageWrapper from "@/components/layout/PageWrapper";
import DashboardIntro from "@/components/dashboard/DashboardIntro";
import ParallaxBg from "@/components/layout/ParallaxBg";
import Link from "next/link";

async function getDashboardData(studentId: string) {
  const [
    { data: student },
    { data: activeQuests },
    { data: announcements },
    { count: totalNPCs },
  ] = await Promise.all([
    supabase
      .from("Student")
      .select("*, group:Group(*)")
      .eq("studentId", studentId)
      .maybeSingle(),
    supabase
      .from("Quest")
      .select("*")
      .eq("isActive", true)
      .eq("isHidden", false)
      .limit(3),
    supabase
      .from("Announcement")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: false }),
    supabase
      .from("NPC")
      .select("*", { count: "exact", head: true })
      .eq("isActive", true),
  ]);

  return {
    student,
    activeQuests: activeQuests ?? [],
    announcements: announcements ?? [],
    totalNPCs: totalNPCs ?? 0,
  };
}

/* ── Quick-action tiles (Figma 2×2 grid with SVG icons) ────────────────── */
const quickTiles = [
  {
    href: "/info/guidebook",
    icon: "/images/dashboard/guidebook.svg",
    label: "Guidebook",
  },
  {
    href: "/info/timeline",
    icon: "/images/dashboard/timeline.svg",
    label: "Timeline",
  },
  { href: "/info/maps", icon: "/images/dashboard/map.svg", label: "Map" },
  { href: "/info/clubs", icon: "/images/dashboard/food.svg", label: "Food" },
];

/** Gold outline shared across all Figma-style page titles */
const OUTLINE_GOLD = {
  color: "#ffd23f",
  textShadow:
    "2.5px 2.5px 0 #3e2723, -2.5px 2.5px 0 #3e2723, 2.5px -2.5px 0 #3e2723, -2.5px -2.5px 0 #3e2723, 0 4px 0 #3e2723",
};

/** Positive green, negative red, neutral dark brown */
function getPointsColor(pts: number): string {
  if (pts > 0) return "text-[#1b8a34]"; // Green when positive
  if (pts < 0) return "text-[#d32f2f]"; // Red when negative
  return "text-[#3e2723]"; // Neutral dark brown
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { student, activeQuests, announcements, totalNPCs } =
    await getDashboardData((session.user as any).studentId);

  if (!student) redirect("/login");

  const latestAnn = announcements[0];
  const pointsColorClass = getPointsColor(student.points);

  return (
    <PageWrapper>
      <DashboardIntro show={!student.hasSeenIntro} />

      {/* ── Parallax village background ── */}
      <ParallaxBg src="/images/scan/bg.png" />

      {/* ── Main content column — centered game-column ── */}
      <div className="game-column pt-3 sm:pt-5 pb-28 sm:pb-32 md:pb-12 flex flex-col gap-3.5 sm:gap-4">
        {/* ── Top Announcement Ticker (No arrow click, title + content in line) ── */}
        <div className="flex flex-col gap-1" data-tour="announcements">
          <div className="flex items-center gap-2 px-1">
            <img
              src="/images/dashboard/coin.svg"
              alt=""
              className="w-6 h-6 object-contain"
            />
            <span
              className="font-bytebounce text-[22px] sm:text-[25px] leading-none text-[#ffd23f] font-bold"
              style={{ textShadow: "2px 2px 0 #3e2723" }}
            >
              New announcement!
            </span>
          </div>

          <div className="rounded-md border-2 border-[#3e2723] bg-[#fdf3e3] px-4 py-3.5 shadow-[3px_3px_0_#3e2723]">
            <p className="font-bytebounce text-[19px] sm:text-[21px] leading-snug text-[#3e2723] break-words whitespace-normal">
              {latestAnn ? (
                <>
                  <span className="font-bold uppercase">{latestAnn.title}</span>{" "}
                  — {latestAnn.content}
                </>
              ) : (
                "Welcome to NSO 2026! Check Info Station for daily updates."
              )}
            </p>
          </div>
        </div>

        {/* ── 2×2 Quick Tiles + You have collected side panel ── */}
        <div className="flex gap-2.5 items-stretch">
          {/* Left 2×2 Grid with larger icons */}
          <div
            className="grid grid-cols-2 gap-2 flex-1 min-w-0"
            data-tour="actions"
          >
            {quickTiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                aria-label={tile.label}
                className="wood-plank flex flex-col items-center justify-center p-3 text-center transition-transform hover:scale-[1.02] active:scale-[0.97] min-h-[112px] shadow-[3px_3px_0_#3e2723]"
              >
                <img
                  src={tile.icon}
                  alt=""
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain mb-1.5"
                  style={{ imageRendering: "pixelated" }}
                />
                <span
                  className="font-bytebounce text-[20px] sm:text-[22px] leading-none text-[#fff3d9] font-bold"
                  style={{ textShadow: "2px 2px 0 #3e2723" }}
                >
                  {tile.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Side Panel: You have collected : (larger points text & dynamic color) */}
          <div
            className="rounded-md border-2 border-[#3e2723] bg-[#fdf3e3] flex flex-col items-center justify-between p-3.5 w-[38%] shrink-0 shadow-[3px_3px_0_#3e2723] text-center"
            data-tour="codex"
          >
            <div>
              <p className="font-bytebounce text-[16px] sm:text-[18px] leading-tight text-[#5d3a1a] font-bold" style={{ textShadow: '1px 1px 0 #e6c896' }}>
                You have
                <br />
                collected :
              </p>
              <p
                className={`font-bytebounce text-[clamp(44px,14vw,66px)] leading-none font-bold mt-1 ${pointsColorClass}`}
              >
                {student.points}
              </p>
              <p className="font-bytebounce text-[15px] sm:text-[17px] leading-none text-[#8a5a37] tracking-wider uppercase font-bold mt-1">
                POINTS
              </p>
            </div>

            <div className="w-full border-b-2 border-[#d2b48c] my-2" />

            <div>
              <p className="font-bytebounce text-[clamp(26px,8vw,36px)] leading-none text-[#3e2723] font-bold">
                {student.funFactsCollected}/{totalNPCs || 66}
              </p>
              <p className="font-bytebounce text-[15px] sm:text-[17px] leading-none text-[#8a5a37] tracking-wider uppercase font-bold mt-1">
                FUN FACTS
              </p>
            </div>
          </div>
        </div>

        {/* ── Active Quests section ── */}
        <div className="flex flex-col gap-2.5 mt-1" data-tour="quests">
          <div className="flex items-center gap-2.5 px-1">
            <img
              src="/images/dashboard/quest.svg"
              alt=""
              className="w-7 h-7 object-contain"
            />
            <h2
              className="font-bytebounce text-[28px] sm:text-[32px] leading-none"
              style={OUTLINE_GOLD}
            >
              Active Quests
            </h2>
          </div>

          {activeQuests.length === 0 ? (
            <div className="rounded-md border-2 border-[#3e2723] bg-[#fdf3e3] px-4 py-5 text-center shadow-[3px_3px_0_#3e2723]">
              <p className="font-bytebounce text-[18px] text-[#7d5a3d]">
                No active quests right now
              </p>
            </div>
          ) : (
            activeQuests.map((quest) => (
              <Link
                key={quest.id}
                href="/quests"
                className="block transition-transform active:translate-y-0.5"
              >
                <div className="wood-plank px-4 py-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0_#3e2723]">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bytebounce text-[20px] leading-tight text-[#fff3d9] truncate"
                      style={{ textShadow: "2px 2px 0 #3e2723" }}
                    >
                      {quest.title}
                    </p>
                    <p
                      className="font-bytebounce text-[14px] leading-tight text-[#e0b391] truncate mt-0.5"
                      style={{ textShadow: "1px 1px 0 #3e2723" }}
                    >
                      {quest.description || "Ask their Funfacts"}
                    </p>
                  </div>
                  <span
                    className="font-bytebounce text-[22px] text-[#ffd23f] shrink-0"
                    style={{ textShadow: "2px 2px 0 #3e2723" }}
                  >
                    ▶
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* ── All Announcements ── */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center justify-between px-1">
            <h2
              className="font-bytebounce text-[28px] sm:text-[32px] leading-none"
              style={OUTLINE_GOLD}
            >
              All Announcements
            </h2>
            <span
              className="font-bytebounce text-[18px] sm:text-[20px] leading-none text-[#ffd23f]"
              style={{ textShadow: "1.5px 1.5px 0 #3e2723" }}
            >
              {announcements.length} total
            </span>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-md border-2 border-[#3e2723] bg-[#fdf3e3] px-4 py-5 text-center shadow-[3px_3px_0_#3e2723]">
              <p className="font-bytebounce text-[18px] text-[#7d5a3d]">
                No announcements posted yet
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.map((ann: any) => (
                <div
                  key={ann.id}
                  className="rounded-md border-2 border-[#3e2723] bg-[#fdf3e3] p-4 space-y-1.5 shadow-[3px_3px_0_#3e2723]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bytebounce text-[20px] leading-snug text-[#3e2723] font-bold uppercase">
                      {ann.title}
                    </h3>
                    <span className="font-bytebounce text-[13px] text-[#8a5a37] shrink-0">
                      {new Date(ann.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="font-bytebounce text-[16px] leading-relaxed text-[#5d4330] whitespace-pre-line">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
