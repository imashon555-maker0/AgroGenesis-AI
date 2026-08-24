import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type DeviceType = "phone" | "tablet" | "desktop";

interface DeviceInfo {
  device: DeviceType;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const BREAKPOINTS = {
  phone: 640,    // <640px = phone
  tablet: 1024,  // 640–1023px = tablet
  // ≥1024px = desktop
} as const;

function getDevice(width: number): DeviceType {
  if (width < BREAKPOINTS.phone) return "phone";
  if (width < BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}

function getInfo(width: number): DeviceInfo {
  const device = getDevice(width);
  return {
    device,
    isPhone: device === "phone",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
    width,
  };
}

const DeviceContext = createContext<DeviceInfo>({
  device: "desktop",
  isPhone: false,
  isTablet: false,
  isDesktop: true,
  width: 1200,
});

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<DeviceInfo>(() =>
    typeof window !== "undefined" ? getInfo(window.innerWidth) : { device: "desktop", isPhone: false, isTablet: false, isDesktop: true, width: 1200 }
  );

  useEffect(() => {
    const queries = [
      { mq: window.matchMedia("(max-width: 639px)"), device: "phone" as DeviceType },
      { mq: window.matchMedia("(min-width: 640px) and (max-width: 1023px)"), device: "tablet" as DeviceType },
      { mq: window.matchMedia("(min-width: 1024px)"), device: "desktop" as DeviceType },
    ];

    const sync = () => setInfo(getInfo(window.innerWidth));
    queries.forEach(({ mq }) => mq.addEventListener("change", sync));
    // Also listen to resize for width value
    window.addEventListener("resize", sync);

    return () => {
      queries.forEach(({ mq }) => mq.removeEventListener("change", sync));
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <DeviceContext.Provider value={info}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceType(): DeviceInfo {
  return useContext(DeviceContext);
}
