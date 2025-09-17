"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

export default function Graphics() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20">
      <Header></Header>
      <main className="flex flex-col row-start-2 w-full h-full items-center justify-center">
        <div className="text-center font-semibold">Assignment 1</div>
        <canvas id="glcanvas" tabIndex={0} className="bg-black border border-black max-w-[600px] max-h-[600px] w-full h-full" />
        <Script src={`${prefix}/hw1.js`}></Script>
        <Script src={`${prefix}/webgl.js`} onLoad={() => { const canvas = document.getElementById("glcanvas"); gl_start(canvas, new Scene());}}></Script>
      </main>
    </div>
  );
}

