"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function HW5() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pt-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">HW 5: Headache </div>
        <canvas style={{outline:  'none'}}id="glcanvas" tabIndex={0} width="800" height="800" className="bg-black aspect-square max-w-[600px]" />
        <Script src={`${prefix}/hw5/hw5.js`}></Script>
        <Script src={`${prefix}/mesh.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); gl_start(canvas, new Scene(canvas));}}></Script>
        <div className="text-center ">Use the arrow keys and the mouse to move around the room. Press R to make the room stop spinning. Click to shoot cubes.</div>
      </main>
    </div>
  );
}

