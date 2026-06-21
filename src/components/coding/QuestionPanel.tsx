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