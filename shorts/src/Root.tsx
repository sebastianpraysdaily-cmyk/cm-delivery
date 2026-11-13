import React from "react";
import { Composition } from "remotion";
import { ElevenShort, ELEVEN_FRAMES } from "./videos/eleven/Eleven";
import { OneMoreWeek, ONE_FRAMES } from "./videos/dave/One";
import { FridayInventory, LINDA_FRAMES } from "./videos/linda/Linda";

export const Root: React.FC = () => (
  <>
    <Composition id="FridayInventory" component={FridayInventory} durationInFrames={LINDA_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="OneMoreWeek" component={OneMoreWeek} durationInFrames={ONE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ElevenShort" component={ElevenShort} durationInFrames={ELEVEN_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
