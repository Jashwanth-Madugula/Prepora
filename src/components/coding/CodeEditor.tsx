"use client";

import Editor
from "@monaco-editor/react";

interface Props {

 code:string;

 setCode:
 (value:string) => void;
}

export default function
CodeEditor({

 code,

 setCode

}:Props){

 return (

  <Editor

   height="600px"

   language="javascript"

   value={code}

   onChange={(value) =>

    setCode(value || "")

   }

  />

 );
}