import React from "react";
import LenisScroll from "@/components/lenis-scroll";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LenisScroll />
      {children}
    </>
  );
}
