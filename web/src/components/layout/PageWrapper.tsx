import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="px-6 py-6 max-w-[1700px] mx-auto"
    >
      {children}
    </motion.div>
  );
}
