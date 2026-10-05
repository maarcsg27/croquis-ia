"use client";
import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type OrientationType = "portrait" | "landscape";

export interface DeviceInfo {
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: OrientationType;
  isTouch: boolean;
  width: number;
  height: number;
  isHydrated: boolean;
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    device: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: "landscape",
    isTouch: false,
    width: 1200,
    height: 800,
    isHydrated: false,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation: OrientationType = width > height ? "landscape" : "portrait";
      
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error msMaxTouchPoints is non-standard
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

      // User agent detection for tablets/phones
      const ua = navigator.userAgent.toLowerCase();
      const isTabletUA = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);
      const isMobileUA = /(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo)/.test(ua);

      let device: DeviceType = "desktop";
      if (width < 768 || (isMobileUA && width < 900 && orientation === "portrait")) {
        device = "mobile";
      } else if (width < 1024 || isTabletUA) {
        device = "tablet";
      } else {
        device = "desktop";
      }

      setDeviceInfo({
        device,
        isMobile: device === "mobile",
        isTablet: device === "tablet",
        isDesktop: device === "desktop",
        orientation,
        isTouch: !!isTouch,
        width,
        height,
        isHydrated: true,
      });
    };

    updateDeviceInfo();

    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    const mql = window.matchMedia("(max-width: 768px)");
    if (mql.addEventListener) {
      mql.addEventListener("change", updateDeviceInfo);
    }

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
      if (mql.removeEventListener) {
        mql.removeEventListener("change", updateDeviceInfo);
      }
    };
  }, []);

  return deviceInfo;
}
