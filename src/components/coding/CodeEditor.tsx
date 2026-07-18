"use client";


/**
 * @file src/components/coding/CodeEditor.tsx
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