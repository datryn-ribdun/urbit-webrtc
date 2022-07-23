import Urbit from "@urbit/http-api";
import { action, makeObservable } from "mobx";
import Pals from 'pals'


export class PalsStore {
  urbit: Urbit | null;
  palsInterface: Pals;
  mutuals: string[];
  justIncoming: string[];
  justOutgoing: string[];

  constructor() {
    makeObservable(this);
    console.log("PalsStore: constructor");
    this.urbit = new Urbit("", "");
    // requires <script> tag for /~landscape/js/session.js
    this.urbit.ship = (window as any).ship;
    this.urbit.verbose = true;
    this.palsInterface = new Pals(this.urbit);
  }

  @action.bound
  async loadPals() {
    console.log("PalsStore: loading pals");
    const p = await this.palsInterface.getPals();
    const incoming = p["incoming"];
    const outgoing = p["outgoing"];
    const mutuals = Object.keys(outgoing).filter(k => k in incoming)
    // get just outgoing pals (ie not mutuals)
    const outgoingPals = Object.keys(outgoing).filter(k => (k in incoming)===false);
    // get just incoming pals (ie not mutuals)
    const incomingPals = Object.keys(incoming).filter(k => (k in outgoing)===false);
    this.mutuals = mutuals;
    this.justIncoming = incomingPals;
    this.justOutgoing = outgoingPals;
  }

}
