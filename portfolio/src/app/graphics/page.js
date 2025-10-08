import Image from "next/image";
import Header from "../components/header";
import Assignment from "../components/assignment";

const prefix = process.env.BASE_PATH || "";

export default function Graphics() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Header></Header>
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center w-full font-semibold">Assignment List</div>
        <ol className="font-mono list-inside text-sm/6 text-center sm:text-left">
          <Assignment  path={`${prefix}/graphics/hw1/`} name={"HW 1: Pong"} image={`${prefix}/pong.png`}></Assignment>
          <Assignment  path={`${prefix}/graphics/hw2/`} name={"HW 2: Plinko"} image={`${prefix}/plinko.png`}></Assignment>
          <Assignment  path={`${prefix}/graphics/hw3/`} name={"HW 3: Polygons"}></Assignment>
          <Assignment  path={`${prefix}/graphics/hw4/`} name={"HW 3: Training Ground"}></Assignment>              
        </ol>
      </main>
    </div>
  );
}
