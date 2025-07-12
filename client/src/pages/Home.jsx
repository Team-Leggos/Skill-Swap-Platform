import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  TorusKnot,
  MeshWobbleMaterial,
  Sphere,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { swapAPI } from "../services/api";
import SwapCard from "../components/SwapList/SwapCard";
import { useAuth } from "../context/AuthContext";

// Starfield with color variety
function Starfield({ count = 180 }) {
  const points = useRef();
  // Distribute stars in a 3D cube volume
  const positions = Array.from({ length: count * 3 }, () =>
    THREE.MathUtils.randFloatSpread(8)
  );
  // Random colors: white, blue, purple
  const colors = [
    "#fff",
    "#a5b4fc",
    "#f0abfc",
    "#bae6fd",
    "#c084fc",
    "#f472b6",
    "#818cf8",
  ];
  const colorArray = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const color = new THREE.Color(
      colors[Math.floor(Math.random() * colors.length)]
    );
    color.toArray(colorArray, i * 3);
  }
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={new Float32Array(positions)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colorArray.length / 3}
          array={colorArray}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.045} sizeAttenuation />
    </points>
  );
}

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swapError, setSwapError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [interactive3D, setInteractive3D] = useState(false);
  const handleDoubleClick = () => setInteractive3D((prev) => !prev);

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    try {
      setSwapError(null);
      const response = await swapAPI.getSwaps({ status: "active" });
      setSwaps(response.data);
    } catch (error) {
      setSwapError("Could not fetch swaps. Please try again later.");
      console.error("Error fetching swaps:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSwaps = swaps.filter((swap) => {
    const matchesSearch =
      swap.skillOffered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swap.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "tech")
      return matchesSearch && swap.category === "Technology";
    if (filter === "creative")
      return matchesSearch && swap.category === "Creative";
    if (filter === "lifestyle")
      return matchesSearch && swap.category === "Lifestyle";

    return matchesSearch;
  });

  const categories = [
    { id: "all", name: "All Skills", icon: "🌟", count: swaps.length },
    {
      id: "tech",
      name: "Technology",
      icon: "💻",
      count: swaps.filter((s) => s.category === "Technology").length,
    },
    {
      id: "creative",
      name: "Creative",
      icon: "🎨",
      count: swaps.filter((s) => s.category === "Creative").length,
    },
    {
      id: "lifestyle",
      name: "Lifestyle",
      icon: "🏃‍♀️",
      count: swaps.filter((s) => s.category === "Lifestyle").length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light via-primary-dark to-secondary-dark pt-20">
      {/* Hero Section */}
      <section
        className="relative py-20 overflow-hidden hero-3d"
        onDoubleClick={handleDoubleClick}
        style={{ cursor: "pointer" }}
      >
        {/* Full-section 3D starfield/planet/nebula effect behind text */}
        <div
          className={`absolute inset-0 w-full h-full z-0 ${
            interactive3D ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <Canvas camera={{ position: [0, 0, 7] }} className="w-full h-full">
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <Starfield count={180} />
            {/* Nebula effect using a semi-transparent mesh */}
            <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
              <sphereGeometry args={[2.5, 32, 32]} />
              <meshBasicMaterial transparent opacity={0.18}>
                <primitive attach="color" object={new THREE.Color("#a5b4fc")} />
              </meshBasicMaterial>
            </mesh>
            {/* Main planet with ring and glow */}
            <group position={[2.5, -0.5, -2]}>
              <mesh>
                <sphereGeometry args={[1.2, 64, 64]} />
                <meshPhysicalMaterial
                  color="#a78bfa"
                  emissive="#a78bfa"
                  emissiveIntensity={0.9}
                  transparent
                  opacity={0.28}
                  roughness={0.4}
                  metalness={0.7}
                  clearcoat={1}
                />
              </mesh>
              {/* Planet ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <torusGeometry args={[1.5, 0.08, 2, 64]} />
                <meshBasicMaterial color="#f0abfc" transparent opacity={0.25} />
              </mesh>
            </group>
            {/* Smaller moon/planet with glow */}
            <mesh position={[-2.2, 1.1, 1.5]}>
              <sphereGeometry args={[0.4, 32, 32]} />
              <meshPhysicalMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={0.7}
                transparent
                opacity={0.22}
                roughness={0.7}
                metalness={0.3}
              />
            </mesh>
            <OrbitControls
              enableZoom={false}
              enablePan={interactive3D}
              enableRotate={interactive3D}
              autoRotate={!interactive3D}
              autoRotateSpeed={0.5}
            />
          </Canvas>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/40 to-transparent pointer-events-none" />
        </div>
        {/* Content floats above the 3D effect */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-accent-light mb-6">
              Share Skills,{" "}
              <span className="bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent">
                Build Connections
              </span>
            </h1>
            <p className="text-xl text-accent-light mb-8 leading-relaxed">
              Connect with people around the world to exchange knowledge, learn
              new skills, and grow together in our vibrant community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-primary-light to-secondary-light text-background-dark font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Swapping
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-accent-dark text-accent-light font-semibold rounded-xl hover:border-primary-light hover:text-primary-light transition-all duration-300"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Discover Amazing Skills
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse through our community's diverse skill offerings and find
              the perfect match for your learning journey.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter === category.id
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.name}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    filter === category.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {category.count}
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {swapError ? (
            <div className="text-center text-red-400 py-12 text-lg font-semibold">
              {swapError}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-md animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredSwaps.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredSwaps.map((swap, index) => (
                <motion.div
                  key={swap._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <SwapCard swap={swap} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No skills found
              </h3>
              <p className="text-gray-600 mb-8">
                Try adjusting your search or browse different categories.
              </p>
              {!isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Join the Community
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold">1,200+</div>
              <div className="text-xl">Active Skills</div>
              <div className="text-blue-100">Available for exchange</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold">800+</div>
              <div className="text-xl">Community Members</div>
              <div className="text-blue-100">Ready to share knowledge</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold">2,500+</div>
              <div className="text-xl">Successful Swaps</div>
              <div className="text-blue-100">Knowledge exchanges completed</div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
