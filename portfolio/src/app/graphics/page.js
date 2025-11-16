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
        <ol className="font-mono list-inside text-sm/6 text-center sm:text-left grid grid-cols-3 gap-6">
          <Assignment path={`${prefix}/graphics/hw1/`} name={"HW 1: Pong"} image={`${prefix}/pong.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw2/`} name={"HW 2: Plinko"} image={`${prefix}/plinko.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw3/`} name={"HW 3: Polygons"}></Assignment>
          <Assignment path={`${prefix}/graphics/hw4/`} name={"HW 4: Zombie"} image={`${prefix}/hw4/zombie.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw5/`} name={"HW 5: Headache"} image={`${prefix}/hw5/room.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw6/`} name={"HW 6: \"Roller Coaster\""} image={`${prefix}/hw6/rollercoaster.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw7/`} name={"HW 7: Abstract Snake"} image={`${prefix}/hw7/pic.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw8/`} name={"HW 8: Sierpinski Prison"} image={`${prefix}/hw8/sierpinski.png`}></Assignment>
          <Assignment path={`${prefix}/graphics/hw9/`} name={"HW 9: \"Bird\""} image={`${prefix}/hw9/bird.png`}></Assignment>
        </ol>
      </main>
    </div>
  );
}
