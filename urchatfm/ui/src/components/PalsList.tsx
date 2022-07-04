import { deSig } from '@urbit/api';
import { isValidPatp } from 'urbit-ob';
import React, { useCallback } from 'react';


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

  const onSubmitCall = (ship: string ) => {
    placeCall(deSig(ship));
  }

  const testShips = ["~zod", "~bus", "~datwet"];

  return (
    <>
    <h3>Mutuals</h3>
    {
      testShips.map((shipName) => {
        return <PalCaller ship={shipName} placeCall={onSubmitCall} />
      })
    }
    </>
  );
}