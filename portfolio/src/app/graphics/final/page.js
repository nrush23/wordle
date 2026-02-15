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

import WebGLRenderer from "../../../../public/network/ReactWebGl/webgl";
import Parser from "../../../../public/network/ReactWebGl/parser.js";
import {Scene} from "../../../../public/network/ReactWebGl/renderer.js";
import { webglMath } from "../../../../public/network/ReactWebGl/math";
//end testing

export default function Final() {

  const eventBus = useRef(null);
  const inputManager = useRef(null);
  const networkClient = useRef(null);
  const gameSession = useRef(null);
  const webGLRenderer = useRef(null);
  const scene = useRef(null);
  const stopFn = useRef(null);

  useEffect(() => {
    const canvas = document.getElementById("glcanvas");
    if(webGLRenderer.current === null){
      
      eventBus.current = createEventBus();
      inputManager.current = new InputManager();
      // 1) Input listeners (paired add/remove)
      inputManager.current.addListeners(canvas);
      networkClient.current = new NetworkClient();
      gameSession.current = new GameSession(eventBus.current, networkClient.current, inputManager.current);
      webGLRenderer.current = new WebGLRenderer();
      Parser.prefix = prefix;
      gameSession.current.prefix = prefix;
      scene.current = new Scene(canvas, prefix, gameSession.current, webGLRenderer.current);
      stopFn.current = webGLRenderer.current.gl_start(canvas, scene.current);

    }

    

    // 2) Resize handling (paired add/remove)
    function resizeWindow() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    }
    resizeWindow();
    window.addEventListener("resize", resizeWindow);

    // IMPORTANT: your patched gl_start should RETURN a cleanup function
    

    return () => {
      console.log("RUNNING CLEANUP ");
      stopFn.current();
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
  }, []);
  
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
        </main>
    </div>
  );
}
