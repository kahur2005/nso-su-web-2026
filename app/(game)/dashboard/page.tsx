// app/(game)/dashboard/page.tsx
// Figma node 14-2: pixel-art village dashboard — parchment announcement sheet,
// 2×2 wooden quick-action plaques beside the points/fun-facts tally, then the
// active-quest sheets. Header (Navbar) and footer (BottomNav) come from
// PageWrapper and are deliberately untouched.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageWrapper from "@/components/layout/PageWrapper";
import PageIntro from "@/components/onboarding/PageIntro";
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
const TILE_ICON = "w-16 h-16 sm:w-[72px] sm:h-[72px]";

type QuickTile = {
  href: string;
  icon: string;
  label: string;
  iconClass: string;
  /** Optional optical-alignment nudge; see the guidebook tile for the why. */
  iconTransform?: string;
};

const quickTiles: QuickTile[] = [
  {
    href: "/info/guidebook",
    icon: "/images/dashboard/guidebook.svg",
    label: "Guidebook",
    // The book art needs to render larger than the other three, because inside
    // its own 64×64 canvas the ink only spans rows 26–58 — barely half the
    // frame, against 49 of 64 rows for timeline.svg.
    //
    // That size boost used to come from a bigger box (w-20 / w-[88px]), which
    // caused both misalignments on this tile. A taller box made this the
    // tallest content group in the grid, so `justify-center` stopped absorbing
    // any slack here while it still did on the other tiles — dropping the label
    // 8px below its neighbours' — and it also amplified the art's own lopsided
    // padding (26px empty above vs 5px below, i.e. an ink centre 16.41% below
    // the canvas centre, against 2.15% for timeline.svg).
    //
    // So the box is now the shared TILE_ICON and the size comes from `scale`
    // instead. Transforms don't affect layout, so all four groups are the same
    // height and every label lines up; `scale(1.25)` reproduces the old 80/88px
    // render, and the translate cancels what scaling the off-centre art leaves
    // over: 1.25 × 16.41% − 2.15% = 18.36%. Being percentages of the box, this
    // holds at every breakpoint. The lift is transparent padding only — no ink
    // leaves the plaque.
    //
    // The real fix is recentring the art inside guidebook.svg, after which this
    // whole transform should go away.
    iconClass: TILE_ICON,
    iconTransform: "translateY(-18.36%) scale(1.25)",
  },
  {
    href: "/info/timeline",
    icon: "/images/dashboard/timeline.svg",
    label: "Timeline",
    iconClass: TILE_ICON,
  },
  {
    href: "/info/maps",
    icon: "/images/dashboard/map.svg",
    label: "Map",
    iconClass: TILE_ICON,
  },
  {
    href: "/lunch",
    icon: "/images/dashboard/food.svg",
    label: "Food",
    iconClass: TILE_ICON,
  },
];

/** Cream fill + dark pixel outline — the Figma treatment for every heading */
const OUTLINE_CREAM = {
  color: "#ffecb3",
  textShadow:
    "2.5px 2.5px 0 #2f1c17, -2.5px 2.5px 0 #2f1c17, 2.5px -2.5px 0 #2f1c17, -2.5px -2.5px 0 #2f1c17, 0 4px 0 #2f1c17",
};

/** Same treatment one step down, for the smaller label rows */
const OUTLINE_CREAM_SM = {
  color: "#ffecb3",
  textShadow:
    "2px 2px 0 #2f1c17, -2px 2px 0 #2f1c17, 2px -2px 0 #2f1c17, -2px -2px 0 #2f1c17",
};

/** The tally reads dark brown in the design; a deficit still flags red. */
function getPointsColor(pts: number): string {
  return pts < 0 ? "text-[#c62828]" : "text-[#3e2723]";
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
      <PageIntro page="dashboard" />

      {/* ── Village background ── */}
      <ParallaxBg src="/images/scan/bg.png" />

      {/* ── Main content column — centered game-column ── */}
      <div className="game-column pt-3 sm:pt-5 pb-28 sm:pb-32 md:pb-12 flex flex-col gap-4">
        {/* ── Latest announcement sheet ── */}
        <div className="flex flex-col gap-1.5" data-tour="announcements">
          <div className="flex items-center gap-2 px-0.5">
            <img
              src="/images/dashboard/coin.svg"
              alt=""
              className="w-6 h-6 object-contain shrink-0"
            />
            <span
              className="font-bytebounce text-fluid-xl leading-none"
              style={OUTLINE_CREAM_SM}
            >
              New announcement!
            </span>
          </div>

          <Link
            href="#all-announcements"
            className="parchment-card flex items-center gap-3 px-2.5 py-2.5 min-h-[70px] transition-transform active:translate-y-0.5"
          >
            <p className="flex-1 min-w-0 font-bytebounce text-fluid-lg leading-snug text-[#6d4c41] line-clamp-2">
              {latestAnn ? (
                <>
                  <span className="text-[#3e2723]">{latestAnn.title}</span>
                  {latestAnn.content ? ` — ${latestAnn.content}` : ""}
                </>
              ) : (
                "Welcome to NSO 2026! Check Info Station for daily updates."
              )}
            </p>
            <span className="pixel-arrow shrink-0" aria-hidden />
          </Link>
        </div>

        {/* ── 2×2 quick-action plaques + points tally ── */}
        <div className="flex gap-2.5 items-stretch">
          <div
            className="grid grid-cols-2 gap-2 flex-1 min-w-0"
            data-tour="actions"
          >
            {quickTiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                aria-label={tile.label}
                className="wood-tile flex flex-col items-center justify-center gap-1 p-2 text-center min-h-[120px] transition-transform hover:scale-[1.02] active:scale-[0.97]"
              >
                <img
                  src={tile.icon}
                  alt=""
                  className={`${tile.iconClass} object-contain`}
                  style={{
                    imageRendering: "pixelated",
                    transform: tile.iconTransform,
                  }}
                />
                <span
                  className="font-bytebounce text-fluid-lg leading-none text-[#e0b391]"
                  style={{ textShadow: "2px 2px 0 #3e2723" }}
                >
                  {tile.label}
                </span>
              </Link>
            ))}
          </div>

          <div
            className="parchment-panel flex flex-col items-center justify-center gap-3 px-1.5 py-3 w-[38%] shrink-0 text-center"
            data-tour="stats"
          >
            <div>
              <p className="font-bytebounce text-fluid-sm leading-tight text-[#6d4c41]">
                You have
                <br />
                collected :
              </p>
              <p
                className={`font-bytebounce text-[clamp(46px,15vw,68px)] leading-none mt-1 ${pointsColorClass}`}
              >
                {student.points}
              </p>
              <p className="font-bytebounce text-fluid-base leading-none text-[#6d4c41] mt-0.5">
                Points
              </p>
            </div>

            <div>
              <p className="font-bytebounce text-[clamp(28px,9vw,40px)] leading-none text-[#3e2723]">
                {student.funFactsCollected}/{totalNPCs || 66}
              </p>
              <p className="font-bytebounce text-fluid-base leading-none text-[#6d4c41] mt-0.5">
                Fun Facts
              </p>
            </div>
          </div>
        </div>

        {/* ── Active Quests ── */}
        <div className="flex flex-col gap-2.5" data-tour="quests">
          <div className="flex items-center gap-2.5 px-0.5">
            <img
              src="/images/dashboard/quest.svg"
              alt=""
              className="w-8 h-8 object-contain shrink-0"
            />
            <h2
              className="font-bytebounce text-fluid-3xl leading-none"
              style={OUTLINE_CREAM}
            >
              Active Quests
            </h2>
          </div>

          {activeQuests.length === 0 ? (
            <div className="parchment-card px-2.5 py-3.5 text-center">
              <p className="font-bytebounce text-fluid-md text-[#6d4c41]">
                No active quests right now
              </p>
            </div>
          ) : (
            activeQuests.map((quest) => (
              <Link
                key={quest.id}
                href="/quests"
                className="parchment-card flex items-center gap-3 px-2.5 py-2.5 min-h-[70px] transition-transform active:translate-y-0.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bytebounce text-fluid-xl leading-tight text-[#3e2723] truncate">
                    {quest.title}
                  </p>
                  <p className="font-bytebounce text-fluid-base leading-tight text-[#6d4c41] truncate mt-0.5 pl-3">
                    {quest.description || "Ask their Funfacts"}
                  </p>
                </div>
                <span className="pixel-arrow shrink-0" aria-hidden />
              </Link>
            ))
          )}
        </div>

        {/* ── All Announcements (below the Figma fold, same sheet styling) ── */}
        <div
          id="all-announcements"
          className="flex flex-col gap-2.5 scroll-mt-24"
          data-tour="all-announcements"
        >
          <div className="flex items-end justify-between gap-2 px-0.5">
            <h2
              className="font-bytebounce text-fluid-3xl leading-none"
              style={OUTLINE_CREAM}
            >
              All Announcements
            </h2>
            <span
              className="font-bytebounce text-fluid-base leading-none shrink-0"
              style={OUTLINE_CREAM_SM}
            >
              {announcements.length} total
            </span>
          </div>

          {announcements.length === 0 ? (
            <div className="parchment-card px-2.5 py-3.5 text-center">
              <p className="font-bytebounce text-fluid-md text-[#6d4c41]">
                No announcements posted yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {announcements.map((ann: any) => (
                <div key={ann.id} className="parchment-card px-2.5 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bytebounce text-fluid-xl leading-snug text-[#3e2723]">
                      {ann.title}
                    </h3>
                    <span className="font-bytebounce text-fluid-sm leading-snug text-[#8a6a52] shrink-0 mt-0.5">
                      {new Date(ann.createdAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="font-bytebounce text-fluid-base leading-relaxed text-[#6d4c41] whitespace-pre-line mt-1">
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
