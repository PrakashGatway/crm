import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const slides = [
    {
        small: "Firiday",
        title: "BIG SALE",
        highlight: "UPTO",
        percent: "50%",
        suffix: "OFF",
        image: "https://res.cloudinary.com/dd5s7qpsc/image/upload/v1768026204/thumbnails/xpewnxseduwwcdnpqfyj.png"
    },
    {
        small: "Limited Time",
        title: "MEGA DEAL",
        highlight: "FLAT",
        percent: "40%",
        suffix: "OFF",
        image: "https://res.cloudinary.com/dd5s7qpsc/image/upload/v1767951357/thumbnails/apiohjybynjzdrxu6x0d.png"
    },
];

export function LeftSlider() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const t = setInterval(() => {
            setIndex((p) => (p + 1) % slides.length);
        }, 4000);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{ borderRadius: "20px 20px 0px 100px" }} className="p-[1.5px] col-span-3 lg:col-span-2 h-full relative  overflow-hidden col-span-2 w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/50 to-[#686868]">
            <div style={{ borderRadius: "20px 20px 0px 100px" }} className="w-full relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.4 }}
                        className="h-full flex items-center"
                    >
                        <div className="h-[90px] sm:h-[140px] md:h-[150px] lg:h-[160px] w-full">
                            <img className="h-full w-full object-cover object-center" src={slides[index].image} alt="" />
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export function RightOffer({ content }) {
    return (
        <div style={{ borderRadius: "20px 20px 100px 0px" }} className="p-[1.5px] hidden lg:block h-full relative overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
            <div style={{ borderRadius: "20px 20px 100px 0px" }} className="flex items-center h-full w-full justify-between overflow-hidden p-6 bg-gradient-to-r from-[#EBEBEB] via-[#ffffff] to-[#EBEBEB]">
                {!content ? <>
                    <div className="space-y-2 text-[#838383]">
                        <p className="text-xl font-medium">
                            Buy Mock Test Series and  get Flat <span className="font-semibold text-orange-500">50% OFF</span> On Every Test Series
                        </p>
                        {/* <button className="mt-2 inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
          Buy Test
        </button> */}
                    </div>

                    {/* Right Icon */}
                    <div className="flex h-10 w-90 items-center justify-center rounded-full">
                        <img src="https://images.emojiterra.com/google/noto-emoji/unicode-16.0/color/1024px/1f6d2.png" alt="" />
                    </div></> : ""}

            </div>
        </div >

    )
}
