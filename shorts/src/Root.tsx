import React from "react";
import { Composition } from "remotion";
import { ElevenShort, ELEVEN_FRAMES } from "./videos/eleven/Eleven";
import { OneMoreWeek, ONE_FRAMES } from "./videos/dave/One";

export const Root: React.FC = () => (
  <>
    <Composition id="OneMoreWeek" component={OneMoreWeek} durationInFrames={ONE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ElevenShort" component={ElevenShort} durationInFrames={ELEVEN_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
