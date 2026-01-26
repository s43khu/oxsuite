"use client";

import { useTheme } from "./ThemeProvider";
import PixelBlast from "./PixelBlast";
import FaultyTerminal from "./FaultyTerminal";

export default function ThemeBackground() {
  const { themeId, theme } = useTheme();
  const isDreamTheme = themeId === "purple";
  const isTerminalTheme = themeId === "dark";

  return (
    <div className="w-full h-full">
      {isDreamTheme && (
        <PixelBlast
          variant="circle"
          pixelSize={3}
          color="#b19eef"
          backgroundColor={theme.colors.background}
          patternScale={7.5}
          patternDensity={0.8}
          enableRipples={true}
          pixelSizeJitter={1.75}
          rippleIntensityScale={0.8}
          rippleSpeed={0.4}
          transparent={false}
          edgeFade={0.3}
          speed={3}
        />
      )}
      {isTerminalTheme && (
        <FaultyTerminal
          scale={4}
          gridMul={[2, 1]}
          digitSize={4}
          timeScale={0.2}
          scanlineIntensity={0.3}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          curvature={0}
          tint="#8FBC8F"
          mouseReact={false}
          mouseStrength={0.2}
          pageLoadAnimation={true}
          brightness={1}
        />
      )}
    </div>
  );
}
