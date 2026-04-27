import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export default function Toast() {
  const { toastMessage } = useAppContext();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] bg-foreground text-background px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xl whitespace-nowrap"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
