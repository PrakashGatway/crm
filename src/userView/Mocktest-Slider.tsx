"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    image: "https://img.freepik.com/free-psd/online-courses-banner-template_23-2149109788.jpg",
  },
  {
    image: "https://img.freepik.com/free-vector/hand-drawn-online-college-template-design_23-2150574159.jpg?semt=ais_hybrid&w=740&q=80",
  },
  {
    image: "https://static.vecteezy.com/system/resources/thumbnails/049/748/169/small/3d-black-friday-big-sale-discount-template-banner-with-blank-space-3d-podium-for-product-sale-with-abstract-gradient-red-background-design-free-vector.jpg",
  },
]

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })

  const slideIntervalRef = useRef(null)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(slideIntervalRef.current)
  }, [])

  const slide = slides[currentSlide]

  return (
    <div
      style={{
        position: "relative",
        width: "70%",
        height: "200px",
        overflow: "hidden",
        backgroundColor: "#000",
        margin: "0 ",
        borderRadius: "24px",
      }}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              perspective: "1200px",
            }}
            
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
          >
            <motion.img
              src={slide.image}
              alt="slider"
           
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transformStyle: "preserve-3d",
                filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))",
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        style={{
          position: "absolute",
          left: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 20,
          width: "32px",
          height: "32px",
          borderRadius: "24px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
        }}
      >
        <ChevronLeft style={{ width: "16px", height: "16px", color: "#ffffff" }} />
      </button>

      <button
        onClick={nextSlide}
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 20,
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
        }}
      >
        <ChevronRight style={{ width: "16px", height: "16px", color: "#ffffff" }} />
      </button>

      {/* Indicator Dots */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex",
          gap: "8px",
        }}
      >
        {slides.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => goToSlide(idx)}
            initial={{ scale: 1 }}
            animate={{
              scale: idx === currentSlide ? 1.5 : 1,
              backgroundColor: idx === currentSlide ? "#06b6d4" : "rgba(255, 255, 255, 0.5)",
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroSlider
