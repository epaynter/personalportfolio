import React from 'react';
import { motion } from 'framer-motion';

export default function Section({ 
  id, 
  title, 
  description, 
  showDivider = true, 
  className = '', 
  children 
}) {
  return (
    <section id={id} className={`relative py-16 ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background dark:from-zinc-900 via-background dark:via-zinc-900 to-background/95 dark:to-zinc-900/95 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-12"
          >
            {title && (
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 mb-4"
              >
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg text-gray-600 dark:text-zinc-300 max-w-3xl mx-auto font-normal leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </motion.div>
        )}
        
        {showDivider && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative h-px mb-12"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
} 