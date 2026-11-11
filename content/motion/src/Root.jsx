import React from "react";
import { Composition, staticFile } from "remotion";
import { Ad } from "./Ad";
import timing from "../public/timing.json";
const FPS = 30;
const last = timing.beats[timing.beats.length - 1];
export const Root = () => (
  <Composition id="Ad" component={Ad} durationInFrames={Math.ceil((last.start + last.dur + 1.1) * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{}} />
);
