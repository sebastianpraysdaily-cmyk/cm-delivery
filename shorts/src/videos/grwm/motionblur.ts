// Camera motion blur for the reference's whip pans and fast ease-out bursts. One screen-space velocity per frame
// (the motion of the scene point under the frame centre between frames, at the focus depth: World/One.tsx computes it
// from the camera keys), 180-degree shutter, 40 taps along the vector with a tent weight. Pure camera rotation is
// exact; tracking shots are exact at the focus plane. Off below 0.6 px. Pixel sizes are in 1080x1920 px and scaled
// by output height / 1920 like every other pass.
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Vector2 } from "three";

const frag = /* glsl */ `
uniform vec2 vel;   // blur vector, px at 1080x1920 (full shutter length)
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float s = resolution.y / 1920.0;
  vec2 v = vel * s * texelSize;
  if (length(vel) < 0.6) { outputColor = inputColor; return; }
  vec3 acc = vec3(0.0); float ws = 0.0;
  for (int i = 0; i < 40; i++) {
    float t = (float(i) + 0.5) / 40.0 - 0.5;
    float w = 1.0 - abs(t) * 1.2;
    acc += texture2D(inputBuffer, uv + v * t).rgb * w; ws += w;
  }
  outputColor = vec4(acc / ws, inputColor.a);
}`;

export class MotionBlur extends Effect {
  constructor() {
    super("MotionBlur", frag, { blendFunction: BlendFunction.NORMAL, attributes: EffectAttribute.CONVOLUTION, uniforms: new Map<string, Uniform>([["vel", new Uniform(new Vector2())]]) });
  }
  set vel(v: Vector2) { (this.uniforms.get("vel")!.value as Vector2).copy(v); }
}
