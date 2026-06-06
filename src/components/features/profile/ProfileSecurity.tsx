import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";

export function ProfileSecurity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <GlassPanel className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={15} className="text-primary" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Security Status
          </span>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Password management and two-factor authentication will be available in a future update.
          </p>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
