"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

function VideoSearchAnimation() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <svg className="w-16 h-16 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-12 h-16 rounded bg-foreground/20"
            animate={{ 
              scale: active === i ? 1.1 : 1,
              opacity: active === i ? 1 : 0.3
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

function VoiceAnimation() {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking((prev) => !prev)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex gap-1 items-end h-16">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 bg-foreground rounded-full"
            animate={{ 
              height: speaking ? [8, 32, 16, 40, 8][i] : 8
            }}
            transition={{ 
              duration: 0.8,
              delay: i * 0.1,
              repeat: speaking ? Infinity : 0,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
    </div>
  )
}

function MemoryAnimation() {
  const [items, setItems] = useState([1, 2, 3])

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const next = [...prev]
        next.push(next.length + 1)
        if (next.length > 6) next.shift()
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full p-4 flex items-center justify-center overflow-hidden">
      <div className="grid grid-cols-3 gap-2 w-full max-w-[140px]">
        {items.slice(-6).map((i) => (
          <motion.div
            key={i}
            className="bg-foreground/20 rounded-md h-[30px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className="bg-background px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <motion.p
          className="text-muted-foreground text-sm uppercase tracking-widest mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Features
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* semantic search card */}
          <motion.div
            className="bg-secondary rounded-xl p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2 }}
            data-clickable
          >
            <div className="flex-1">
              <VideoSearchAnimation />
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-xl text-foreground">Smart Video Search</h3>
              <p className="text-muted-foreground text-sm mt-1">AI automatically finds relevant moments across your memories.</p>
            </div>
          </motion.div>

          {/* voice clone card */}
          <motion.div
            className="bg-secondary rounded-xl p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            data-clickable
          >
            <div className="flex-1">
              <VoiceAnimation />
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-xl text-foreground">Your Voice, Cloned</h3>
              <p className="text-muted-foreground text-sm mt-1">Realistic voice simulation brings your memories to life.</p>
            </div>
          </motion.div>

          {/* context enrichment card */}
          <motion.div
            className="bg-secondary rounded-xl p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            data-clickable
          >
            <div className="flex-1">
              <MemoryAnimation />
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-xl text-foreground">Rich Context</h3>
              <p className="text-muted-foreground text-sm mt-1">Add people, places, and emotions to every memory.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
