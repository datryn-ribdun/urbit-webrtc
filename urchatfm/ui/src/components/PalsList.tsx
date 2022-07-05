import { deSig } from '@urbit/api';
import useUrchatStore from '../useUrchatStore';
import React, { useEffect, useState } from 'react';
import { start } from 'repl';


interface PalsProps {
  ship: string;
  placeCall: (ship: string) => void;
}

const PalCaller = ({placeCall, ship}: PalsProps) => {
  const initiatePalCall = () => {
    placeCall(ship);
  }

  return (
    <>
      <div className="flex flex-row">
        <p>{ship}</p>
        <button type="submit" onClick={initiatePalCall} className="button px-6 text-pink-900 bg-pink-500 disabled:text-gray-900 disabled:bg-gray-400 disabled:cursor-default">Call</button>
      </div>
    </>
  );
}


interface PalsListProps {
  placeCall: (ship: string) => void;
}

export const PalsList = ({ placeCall }: PalsListProps) => {

  const {startPals, pals} = useUrchatStore();
  const [palsList, setPals] = useState<string[]>([]);

  const onSubmitCall = (ship: string ) => {
    placeCall(deSig(ship));
  }

  useEffect(() => {
    startPals();
  }, []);

  const test=async()=>{
    const listOfPals = await pals.getPals();
    const incoming = listOfPals["incoming"];
    const outgoing = listOfPals["outgoing"];
    const mutuals = Object.keys(outgoing).filter(k => k in incoming)
    setPals(mutuals);
  }


  return (
    <>
    <button type="submit" onClick={test} className="button bg-blue-200">Refresh friends list</button>
    {
      palsList.map((shipName) => {
        return <PalCaller key={shipName} ship={shipName} placeCall={onSubmitCall} />
      })
    }
    </>
  );
}