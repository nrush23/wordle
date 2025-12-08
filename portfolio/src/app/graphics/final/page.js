"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function HW10() {
  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header></Header>
      <main className="flex flex-col flex-1 w-full items-center">
        <div className="text-center font-semibold">Durg&apos;s Durgers: The Final</div>
        <canvas style={{outline: 'none'}}id="glcanvas" tabIndex={0} className="bg-[rgb(224,224,224)] w-full flex-1"/>
        <Script src={`${prefix}/final/final.js`}></Script>
        <Script src={`${prefix}/mesh.js`}></Script>
        <Script src={`${prefix}/parser.js`}></Script>
        {/* Full screen the game, NO INSTRUCTIONS*/}
        <Script src={`${prefix}/webgl.js`} onLoad={() => {
            const canvas = document.getElementById("glcanvas");
            function resizeWindow() {
              const rect = canvas.getBoundingClientRect();
              canvas.width = rect.width * window.devicePixelRatio;
              canvas.height = rect.height * window.devicePixelRatio;
            }
            resizeWindow();
            window.addEventListener("resize", resizeWindow);
            Parser.prefix = prefix;
            gl_start(canvas, new Scene(canvas, prefix));
          }}
        ></Script>
      </main>
    </div>
  );
}
