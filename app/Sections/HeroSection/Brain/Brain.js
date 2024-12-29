"use client"

import React from 'react'
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import BrainParticles from './BrainParticles';
import { PerspectiveCamera } from '@react-three/drei';
import { OrbitControls, CameraShake } from '@react-three/drei'

const Brain = () => {
  return (
    <Canvas style={{ height: '100%', width: '100%' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 1.3]} fov={70} />

      <ambientLight intensity={.6} />
      {/* <directionalLight position={[10, 10, 10]} intensity={.9} /> */}
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.00001} zoomSpeed={0.001} />
      <CameraShake 
      yawFrequency={1} 
      maxYaw={0.05} 
      pitchFrequency={1} 
      maxPitch={0.05} 
      rollFrequency={0.5} 
      maxRoll={0.5} 
      intensity={0.2} />
      <BrainParticles />
    </Canvas>
  )
}

export default Brain