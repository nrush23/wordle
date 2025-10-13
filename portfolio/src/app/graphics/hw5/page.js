"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function HW5() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pt-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 5: Water Gun </div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-black aspect-square max-w-[600px]" />
        <Script src={`${prefix}/hw5/hw5.js`}></Script>
        <Script src={`${prefix}/mesh.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); gl_start(canvas, new Scene(`${prefix}/audio/plink.mp3`, `${prefix}/audio/circus.mp3`));}}></Script>
        <div className="text-center ">Click on the canvas to shoot the cubes</div>
      </main>
    </div>
  );
}

