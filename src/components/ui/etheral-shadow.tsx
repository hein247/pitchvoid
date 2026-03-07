'use client';

import React, { useRef, useId, useEffect, CSSProperties, ReactNode } from 'react';
import { animate, useMotionValue, AnimationPlaybackControls } from 'framer-motion';

interface AnimationConfig {
  scale: number;
  speed: number;
}

interface NoiseConfig {
  opacity: number;
  scale: number;
}

interface EtheralShadowProps {
  color?: string;
  animation?: AnimationConfig;
  noise?: NoiseConfig;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  if (fromLow === fromHigh) return toLow;
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = (): string => {
  const id = useId();
  const cleanId = id.replace(/:/g, '');
  return `shadowoverlay-${cleanId}`;
};

export function EtheralShadow({
  color = 'rgba(124, 77, 255, 0.6)',
  animation,
  noise,
  style,
  className,
  children,
}: EtheralShadowProps) {
  const id = useInstanceId();
  const animationEnabled = animation && animation.scale > 0;
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotateMotionValue = useMotionValue(180);
  const hueRotateAnimation = useRef<AnimationPlaybackControls | null>(null);

  const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
  const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;
  const baseFrequency = animation ? mapRange(animation.scale, 1, 100, 0.01, 0.005) : 0.01;

  useEffect(() => {
    if (feColorMatrixRef.current && animationEnabled) {
      if (hueRotateAnimation.current) {
        hueRotateAnimation.current.stop();
      }
      hueRotateMotionValue.set(0);
      hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
        duration: animationDuration / 25,
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0,
        ease: 'linear',
        delay: 0,
        onUpdate: (value: number) => {
          if (feColorMatrixRef.current) {
            feColorMatrixRef.current.setAttribute('values', String(value));
          }
        },
      });

      return () => {
        if (hueRotateAnimation.current) {
          hueRotateAnimation.current.stop();
        }
      };
    }
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* SVG Filters */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              result="undulation"
              numOctaves={2}
              baseFrequency={`${baseFrequency} ${baseFrequency * 1.5}`}
              type="turbulence"
              seed={42}
            />
            {animationEnabled && (
              <feColorMatrix
                ref={feColorMatrixRef}
                in="undulation"
                type="hueRotate"
                values="180"
                result="animated-undulation"
              />
            )}
            <feDisplacementMap
              in="SourceGraphic"
              in2={animationEnabled ? 'animated-undulation' : 'undulation'}
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          {noise && noise.opacity > 0 && (
            <filter id={`${id}-noise`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency={noise.scale * 0.5}
                numOctaves={4}
                stitchTiles="stitch"
              />
              <feComponentTransfer>
                <feFuncA type="linear" slope={noise.opacity} />
              </feComponentTransfer>
            </filter>
          )}
        </defs>
      </svg>

      {/* Shadow layer */}
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(ellipse at 50% 50%, ${color}, transparent 70%)`,
          filter: `url(#${id}-shadow)`,
          willChange: 'filter',
        }}
      />

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>

      {/* Noise overlay */}
      {noise && noise.opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            filter: `url(#${id}-noise)`,
            opacity: noise.opacity,
            pointerEvents: 'none',
            zIndex: 30,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  );
}

export default EtheralShadow;
