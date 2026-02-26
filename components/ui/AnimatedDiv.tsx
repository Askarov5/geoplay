"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export default function AnimatedDiv(props: HTMLMotionProps<"div">) {
    return <motion.div {...props} />;
}
