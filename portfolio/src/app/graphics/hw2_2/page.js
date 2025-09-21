"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function HW2() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 2_2: Plinko Ball</div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-black max-w-[700px] max-h-[700px] w-full h-full" />
        <Script src={`${prefix}/hw2_2.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); gl_start(canvas, new Scene());}}></Script>
        <div className="text-center ">Click on the canvas and move the left and right arrow keys or A and D to move the paddle.</div>
      </main>
    </div>
  );
}

