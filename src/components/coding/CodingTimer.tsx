"use client";


/**
 * @file src/components/coding/CodingTimer.tsx
 * @category React UI Component
 *
 * Why this code exists:
 * Renders a visual UI element or widget inside the candidate's application view.
 * 
 *
 * What problem it solves:
 * - Constructs modular, interactive interface components (like forms, buttons, timers, code-editors) keeping state reactive and responsive to candidate interactions.
 *
 * How it works internally:
 * - Implements a TypeScript React function component combining Tailwind CSS styling, React hooks (useState, useEffect, useMemo), animations (framer-motion), and callback events.
 */

import { useEffect,useState }
from "react";

interface Props {

 seconds:number;

 onFinish:() => void;
}

export default function CodingTimer({

 seconds,

 onFinish

}:Props) {

 const [timeLeft,setTimeLeft] =
 useState(seconds);

 useEffect(() => {

   if(timeLeft <= 0){

     onFinish();

     return;
   }

   const timer =
   setInterval(() => {

     setTimeLeft(prev =>
      prev - 1
     );

   },1000);

   return () =>
    clearInterval(timer);

 },[timeLeft]);

 const minutes =
 Math.floor(timeLeft/60);

 const secs =
 timeLeft%60;

 return (

  <div className="font-bold">

   {minutes}:
   {secs.toString()
    .padStart(2,"0")}

  </div>

 );
}