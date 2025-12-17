"use client";

import Script from "next/script";
import Header from "../../components/header";

const prefix = process.env.BASE_PATH || "";

//testing
import React, { useState, useRef, useEffect } from 'react';
import ConnectRequestMessage from '../../../../public/network/Network/connectRequest.js';
import GameSession from '../../../../public/network/gameSession.js';
import NetworkClient from '../../../../public/network/networkClient.js';
import InputManager from '../../../../public/network/inputManager.js';
import createEventBus from "../../../../public/network/Events/eventBus.js";
//end testing

export default function Final() {

  const eventBus = useRef(createEventBus());
  const inputManager = useRef(new InputManager());
  const networkClient = useRef(new NetworkClient());
  const gameSession = useRef(new GameSession(eventBus.current, networkClient.current, inputManager.current));

  // Track when scripts are ready (so we can safely call Scene/gl_start)
  const [scriptsReady, setScriptsReady] = useState(false);

  useEffect(() => {
    if (!scriptsReady) return;

    const canvas = document.getElementById("glcanvas");
    if (!canvas) return;

    // 1) Input listeners (paired add/remove)
    inputManager.current.addListeners(canvas);

    // 2) Resize handling (paired add/remove)
    function resizeWindow() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    }
    resizeWindow();
    window.addEventListener("resize", resizeWindow);

    // 3) Parser prefix + WebGL start
    // Parser, Scene, gl_start are globals coming from your scripts
    Parser.prefix = prefix;

    const scene = new Scene(canvas, prefix, gameSession.current);

    // IMPORTANT: your patched gl_start should RETURN a cleanup function
    const stop = gl_start(canvas, scene);

    return () => {
      // Clean up in reverse order
      window.removeEventListener("resize", resizeWindow);
      try {
        gameSession.current?.dispose?.();
        stop?.(); // clears webgl interval, removes scene events, calls scene.dispose()
      } catch (e) {
        console.warn("gl_stop failed:", e);
      }
      inputManager.current.removeListeners(canvas);
    };
  }, [scriptsReady]);
  
  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header></Header>
      <main className="flex flex-col flex-1 w-full items-center">
        <div className="text-center font-semibold">Durg&apos;s Durgers: The Final</div>
        <canvas style={{outline: 'none'}}id="glcanvas" tabIndex={0} className="bg-[rgb(74,74,72)] w-full flex-1"/>
        <div
          className="absolute"
          style={{
            width: "4px",
            height: "4px",
            backgroundColor: "red",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none", // so it never interferes with input
          }}
        />
        <Script src={`${prefix}/final/renderer.js`} strategy="afterInteractive"></Script>
        <Script src={`${prefix}/mesh.js`} strategy="afterInteractive"></Script>
        <Script src={`${prefix}/parser.js`} strategy="afterInteractive"></Script>
        {/* Full screen the game, NO INSTRUCTIONS*/}
        <Script src={`${prefix}/webgl.js`} strategy="afterInteractive" onLoad={() => setScriptsReady(true)}></Script>
      </main>
    </div>
  );
}
