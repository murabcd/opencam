import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

type GreetingProps = {
  disabled?: boolean;
  onStart?: () => void;
};

export const Greeting = ({ disabled, onStart }: GreetingProps) => (
  <div
    className="flex size-full flex-col items-center justify-center gap-4"
    key="overview"
  >
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.5 }}
    >
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <Video className="h-12 w-12 text-muted-foreground" />
      </div>
    </motion.div>
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
      exit={{ opacity: 0, y: 10 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.6 }}
    >
      <p className="mb-4 text-muted-foreground text-sm">
        Click below to enable your camera.
      </p>
      {onStart && (
        <Button disabled={disabled} onClick={onStart} size="sm">
          Enable Camera
        </Button>
      )}
    </motion.div>
  </div>
);
