"use client";
import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const BrainParticles = () => {
  const groupRef = useRef();
  const [vertices, setVertices] = useState([]);
  const { scene } = useThree();
  const noiseScaleRef = useRef(0.4);
  const colorArrayRef = useRef();
  const simplexNoiseRef = useRef(new SimplexNoise());
  const { nodes } = useGLTF("/Brain_last.glb");
  const [blobs, setBlobs] = useState([]);
  const colors = ["#3ae095", "#03a4b4", "#0a4ef7", "#793ef0", "#cc27f5"];

  // Load vertices from the 3D model
  useEffect(() => {
    if (nodes && nodes.Scene) {
      const vertices = [];
      nodes.Scene.traverse((child) => {
        if (child.isMesh) {
          const positions = child.geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            vertices.push(positions[i], positions[i + 1], positions[i + 2]);
          }
        }
      });
      setVertices(vertices);
    }
  }, [nodes, scene]);

  useEffect(() => {
    if (vertices.length > 0) {
      const p_geom = new THREE.BufferGeometry();
      p_geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      const colorArray = new Float32Array(vertices.length);
      colorArray.fill(1);
      p_geom.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
      colorArrayRef.current = colorArray;

      const p_material = new THREE.PointsMaterial({
        size: 0.0035,
        vertexColors: true,
      });

      const particles = new THREE.Points(p_geom, p_material);
      particles.scale.set(10, 10, 10);
      particles.rotation.x = Math.PI / 2;
      particles.position.y -= 0.5;

      if (groupRef.current) {
        groupRef.current.add(particles);
      }

      return () => {
        if (groupRef.current) {
          groupRef.current.remove(particles);
        }
      };
    }
  }, [vertices]);

  // Initialize a new blob
  const createBlob = () => {
    if (vertices.length === 0) return null; // Ensure vertices are loaded

    const randomIndex = Math.floor(Math.random() * (vertices.length / 3)) * 3;
    const center = new THREE.Vector3(
      vertices[randomIndex],
      vertices[randomIndex + 1],
      vertices[randomIndex + 2]
    );
    const randomColor = colors[Math.floor(Math.random() * colors.length)]; 

    return {
      center,
      radius: 0.01, // Start with a small initial radius
      lifespan: Math.random() * (7 - 2) + 2, // Random lifespan between 2-7 seconds
      time: 0,
      shrink: false,
      shrinkStartTime: 0,
      isAlive: true,
      color: randomColor
    };
  };

  useEffect(()=>{
    console.log(blobs)
  }, [blobs])
  
  // Add a new blob every 2-4 seconds if there are less than 4 blobs
  useEffect(() => {
    if (vertices.length === 0) return; // Don't start interval until vertices are loaded

    const interval = setInterval(() => {
      setBlobs((prevBlobs) => {
        if (prevBlobs.length < 9) {
          const newBlob = createBlob();
          if (newBlob) {
            // console.log("New blob created:", newBlob);
            return [...prevBlobs, newBlob];
          }
        }
        return prevBlobs;
      });
    }); // Random interval between 2-4 seconds

    return () => clearInterval(interval);
  }, [vertices]);

  // Update blobs in the animation loop
  useFrame(() => {
    if (vertices.length === 0 || !colorArrayRef.current) return;
  
    // Update blob states (existing logic)
    setBlobs((prevBlobs) =>
      prevBlobs
        .map((blob) => {
          const { center, radius, lifespan, time, shrink, shrinkStartTime } = blob;
  
          // Increment time
          blob.time += 0.016; // ~16ms per frame (60 FPS)
  
          // Check if the blob's lifespan has ended
          if (blob.time > lifespan && !blob.shrink) {
            blob.shrink = true;
            blob.shrinkStartTime = blob.time;
          }
  
          // Grow the blob
          if (!blob.shrink) {
            blob.radius = THREE.MathUtils.lerp(blob.radius, 0.04, 0.02);
          }
          // Gradually shrink the blob
          else {
            const shrinkDuration = 2; // Shrink over 3 seconds
            const shrinkProgress = (blob.time - blob.shrinkStartTime) / shrinkDuration;
            blob.radius = THREE.MathUtils.lerp(0.03, 0, shrinkProgress);
          }
  
          // Randomly move the blob center
          if (!blob.shrink) {
            const moveSpeed = 0.002;
            blob.center.x += (Math.random() - 0.7) * moveSpeed;
            blob.center.y += (Math.random() - 0.7) * moveSpeed;
            blob.center.z += (Math.random() - 0.7) * moveSpeed;
          }
  
          // Mark the blob as dead if it has shrunk completely
          if (blob.shrink && blob.radius < 0.001) {
            blob.isAlive = false;
          }
  
          return blob;
        })
        .filter((blob) => blob.isAlive) // Remove dead blobs
    );
  
    // Color management (new logic)
    const colorArray = colorArrayRef.current;
  
    // Reset colors to white
    for (let i = 0; i < colorArray.length; i += 3) {
      colorArray[i] = 1; // R
      colorArray[i + 1] = 1; // G
      colorArray[i + 2] = 1; // B
    }
  
    // Update colors for each blob
    blobs.forEach((blob) => {
      const { center, radius, color } = blob; 
  
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
  
        const dx = x - center.x;
        const dy = y - center.y;
        const dz = z - center.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
        if (dist < radius) {
          const threeColor = new THREE.Color(color); // Use the blob's assigned color
          threeColor.toArray(colorArray, i); // Update color array at the particle's index
        }
      }
    });
  
    // Update geometry colors
    const geometry = groupRef.current.children[0].geometry;
    geometry.attributes.color.needsUpdate = true;
  });


  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  // Render all active blobs
  return (
    <group ref={groupRef}>
      {blobs.map((blob, index) => (
        <points key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(vertices)}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={new Float32Array(vertices.length).fill(1)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.0035} vertexColors />
        </points>
      ))}
    </group>
  );
};

export default BrainParticles;