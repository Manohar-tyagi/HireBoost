import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

interface ThreeCanvasProps {
  activeSlide: number;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ activeSlide }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile || !containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.0, 0.8, 0.1
    );
    composer.addPass(bloom);

    const ambient = new THREE.AmbientLight(0x4f8ef7, 0.5);
    scene.add(ambient);
    const light1 = new THREE.PointLight(0x4f8ef7, 4, 20);
    light1.position.set(5, 5, 5);
    scene.add(light1);
    const light2 = new THREE.PointLight(0xa78bfa, 2, 20);
    light2.position.set(-5, -3, 3);
    scene.add(light2);
    const light3 = new THREE.PointLight(0xffffff, 1, 15);
    light3.position.set(0, -5, -5);
    scene.add(light3);

    const group = new THREE.Group();
    scene.add(group);

    // Core icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(2.5, 2);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0x4f8ef7,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 0.6,
      emissive: 0x0a0f1e,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.95,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    group.add(icoMesh);

    // Wireframe
    const wireGeo = new THREE.IcosahedronGeometry(2.55, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x4f8ef7,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    group.add(wireMesh);

    // Outer glow
    const glGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const glMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const glMesh = new THREE.Mesh(glGeo, glMat);
    group.add(glMesh);

    // Particles
    const n = 3000;
    const pg = new THREE.BufferGeometry();
    const pp = new Float32Array(n * 3);
    const pv = new Float32Array(n);
    const po = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 2;
      pp[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pp[i * 3 + 1] = r * Math.cos(phi);
      pp[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      pv[i] = 0.003 + Math.random() * 0.01;
      po[i] = Math.random() * Math.PI * 2;
    }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pm = new THREE.PointsMaterial({
      color: 0x4f8ef7,
      size: 0.15,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ps = new THREE.Points(pg, pm);
    scene.add(ps);

    let targetMX = 0, targetMY = 0;
    let curMX = 0, curMY = 0;
    const onMove = (e: MouseEvent) => {
      targetMX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frame = 0;

    const anim = () => {
      frame = requestAnimationFrame(anim);
      const t = clock.getElapsedTime();

      curMX += (targetMX - curMX) * 0.05;
      curMY += (targetMY - curMY) * 0.05;

      const targetPos = new THREE.Vector3(0, 0, 0);
      let targetScale = 1;
      let targetBloom = 1.0;
      const targetColor = new THREE.Color(0x4f8ef7);
      let targetPOpacity = 0;
      let targetOpacity = 0.95;
      let targetWireOpacity = 0.15;
      let targetGlowOpacity = 0.08;
      let targetRotSpeed = 0.003;

      switch (activeSlide) {
        case 0:
          targetScale = 1;
          targetBloom = 1.2;
          const hue = 0.6 + Math.sin(t * 0.12) * 0.07;
          targetColor.setHSL(hue, 0.8, 0.5);
          targetPos.set(0, 0, 0);
          break;
        case 1:
          targetScale = 0.5;
          targetBloom = 0.8;
          targetColor.setHex(0x4f8ef7);
          targetPos.set(2.4, 0.8, 0);
          break;
        case 2:
          targetScale = 0.5;
          targetBloom = 0.8;
          targetColor.setHex(0xa78bfa);
          targetPos.set(-2.4, 0, 0);
          break;
        case 3:
          targetScale = 0.45;
          targetBloom = 0.9;
          targetColor.setHex(0x10b981);
          targetPos.set(2.6, 0, 0);
          break;
        case 4:
          targetScale = 0.01;
          targetBloom = 2.5;
          targetColor.setHex(0x4f8ef7);
          targetPOpacity = 0.8;
          targetOpacity = 0;
          targetWireOpacity = 0;
          targetGlowOpacity = 0;
          break;
      }

      // Smooth everything
      const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
      const scale = group.scale.x;
      const ns = lerp(scale, targetScale, 0.04);
      group.scale.set(ns, ns, ns);

      group.position.x = lerp(group.position.x, targetPos.x, 0.04);
      group.position.y = lerp(group.position.y, targetPos.y, 0.04);
      group.position.z = lerp(group.position.z, targetPos.z, 0.04);

      icoMat.opacity = lerp(icoMat.opacity, targetOpacity, 0.04);
      wireMat.opacity = lerp(wireMat.opacity, targetWireOpacity, 0.04);
      glMat.opacity = lerp(glMat.opacity, targetGlowOpacity, 0.04);
      pm.opacity = lerp(pm.opacity, targetPOpacity, 0.04);

      icoMat.color.lerp(targetColor, 0.04);
      wireMat.color.lerp(targetColor, 0.04);
      bloom.strength = lerp(bloom.strength, targetBloom, 0.04);

      if (activeSlide === 0) {
        group.rotation.y = t * 0.003;
        group.rotation.x = curMY * 0.12;
      } else {
        group.rotation.y += 0.008;
        group.rotation.x += curMY * 0.002;
      }

      // Particles drift
      if (activeSlide === 4) {
        const pa = pg.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < n; i++) {
          let x = pa.getX(i);
          let y = pa.getY(i);
          let z = pa.getZ(i);
          y += pv[i];
          x += Math.sin(t * 0.5 + po[i]) * 0.004;
          z += Math.cos(t * 0.3 + po[i]) * 0.004;
          if (y > 8) y = -8;
          pa.setXYZ(i, x, y, z);
        }
        pa.needsUpdate = true;
      }

      composer.render();
    };
    anim();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      scene.remove(group, ps);
      icoGeo.dispose(); icoMat.dispose();
      wireGeo.dispose(); wireMat.dispose();
      glGeo.dispose(); glMat.dispose();
      pg.dispose(); pm.dispose();
      renderer.dispose();
      try { container.removeChild(renderer.domElement); } catch {}
    };
  }, [isMobile]);

  if (isMobile) return null;
  return <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[#0A0F1E]" />;
};
