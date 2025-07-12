import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
        />
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl font-semibold text-white"
        >
          Loading SkillSwap...
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-gray-400 mt-2"
        >
          Connecting you with skill swappers
        </motion.p>
      </div>
    </div>
  );
}