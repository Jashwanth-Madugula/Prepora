/**
 * @file src/components/coding/QuestionPanel.tsx
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

interface Props {

 question:any;
}

export default function
QuestionPanel({

 question

}:Props){

 return (

  <div>

   <h2
   className="text-2xl font-bold">

    {question.title}

   </h2>

   <p className="mt-4">

    {question.description}

   </p>

   <div className="mt-6">

    <h3>
      Constraints
    </h3>

    <ul>

     {question.constraints
      ?.map(
       (
        item:string,
        index:number
       ) => (

       <li key={index}>
        {item}
       </li>

      ))}

    </ul>

   </div>

  </div>

 );
}