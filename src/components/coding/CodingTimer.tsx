"use client";

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