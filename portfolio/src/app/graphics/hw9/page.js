"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function HW9() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pt-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 9: &quot;Bird&quot;</div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-[rgb(0,0,0)] aspect-square max-w-[600px]" />
        <Script src={`${prefix}/hw9/hw9.js`}></Script>
        <Script src={`${prefix}/mesh.js`}></Script>
        <Script src={`${prefix}/parser.js`}></Script>
        <Script src={`${prefix}/implicit.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); Parser.prefix = prefix; gl_start(canvas, new Scene(canvas));}}></Script>
        <div className="text-center ">Click on the canvas for FPS movement, use WASD to walk around (Shift willl float you down, Space will float you up)</div>
      </main>
    </div>
  );
}

