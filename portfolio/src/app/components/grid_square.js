"use client";

import { useState } from "react";

export default function GridSquare({ value }){
    return(<div className="flex items-center justify-center text-center w-16 h-16 border-2 border-slate-100">{value}</div>)
};