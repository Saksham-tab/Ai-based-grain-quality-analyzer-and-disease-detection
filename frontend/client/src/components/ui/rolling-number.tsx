import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

interface RollingNumberProps {
    value: number;
    precision?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function RollingNumber({
    value,
    precision = 0,
    prefix = "",
    suffix = "",
    className = "",
}: RollingNumberProps) {
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        stiffness: 60,
        damping: 20,
        restDelta: 0.001,
    });

    const displayValue = useTransform(springValue, (latest) => {
        return `${prefix}${latest.toFixed(precision)}${suffix}`;
    });

    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    useEffect(() => {
        return displayValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = latest;
            }
        });
    }, [displayValue]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            {value.toFixed(precision)}
            {suffix}
        </span>
    );
}
