import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Model3DViewerProps {
  modelPath: string;
  backgroundColor?: string;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelPath,
  backgroundColor = '#f5f5f5',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    // Evitar doble inicialización
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ============ ESCENA ============
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // ============ CÁMARA ============
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.2);
    camera.lookAt(0, 0, 0);

    // ============ RENDERER ============
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new THREE.Color(backgroundColor), backgroundColor === 'transparent' ? 0 : 1);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controlsRef.current = controls;

    // ============ ILUMINACIÓN ============
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // ============ CARGAR MODELO ============
    const loader = new GLTFLoader();
    console.log('🔄 Cargando modelo desde:', modelPath);

    loader.load(
      modelPath,
      (gltf: GLTF) => {
        console.log('✅ Modelo cargado');
        
        // Crear grupo para el modelo
        const modelGroup = new THREE.Group();
        
        // Copiar todas las geometrías y materiales del modelo
        gltf.scene.children.forEach((child: THREE.Object3D) => {
          modelGroup.add(child.clone(true));
        });

        // Calcular bounding box
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        console.log('📏 Tamaño:', { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) });

        // Centrar todo en el origen
        modelGroup.children.forEach((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.position.sub(center);
          }
        });

        // Escalar
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 18 / maxDim;
        modelGroup.scale.set(scale, scale, scale);

        modelGroup.position.y = -0.1;

        modelRef.current = modelGroup;
        scene.add(modelGroup);
      },
      undefined,
      (error: unknown) => {
        console.error('❌ Error cargando modelo:', error);
      }
    );

    // ============ ANIMACIÓN ============
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ============ RESIZE ============
    const resizeRenderer = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight, false);
    };

    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);
    const resizeObserver = new ResizeObserver(() => resizeRenderer());
    resizeObserver.observe(container);

    // ============ CLEANUP ============
    return () => {
      console.log('🧹 Limpiando visualizador 3D');
      window.removeEventListener('resize', resizeRenderer);
      resizeObserver.disconnect();
      controls.dispose();
      controlsRef.current = null;
      renderer.dispose();
      container.removeChild(renderer.domElement);
      initRef.current = false;
    };
  }, [modelPath, backgroundColor]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
      }}
    />
  );
};
