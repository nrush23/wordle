import Image from "next/image";
import Header from "../../components/header";
import Assignment from "../../components/assignment";

const prefix = process.env.BASE_PATH || "";

export default function HW3() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Header></Header>
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center w-full font-semibold">Assignment List</div>
        <ol className="font-mono list-inside text-sm/6 text-center sm:text-left">
          <Assignment path={`${prefix}/graphics/hw3/original`} name={"Original Scene"}></Assignment>
          <Assignment path={`${prefix}/hw3/scene1.html`} name={"Scene 1"} ></Assignment>
          <Assignment path={`${prefix}/hw3/scene2.html`} name={"Scene 2"} ></Assignment>
          <Assignment path={`${prefix}/hw3/scene4.html`} name={"Scene 4"} ></Assignment>
          <Assignment path={`${prefix}/hw3/scene5.html`} name={"Scene 5"} ></Assignment>
          <Assignment path={`${prefix}/hw3/scene6.html`} name={"Scene 6"}></Assignment>
          <Assignment path={`${prefix}/hw3/scene7.html`} name={"Scene 7"} ></Assignment>
        </ol>
      </main>
    </div>
  );
}
