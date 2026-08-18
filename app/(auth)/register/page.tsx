"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import PixelAvatar from "@/components/ui/PixelAvatar";

const TOTAL_STEPS = 5;

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  instagram: string;
  major: string;
  hobby: string;
  achievements: string;
  medicalNote: string;
  gender: "M" | "F" | "other" | "";
}

const STEP_TITLES: [string, string][] = [
  ["Let's get", "started"],
  ["About", "you"],
  ["Your", "story"],
  ["Your", "avatar!"],
  ["Last", "step!"],
];

const labelClass = "block font-bytebounce text-fluid-lg text-[#e0b391]";
const labelShadow = { textShadow: "2px 1.4px 0 #4e342e" };
const inputClass =
  "mt-1 w-full rounded-[13px] border-2 border-[#e0b391] bg-white px-4 font-bytebounce text-fluid-lg text-[#4e342e] placeholder:text-[#c9b6a4] focus:border-[#fbc94c] focus:outline-none";

const SKINS = [
  "skin1",
  "skin2",
  "skin3",
  "skin4",
  "skin5",
  "skin6",
  "skin7",
  "skin8",
  "skin9",
  "skin10",
];
const EYES = Array.from({ length: 16 }, (_, i) => `eyes${i + 1}`);
const BROWS = Array.from({ length: 18 }, (_, i) => `brow${i + 1}`);

const CLOTHES: Array<{ key: string | null; label: string }> = [
  { key: null, label: "None" },
  ...Array.from({ length: 9 }, (_, i) => ({
    key: `roundshirt${i + 1}`,
    label: `Round ${i + 1}`,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    key: `shirt${i + 1}`,
    label: `Shirt ${i + 1}`,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    key: `turtleneck${i + 1}`,
    label: `Turtle ${i + 1}`,
  })),
];

const HIJABS: Array<{ key: string | null; label: string }> = [
  { key: null, label: "None" },
  ...Array.from({ length: 9 }, (_, i) => ({
    key: `hijab${i + 1}`,
    label: `Hijab ${i + 1}`,
  })),
];

const HAIR_STYLES = [
  { key: null, label: "Bald" },
  { key: "hairb1", label: "Short A" },
  { key: "hairb2", label: "Short B" },
  { key: "hairb3", label: "Short C" },
  { key: "hairb4", label: "Short D" },
  { key: "hairg1", label: "Long A" },
  { key: "hairg2", label: "Long B" },
  { key: "hairg3", label: "Long C" },
  { key: "hairg4", label: "Long D" },
  { key: "hairg5", label: "Long E" },
];

const HAIR_COLORS: { suffix: string; label: string; swatch: string }[] = [
  { suffix: "", label: "Dark", swatch: "#2c1a0e" },
  { suffix: ".2", label: "Brown", swatch: "#6b3a1f" },
  { suffix: ".3", label: "Blonde", swatch: "#FFF49B" },
];

const MOUTHS: Array<string | null> = [
  null,
  ...Array.from({ length: 7 }, (_, i) => `mouth${i + 1}`),
  "mouth4.2",
];

type StepProblem = { field: string; message: string };

function validateStep(step: number, form: RegisterForm): StepProblem | null {
  const blank = (v: string) => !v.trim();

  if (step === 0) {
    if (blank(form.email))
      return { field: "email", message: "Please enter your email." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return { field: "email", message: "That email address looks invalid." };
    if (blank(form.password))
      return { field: "password", message: "Please choose a password." };
    if (form.password.length < 6)
      return {
        field: "password",
        message: "Password must be at least 6 characters.",
      };
    if (blank(form.confirmPassword))
      return {
        field: "confirmPassword",
        message: "Please confirm your password.",
      };
    if (form.password !== form.confirmPassword)
      return { field: "confirmPassword", message: "Passwords do not match!" };
  }

  if (step === 1) {
    if (blank(form.name))
      return { field: "fullName", message: "Please enter your name." };
    if (blank(form.major))
      return { field: "major", message: "Please enter your major." };
  }

  if (step === 2) {
    if (blank(form.hobby))
      return { field: "hobby", message: "Please tell us a hobby." };
    if (blank(form.achievements))
      return {
        field: "achievements",
        message:
          'Please answer the achievement question — type "none" to skip.',
      };
  }

  if (step === 4) {
    if (blank(form.medicalNote))
      return {
        field: "medicalNote",
        message:
          'Please answer the health question — type "none" if it does not apply.',
      };
  }

  return null;
}

function CarouselWrapper({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative mt-2 flex items-center">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute -left-2 z-10 flex h-8 w-6 items-center justify-center rounded border-2 border-[#e0b391] bg-white shadow-sm transition-transform active:scale-95"
      >
        <img
          src="/images/committee/page-prev.png"
          alt="Previous"
          className="w-4 h-4 object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto py-1 scrollbar-thin w-full px-5"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute -right-2 z-10 flex h-8 w-6 items-center justify-center rounded border-2 border-[#e0b391] bg-white shadow-sm transition-transform active:scale-95"
      >
        <img
          src="/images/committee/page-next.png"
          alt="Next"
          className="w-4 h-4 object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    instagram: "",
    major: "",
    hobby: "",
    achievements: "",
    medicalNote: "",
    gender: "",
  });
  const [avatarSkin, setAvatarSkin] = useState("skin1");
  const [avatarClothes, setAvatarClothes] = useState<string | null>("shirt1");
  const [avatarHairStyle, setAvatarHairStyle] = useState<string | null>(
    "hairb1",
  );
  const [avatarHairColor, setAvatarHairColor] = useState("");
  const [avatarHijab, setAvatarHijab] = useState<string | null>(null);
  const [avatarEyes, setAvatarEyes] = useState("eyes1");
  const [avatarBrows, setAvatarBrows] = useState("brow1");
  const [avatarMouth, setAvatarMouth] = useState<string | null>("mouth1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore draft from local storage.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("nso_register_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.step === "number") setStep(parsed.step);
        if (parsed.form) setForm((prev) => ({ ...prev, ...parsed.form }));
        if (parsed.avatarSkin) setAvatarSkin(parsed.avatarSkin);
        if (parsed.avatarClothes !== undefined)
          setAvatarClothes(parsed.avatarClothes);
        if (parsed.avatarHairStyle) setAvatarHairStyle(parsed.avatarHairStyle);
        if (parsed.avatarHairColor) setAvatarHairColor(parsed.avatarHairColor);
        if (parsed.avatarHijab !== undefined)
          setAvatarHijab(parsed.avatarHijab);
        if (parsed.avatarEyes) setAvatarEyes(parsed.avatarEyes);
        if (parsed.avatarBrows) setAvatarBrows(parsed.avatarBrows);
        if (parsed.avatarMouth !== undefined)
          setAvatarMouth(parsed.avatarMouth);
      }
    } catch {}
  }, []);

  // Save draft to local storage.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "nso_register_draft",
        JSON.stringify({
          step,
          form,
          avatarSkin,
          avatarClothes,
          avatarHairStyle,
          avatarHairColor,
          avatarHijab,
          avatarEyes,
          avatarBrows,
          avatarMouth,
        }),
      );
    } catch {}
  }, [
    step,
    form,
    avatarSkin,
    avatarClothes,
    avatarHairStyle,
    avatarHairColor,
    avatarHijab,
    avatarEyes,
    avatarBrows,
    avatarMouth,
  ]);

  const hairKey = avatarHairStyle
    ? `${avatarHairStyle}${avatarHairColor}`
    : null;

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const goBack = () => {
    setError("");
    if (step === 0) {
      router.push("/login");
    } else {
      setStep(step - 1);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const problem = validateStep(step, form);
    if (problem) {
      setError(problem.message);
      document.getElementById(problem.field)?.focus();
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          instagram: form.instagram,
          major: form.major,
          hobby: form.hobby,
          achievements: form.achievements,
          medicalNote: form.medicalNote,
          gender: form.gender || null,
          avatarSkin,
          avatarClothes,
          avatarHairStyle,
          avatarHairColor,
          avatarHijab,
          avatarEyes,
          avatarBrows,
          avatarMouth,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      try {
        sessionStorage.removeItem("nso_register_draft");
      } catch {}
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  };

  const [titleTop, titleBottom] = STEP_TITLES[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="relative min-h-dvh w-full overflow-y-auto bg-[#000b8c] pb-12">
      <img
        src="/images/login/bg.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[31%_50%] lg:object-center"
      />

      <button
        type="button"
        onClick={goBack}
        aria-label={step === 0 ? "Back to login" : "Previous step"}
        className="fixed left-4 top-4 sm:top-8 z-20 w-[54px] sm:w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
      >
        <img src="/images/login/back-button.png" alt="" className="w-full" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 pb-8 pt-14 sm:pt-20 lg:max-w-md">
        {/* Title */}
        <h1 className="text-center font-bytebounce leading-[0.9] text-[#fbc94c]">
          <span
            className="block text-[clamp(2.2rem,11vw,3.5rem)] lg:text-[4.25rem]"
            style={{ textShadow: "3px 2.5px 0 #4e342e" }}
          >
            {titleTop}
          </span>
          <span
            className="block text-[clamp(2.2rem,11vw,3.5rem)] lg:text-[4.25rem]"
            style={{ textShadow: "3px 2.5px 0 #4e342e" }}
          >
            {titleBottom}
          </span>
        </h1>

        <p
          className="mt-1 text-center font-bytebounce text-fluid-base text-[#e0b391]"
          style={labelShadow}
        >
          Step {step + 1} of {TOTAL_STEPS}
        </p>

        {/* noValidate: validateStep() owns validation so a missing field always
            produces a visible message (see the comment on validateStep). The
            `required` attributes below stay for accessibility semantics. */}
        <form
          noValidate
          onSubmit={handleNext}
          className="mt-5 flex w-full flex-1 flex-col"
        >
          {/* ── Step 0: Credentials ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className={labelClass}
                  style={labelShadow}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className={labelClass}
                  style={labelShadow}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={labelClass}
                  style={labelShadow}
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
              <div>
                <label
                  htmlFor="instagram"
                  className={labelClass}
                  style={labelShadow}
                >
                  Instagram profile link
                </label>
                <input
                  id="instagram"
                  type="text"
                  value={form.instagram}
                  onChange={update("instagram")}
                  autoComplete="off"
                  placeholder="@yourhandle (optional)"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
            </div>
          )}

          {/* ── Step 1: About you ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className={labelClass}
                  style={labelShadow}
                >
                  Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.name}
                  onChange={update("name")}
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
              <div>
                <label
                  htmlFor="major"
                  className={labelClass}
                  style={labelShadow}
                >
                  Major
                </label>
                <input
                  id="major"
                  type="text"
                  value={form.major}
                  onChange={update("major")}
                  required
                  placeholder="e.g. Computer Science"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
              {/* Gender — used for group analytics */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Gender selection
                </p>
                <div className="mt-2 flex gap-3">
                  {(["M", "F", "other"] as const).map((g) => {
                    const label =
                      g === "M" ? "Male" : g === "F" ? "Female" : "Other";
                    const selected = form.gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, gender: g }))}
                        className="flex-1 rounded-[13px] border-2 py-2 font-bytebounce text-fluid-base transition-colors"
                        style={{
                          borderColor: selected ? "#fbc94c" : "#e0b391",
                          background: selected ? "#fbc94c22" : "#fffcfb",
                          color: selected ? "#fbc94c" : "#c9b6a4",
                          textShadow: selected ? "1.5px 1px 0 #4e342e" : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Your story ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="hobby"
                  className={labelClass}
                  style={labelShadow}
                >
                  Your hobby
                </label>
                <input
                  id="hobby"
                  type="text"
                  value={form.hobby}
                  onChange={update("hobby")}
                  required
                  placeholder="e.g. football, drawing, gaming"
                  className={`${inputClass} h-[clamp(44px,13vw,56px)]`}
                />
              </div>
              <div>
                <label
                  htmlFor="achievements"
                  className={labelClass}
                  style={labelShadow}
                >
                  Past achievement or award you&apos;re proud of
                </label>
                <textarea
                  id="achievements"
                  value={form.achievements}
                  onChange={update("achievements")}
                  required
                  rows={4}
                  placeholder={`Awards, projects, competitions — type "none" to skip`}
                  className={`${inputClass} py-3`}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Avatar customization ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Live preview */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <PixelAvatar
                    skin={avatarSkin}
                    clothes={avatarClothes ?? undefined}
                    hair={hairKey}
                    hijab={avatarHijab ?? undefined}
                    eyes={avatarEyes}
                    brow={avatarBrows}
                    mouth={avatarMouth ?? undefined}
                    size={112}
                  />
                  <p
                    className="font-bytebounce text-fluid-xs text-[#fbc94c]"
                    style={labelShadow}
                  >
                    Your avatar
                  </p>
                </div>
              </div>

              {/* Skin tone picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Skin tone
                </p>
                <CarouselWrapper>
                  {SKINS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAvatarSkin(s)}
                      className="relative border-2 rounded transition-transform active:scale-95 flex-shrink-0"
                      style={{
                        borderColor: avatarSkin === s ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarSkin === s ? "0 0 0 2px #fbc94c" : "none",
                      }}
                    >
                      <img
                        src={`/images/avatar/${s}.png`}
                        alt={s}
                        className="w-12 h-12 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </button>
                  ))}
                </CarouselWrapper>
              </div>

              {/* Clothes picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Clothing
                </p>
                <CarouselWrapper>
                  {CLOTHES.map((c) => (
                    <button
                      key={c.key ?? "none"}
                      type="button"
                      onClick={() => setAvatarClothes(c.key)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5 flex-shrink-0"
                      style={{
                        borderColor:
                          avatarClothes === c.key ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarClothes === c.key
                            ? "0 0 0 2px #fbc94c"
                            : "none",
                      }}
                    >
                      {c.key ? (
                        <PixelAvatar
                          skin={avatarSkin}
                          clothes={c.key}
                          size={44}
                        />
                      ) : (
                        <div className="w-11 h-11 flex items-center justify-center font-bytebounce text-fluid-2xs text-[#4e342e]">
                          None
                        </div>
                      )}
                    </button>
                  ))}
                </CarouselWrapper>
              </div>

              {/* Eyes picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Eyes Style
                </p>
                <CarouselWrapper>
                  {EYES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setAvatarEyes(e)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5"
                      style={{
                        borderColor: avatarEyes === e ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarEyes === e ? "0 0 0 2px #fbc94c" : "none",
                      }}
                    >
                      <PixelAvatar skin={avatarSkin} eyes={e} size={44} />
                    </button>
                  ))}
                </CarouselWrapper>
              </div>

              {/* Brows picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Eyebrows Style
                </p>
                <CarouselWrapper>
                  {BROWS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setAvatarBrows(b)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5"
                      style={{
                        borderColor: avatarBrows === b ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarBrows === b ? "0 0 0 2px #fbc94c" : "none",
                      }}
                    >
                      <PixelAvatar
                        skin={avatarSkin}
                        eyes={avatarEyes}
                        brow={b}
                        size={44}
                      />
                    </button>
                  ))}
                </CarouselWrapper>
              </div>

              {/* Hair style picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Hair style
                </p>
                <CarouselWrapper>
                  {HAIR_STYLES.map((h) => (
                    <button
                      key={h.key ?? "bald"}
                      type="button"
                      onClick={() => setAvatarHairStyle(h.key)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 flex-shrink-0"
                      style={{
                        borderColor:
                          avatarHairStyle === h.key ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarHairStyle === h.key
                            ? "0 0 0 2px #fbc94c"
                            : "none",
                      }}
                    >
                      {h.key ? (
                        <img
                          src={`/images/avatar/${h.key}.png`}
                          alt={h.label}
                          className="w-12 h-12 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center font-bytebounce text-fluid-2xs text-[#4e342e]">
                          Bald
                        </div>
                      )}
                    </button>
                  ))}
                </CarouselWrapper>
              </div>

              {/* Hair color picker (only when a style is selected) */}
              {avatarHairStyle && (
                <div>
                  <p className={labelClass} style={labelShadow}>
                    Hair color
                  </p>
                  <div className="mt-2 flex gap-3">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.suffix}
                        type="button"
                        onClick={() => setAvatarHairColor(c.suffix)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-8 h-8 border-2 rounded-full transition-transform active:scale-95"
                          style={{
                            background: c.swatch,
                            borderColor:
                              avatarHairColor === c.suffix
                                ? "#fbc94c"
                                : "#e0b391",
                            boxShadow:
                              avatarHairColor === c.suffix
                                ? "0 0 0 2px #fbc94c"
                                : "none",
                          }}
                        />
                        <span className="font-bytebounce text-fluid-2xs text-[#e0b391]">
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mouth picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Mouth
                </p>
                <CarouselWrapper>
                  {MOUTHS.map((m) => (
                    <button
                      key={m ?? "none"}
                      type="button"
                      onClick={() => setAvatarMouth(m)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5 flex-shrink-0"
                      style={{
                        borderColor: avatarMouth === m ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarMouth === m ? "0 0 0 2px #fbc94c" : "none",
                      }}
                    >
                      {m ? (
                        <PixelAvatar skin={avatarSkin} mouth={m} size={44} />
                      ) : (
                        <div className="w-11 h-11 flex items-center justify-center font-bytebounce text-fluid-2xs text-[#4e342e]">
                          None
                        </div>
                      )}
                    </button>
                  ))}
                </CarouselWrapper>
              </div>

              {/* Hijab picker */}
              <div>
                <p className={labelClass} style={labelShadow}>
                  Hijab / Headwear
                </p>
                <CarouselWrapper>
                  {HIJABS.map((h) => (
                    <button
                      key={h.key ?? "none"}
                      type="button"
                      onClick={() => setAvatarHijab(h.key)}
                      className="relative border-2 rounded transition-transform active:scale-95 bg-white/80 p-0.5 flex-shrink-0"
                      style={{
                        borderColor:
                          avatarHijab === h.key ? "#fbc94c" : "#e0b391",
                        boxShadow:
                          avatarHijab === h.key ? "0 0 0 2px #fbc94c" : "none",
                      }}
                    >
                      {h.key ? (
                        <PixelAvatar
                          skin={avatarSkin}
                          hijab={h.key}
                          size={44}
                        />
                      ) : (
                        <div className="w-11 h-11 flex items-center justify-center font-bytebounce text-fluid-2xs text-[#4e342e]">
                          None
                        </div>
                      )}
                    </button>
                  ))}
                </CarouselWrapper>
              </div>
            </div>
          )}

          {/* ── Step 4: Health / allergies ── */}
          {step === 4 && (
            <div>
              <label
                htmlFor="medicalNote"
                className={labelClass}
                style={labelShadow}
              >
                Allergies or health conditions we should know?
              </label>
              <p
                className="mt-2 font-bytebounce text-fluid-sm leading-tight text-[#24e9d5]"
                style={{ textShadow: "1.2px 1px 0 #4e342e" }}
              >
                Kept private! It helps the committee keep you safe during
                orientation.
              </p>
              <textarea
                id="medicalNote"
                value={form.medicalNote}
                onChange={update("medicalNote")}
                required
                rows={5}
                placeholder={`Type "none" if this doesn't apply to you`}
                className={`${inputClass} mt-3 py-3`}
              />
            </div>
          )}

          {error && (
            <p
              className="mt-4 text-center font-bytebounce text-fluid-base text-[#d6101d]"
              style={{ textShadow: "1.2px 0.7px 0 #e0b391" }}
            >
              {error}
            </p>
          )}

          <div className="mt-8 pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="wood-plank block h-[clamp(44px,13vw,56px)] w-full font-bytebounce text-fluid-2xl text-[#e0b391] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ textShadow: "2.7px 1.8px 0 #4e342e" }}
            >
              {loading ? (
                <span className="blink">Creating...</span>
              ) : isLastStep ? (
                "Register"
              ) : (
                "Next"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
