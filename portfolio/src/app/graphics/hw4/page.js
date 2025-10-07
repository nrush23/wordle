"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function HW4() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pt-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 4: Training Room</div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-black aspect-square max-w-[600px]" />
        <Script src={`${prefix}/hw2.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); gl_start(canvas, new Scene(`${prefix}/audio/plink.mp3`, `${prefix}/audio/circus.mp3`));}}></Script>
        <div className="text-center ">Click on the canvas and move your mouse to move the ball left and right. Reset the board by pressing R. Please turn up your volume.</div>
      </main>
    </div>
  );
}

