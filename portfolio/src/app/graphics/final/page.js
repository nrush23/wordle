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

  //trigger on component mount and unmount
  useEffect(() => {
    inputManager.current.addListeners(document.getElementById("glcanvas"));
    return () => {
      // cleaning up the listeners here
      inputManager.current.removeListeners(document.getElementById("glcanvas"));
    }
  }, []);

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header></Header>
      <main className="flex flex-col flex-1 w-full items-center">
        <div className="text-center font-semibold">Durg&apos;s Durgers: The Final</div>
        <canvas style={{outline: 'none'}}id="glcanvas" tabIndex={0} className="bg-[rgb(224,224,224)] w-full flex-1"/>
<<<<<<< HEAD
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
        <Script src={`${prefix}/final/final.js`}></Script>
=======
        <Script src={`${prefix}/final/renderer.js`}></Script>
>>>>>>> d06f5746a08cfb4501a0d661f012bf8b09407d8f
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
            gl_start(canvas, new Scene(canvas, prefix, gameSession.current));
          }}
        ></Script>
      </main>
    </div>
  );
}
