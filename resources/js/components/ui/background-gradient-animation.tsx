"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type GradientTheme = {
  gradientBackgroundStart: string;
  gradientBackgroundEnd: string;
  firstColor: string;
  secondColor: string;
  thirdColor: string;
  fourthColor: string;
  fifthColor: string;
  pointerColor: string;
};

const DARK_THEME: GradientTheme = {
  gradientBackgroundStart: "rgb(2, 6, 16)",
  gradientBackgroundEnd: "rgb(0, 0, 0)",
  firstColor: "30, 64, 175",
  secondColor: "37, 99, 235",
  thirdColor: "14, 116, 144",
  fourthColor: "29, 78, 216",
  fifthColor: "8, 47, 73",
  pointerColor: "59, 130, 246",
};

const LIGHT_THEME: GradientTheme = {
  gradientBackgroundStart: "rgb(248, 250, 252)", // slate-50
  gradientBackgroundEnd: "rgb(226, 232, 240)",   // slate-200
  firstColor: "191, 219, 254",   // blue-200
  secondColor: "165, 180, 252",  // indigo-300
  thirdColor: "153, 246, 228",   // teal-200
  fourthColor: "196, 181, 253",  // violet-300
  fifthColor: "224, 231, 255",   // indigo-100
  pointerColor: "129, 140, 248", // indigo-400
};

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart,
  gradientBackgroundEnd,
  firstColor,
  secondColor,
  thirdColor,
  fourthColor,
  fifthColor,
  pointerColor,
  size = "50%",
  blendingValue = "hard-light",
  children,
  className,
  containerClassName,
  interactive = true,
  containerRef: externalContainerRef,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  interactive?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}) => {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;
  const interactiveRef = useRef<HTMLDivElement>(null);

  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);
  const [isSafari, setIsSafari] = useState(false);

  // Track light/dark by watching the <html> element's class list —
  // matches the same toggle mechanism used on the welcome page.
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  // Explicit props always win; otherwise fall back to the active theme.
  const resolved: GradientTheme = {
    gradientBackgroundStart: gradientBackgroundStart ?? theme.gradientBackgroundStart,
    gradientBackgroundEnd: gradientBackgroundEnd ?? theme.gradientBackgroundEnd,
    firstColor: firstColor ?? theme.firstColor,
    secondColor: secondColor ?? theme.secondColor,
    thirdColor: thirdColor ?? theme.thirdColor,
    fourthColor: fourthColor ?? theme.fourthColor,
    fifthColor: fifthColor ?? theme.fifthColor,
    pointerColor: pointerColor ?? theme.pointerColor,
  };

  useEffect(() => {
    document.body.style.setProperty(
      "--gradient-background-start",
      resolved.gradientBackgroundStart,
    );
    document.body.style.setProperty(
      "--gradient-background-end",
      resolved.gradientBackgroundEnd,
    );
    document.body.style.setProperty("--first-color", resolved.firstColor);
    document.body.style.setProperty("--second-color", resolved.secondColor);
    document.body.style.setProperty("--third-color", resolved.thirdColor);
    document.body.style.setProperty("--fourth-color", resolved.fourthColor);
    document.body.style.setProperty("--fifth-color", resolved.fifthColor);
    document.body.style.setProperty("--pointer-color", resolved.pointerColor);
    document.body.style.setProperty("--size", size);
    document.body.style.setProperty("--blending-value", blendingValue);
  }, [
    resolved.gradientBackgroundStart,
    resolved.gradientBackgroundEnd,
    resolved.firstColor,
    resolved.secondColor,
    resolved.thirdColor,
    resolved.fourthColor,
    resolved.fifthColor,
    resolved.pointerColor,
    size,
    blendingValue,
  ]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTgX(event.clientX - rect.left);
    setTgY(event.clientY - rect.top);
  };

  useEffect(() => {
    function move() {
      if (!interactiveRef.current) return;
      setCurX((prev) => prev + (tgX - prev) / 20);
      setCurY((prev) => prev + (tgY - prev) / 20);
      interactiveRef.current.style.transform = `translate(${Math.round(
        curX,
      )}px, ${Math.round(curY)}px)`;
    }
    const id = requestAnimationFrame(move);
    return () => cancelAnimationFrame(id);
  }, [tgX, tgY, curX, curY]);

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen w-full overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))] transition-colors duration-500",
        containerClassName,
      )}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className={cn("", className)}>{children}</div>
      <div
        className={cn(
          "gradients-container h-full w-full blur-lg",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]",
        )}
      >
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)]`,
            `top-[5%] left-[10%]`,
            `animate-first`,
            `opacity-100`,
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)]`,
            `top-[10%] right-[5%]`,
            `animate-second`,
            `opacity-100`,
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)]`,
            `bottom-[10%] left-[5%]`,
            `animate-third`,
            `opacity-100`,
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)]`,
            `bottom-[5%] right-[15%]`,
            `animate-fourth`,
            `opacity-70`,
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)]`,
            `top-[40%] left-[40%]`,
            `animate-fifth`,
            `opacity-100`,
          )}
        ></div>

        {interactive && (
          <div
            ref={interactiveRef}
            onMouseMove={handleMouseMove}
            className={cn(
              `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
              `[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2`,
              `opacity-70`,
            )}
          ></div>
        )}
      </div>
    </div>
  );
};