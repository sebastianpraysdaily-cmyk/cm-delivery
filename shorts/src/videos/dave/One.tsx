// "One More Week": original ~57 s office comedy short in the flat-characters-in-a-3D-toon-world style.
// Post chain: ink -> lens blur (pre + main) -> camera motion blur -> bloom -> NEUTRAL tone map -> grade, MSAA 4.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./office";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, gradeFor } from "./grade";
import { TOTAL, FLASH_AT, SHOTS, layersAt, dofAt, camAt } from "./story";
import { MotionBlur } from "./motionblur";

export const ONE_FRAMES = TOTAL;
type PostToggles = { ink: boolean; lens: boolean; mblur: boolean; bloom: boolean; grade: boolean; audio: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, mblur: true, bloom: true, grade: true, audio: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const prevCam = new THREE.PerspectiveCamera(), pv = new THREE.Vector3(), vel = new THREE.Vector2();
/** screen-space motion (px at 1080x1920, 180-degree shutter) of the scene point under the frame centre, between f-1 and f */
const motionOf = (id: number, f: number, cam: THREE.PerspectiveCamera) => {
  const c0 = camAt(id, f - 1, false), c1 = camAt(id, f, false);
  prevCam.position.set(...c0.pos); prevCam.up.set(0, 1, 0); prevCam.lookAt(...c0.look); prevCam.rotateZ(c0.roll);
  prevCam.fov = c0.fov; prevCam.aspect = cam.aspect; prevCam.near = 0.05; prevCam.far = 200; prevCam.updateProjectionMatrix(); prevCam.updateMatrixWorld();
  pv.set(...c1.look).project(prevCam);
  vel.set(pv.x * 540 * 0.5, pv.y * 960 * 0.5);
  if (vel.length() > 240) vel.setLength(240);
  return vel;
};

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    mblur: new MotionBlur(),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.office, 1),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => {
    const kids: React.ReactElement[] = [];
    if (on.ink) kids.push(<primitive key="ink" object={fx.ink} dispose={null} />);
    if (on.lens) { kids.push(<primitive key="pre" object={fx.lens.pre} dispose={null} />); kids.push(<primitive key="main" object={fx.lens.main} dispose={null} />); }
    if (on.mblur) kids.push(<primitive key="mblur" object={fx.mblur} dispose={null} />);
    if (on.bloom) kids.push(<primitive key="bloom" object={fx.bloom} dispose={null} />);
    kids.push(<primitive key="tone" object={fx.tone} dispose={null} />);
    if (on.grade) kids.push(<primitive key="grade" object={fx.grade} dispose={null} />);
    return <EffectComposer multisampling={4}>{kids}</EffectComposer>;
  }, [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  fx.mblur.vel = motionOf(id, f, cam);
  gradeFor(fx.grade, SHOTS[id - 1].light);
  return (<><primitive object={world.root} dispose={null} />{post}</>);
};

const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.05, far: 200 }}>
      <Inner id={id} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const OneMoreWeek: React.FC = () => {
  const f = useCurrentFrame();
  const on = toggles();
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  const black = f >= TOTAL - 10 ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
      {on.audio && <Audio src={staticFile("dave/mix.wav")} />}
    </AbsoluteFill>
  );
};
