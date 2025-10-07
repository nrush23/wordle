"use client";

import Script from "next/script";
import Header from "../../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function Original() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pt-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 3: Spaceship </div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-black aspect-square max-w-[600px]" />
        <Script src={`${prefix}/hw3/hw3.js`}></Script>
        <Script src={`${prefix}/quadric.js`}></Script>
        <Script src={`${prefix}/shapes.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); gl_start(canvas, new Scene(`${prefix}/audio/plink.mp3`, `${prefix}/audio/circus.mp3`));}}></Script>
        <div className="text-center ">Click on the canvas and use the arrow keys or WASD to move the spaceship</div>
      </main>
    </div>
  );
}

