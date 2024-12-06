import { motion } from "framer-motion";
import { ShoppingCart, BarChart, TrendingUp } from "lucide-react";
import Link from "next/link";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
          <ShoppingCart />
          <span>+</span>
          <BarChart />
          <span>+</span>
          <TrendingUp />
        </p>
        <p>
          Welcome to <strong>ChaSA</strong>—your dedicated e-commerce
          analytics assistant. ChaSA is designed to provide you with
          data-driven insights, actionable recommendations, and comprehensive
          analyses to help make informed business decisions.
        </p>
        <p>
          Powered by advanced analytics and a robust toolkit, ChaSA can help
          you analyze trends, understand consumer behavior, and uncover growth
          opportunities in the e-commerce space. Get started by exploring
          ChaSA's capabilities and seeing how it can streamline your
          e-commerce analysis.
        </p>
      </div>
    </motion.div>
  );
};
