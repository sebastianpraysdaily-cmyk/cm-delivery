import React from "react";
import { Composition } from "remotion";
import { ElevenShort, ELEVEN_FRAMES } from "./videos/eleven/Eleven";

export const Root: React.FC = () => (
  <>
    <Composition id="ElevenShort" component={ElevenShort} durationInFrames={ELEVEN_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
