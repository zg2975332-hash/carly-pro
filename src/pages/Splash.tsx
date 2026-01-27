import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(43 74% 49% / 0.15) 0%, transparent 70%)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      {/* Logo/Icon */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-24 h-24 rounded-2xl btn-gold flex items-center justify-center">
          <svg
            className="w-14 h-14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 17H21V15H19V17ZM3 17H5V15H3V17ZM19.92 12.08C19.97 11.73 20 11.37 20 11C20 6.03 15.97 2 11 2C8.03 2 5.36 3.44 3.76 5.67L5.24 6.8C6.46 5.03 8.58 4 11 4C14.86 4 18 7.14 18 11C18 11.26 17.98 11.51 17.94 11.76L19.92 12.08ZM11 20C7.14 20 4 16.86 4 13C4 12.74 4.02 12.49 4.06 12.24L2.08 11.92C2.03 12.27 2 12.63 2 13C2 17.97 6.03 22 11 22C13.97 22 16.64 20.56 18.24 18.33L16.76 17.2C15.54 18.97 13.42 20 11 20Z"
              fill="currentColor"
            />
            <circle cx="11" cy="11" r="3" fill="currentColor" />
          </svg>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-5xl font-display text-gold mb-3 text-center relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        Malik Collection
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-muted-foreground text-lg tracking-wide relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Trusted Car Trading
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-16 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default Splash;