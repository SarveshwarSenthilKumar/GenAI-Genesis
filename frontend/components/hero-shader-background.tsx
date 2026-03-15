"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type HeroShaderBackgroundProps = {
  className?: string;
};

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uMotion;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(14.2, 7.1);
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 centered = uv - 0.5;
    centered.x *= uResolution.x / max(uResolution.y, 1.0);

    vec2 pointer = uPointer - 0.5;
    pointer.x *= uResolution.x / max(uResolution.y, 1.0);

    float time = uTime * 0.045 * uMotion;
    float distanceToPointer = length(centered - pointer);
    float pointerField = exp(-distanceToPointer * 4.8);

    vec2 warp = vec2(
      fbm(centered * 1.5 + vec2(time * 1.3, -time * 0.8)),
      fbm(centered * 1.5 + vec2(-time * 0.9, time * 1.2))
    );
    warp += pointerField * vec2(
      (pointer.x - centered.x) * 0.9,
      (pointer.y - centered.y) * 0.9
    ) * uMotion;

    vec2 flowUv = centered * 1.28 + warp * 0.42;
    float lowField = fbm(flowUv * 1.05 + vec2(0.0, time));
    float signalField = fbm(flowUv * 2.1 - vec2(time * 1.8, -time * 0.5));
    float ridgeField = smoothstep(0.42, 0.84, fbm(flowUv * 2.8 + vec2(time * 0.8, time * 0.25)));

    float cornerGlowA = smoothstep(1.5, 0.15, distance(centered, vec2(0.72, 0.58)));
    float cornerGlowB = smoothstep(1.3, 0.05, distance(centered, vec2(-0.98, -0.78)));
    float topGlow = smoothstep(1.1, 0.0, distance(centered, vec2(0.18, 0.92)));

    vec3 base = vec3(0.012, 0.041, 0.094);
    vec3 mid = vec3(0.039, 0.137, 0.278);
    vec3 highlight = vec3(0.42, 0.66, 0.95);
    vec3 haze = vec3(0.13, 0.26, 0.46);

    vec3 color = base;
    color += mid * (lowField * 0.85 + signalField * 0.3);
    color += haze * ridgeField * 0.34;
    color += highlight * cornerGlowA * 0.92;
    color += vec3(0.19, 0.31, 0.48) * cornerGlowB * 0.22;
    color += vec3(0.11, 0.2, 0.34) * topGlow * 0.18;
    color += highlight * pointerField * 0.18 * uMotion;

    float vignette = smoothstep(1.55, 0.16, length(centered * vec2(0.92, 1.14)));
    color *= mix(0.42, 1.0, vignette);

    float grain = (hash(gl_FragCoord.xy * 0.5 + uTime) - 0.5) * 0.035;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function HeroShaderBackground({
  className = "",
}: HeroShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x020814, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.72, 0.34) },
      uTime: { value: 0 },
      uMotion: { value: 1 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let reducedMotion = mediaQuery.matches;
    let mobileMode = mobileQuery.matches;
    let rafId = 0;

    const pointer = {
      current: new THREE.Vector2(0.72, 0.34),
      target: new THREE.Vector2(0.72, 0.34),
    };

    const applyRendererSize = () => {
      const { clientWidth, clientHeight } = container;

      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, mobileMode ? 1.15 : 1.5),
      );
      uniforms.uResolution.value.set(clientWidth, clientHeight);
      uniforms.uMotion.value = reducedMotion ? 0.0 : mobileMode ? 0.58 : 1.0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (!width || !height) {
        return;
      }

      pointer.target.set(
        THREE.MathUtils.clamp(event.clientX / width, 0, 1),
        THREE.MathUtils.clamp(1 - event.clientY / height, 0, 1),
      );
    };

    const handlePointerLeave = () => {
      pointer.target.set(0.72, 0.34);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      uniforms.uMotion.value = reducedMotion ? 0.0 : mobileMode ? 0.58 : 1.0;
    };

    const handleMobileChange = (event: MediaQueryListEvent) => {
      mobileMode = event.matches;
      applyRendererSize();
    };

    const animate = () => {
      pointer.current.lerp(pointer.target, reducedMotion ? 0.06 : 0.035);
      uniforms.uPointer.value.copy(pointer.current);

      if (!reducedMotion) {
        uniforms.uTime.value += mobileMode ? 0.0035 : 0.0045;
      }

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    applyRendererSize();
    animate();

    window.addEventListener("resize", applyRendererSize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    mediaQuery.addEventListener("change", handleMotionChange);
    mobileQuery.addEventListener("change", handleMobileChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", applyRendererSize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      mediaQuery.removeEventListener("change", handleMotionChange);
      mobileQuery.removeEventListener("change", handleMobileChange);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
