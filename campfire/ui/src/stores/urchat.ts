import {
  UrbitRTCApp,
  UrbitRTCIncomingCallEvent,
  UrbitRTCPeerConnection,
} from "switchboard";
import Icepond from "icepond";
import Urbit from "@urbit/http-api";
import { useMock } from "../util";
import { action, makeObservable } from "mobx";

const dap = "campfire";

const mockCall = { peer: "~nocsyx-lassul", dap: "123", uuid: "123" };
export const mockIncomingCall = {
  ...mockCall,
  call: mockCall,
  urbit: {},
  configuration: {},
  answer: () => {},
  dial: () => {},
  reject: () => {},
};

export type Call = {
  peer: string;
  dap: string;
  uuid: string;
};

export interface OngoingCall {
  conn: UrbitRTCPeerConnection;
  call: Call;
}

interface IUrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: UrbitRTCApp;
  icepond: Icepond;
  configuration: RTCConfiguration;
  incomingCall: UrbitRTCIncomingCallEvent;
  ongoingCall: OngoingCall;
  isCaller: boolean;
  setUrbit: (ur: Urbit) => void;
  startIcepond: () => void;
  placeCall: (
    ship: string,
    setHandlers: (conn: UrbitRTCPeerConnection) => void
  ) => Promise<any>;
  answerCall: (
    setHandlers: (ship: string, conn: UrbitRTCPeerConnection) => void
  ) => Promise<any>;
  rejectCall: () => void;
  hangup: () => void;
  hungup: () => void;
}

export class UrchatStore implements IUrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: UrbitRTCApp;
  icepond: Icepond;
  configuration: RTCConfiguration;
  incomingCall: UrbitRTCIncomingCallEvent;
  ongoingCall: OngoingCall;
  isCaller: boolean;

  constructor() {
    makeObservable(this);
    this.configuration = { iceServers: [] };
    this.urbitRtcApp = new UrbitRTCApp(dap, this.configuration);
    this.urbitRtcApp.addEventListener(
      "incomingcall",
      (incomingCallEvt: UrbitRTCIncomingCallEvent) => {
        console.log("incoming call evenet");
        if (this.incomingCall === null) {
          this.incomingCall = incomingCallEvt;
        } else {
          incomingCallEvt.reject();
        }
      }
    );
    console.log("make constructor");
    this.urbit = useMock
      ? ({ ship: "", subscribe: async () => {} } as any)
      : new Urbit("", "");
    // requires <script> tag for /~landscape/js/session.js
    this.urbit.ship = (window as any).ship;
    this.urbit.verbose = true;
    this.urbitRtcApp.urbit = this.urbit;
    console.log(this.urbit);
    console.log(this.urbit.ship);
    this.urbitRtcApp._urbit = this.urbit;
  }

  @action.bound
  setUrbit(urbit: Urbit) {
    console.log("setting urbit state variable");
    const instance = useMock ? ({} as Urbit) : urbit;
    this.urbitRtcApp.urbit = instance;
    this.urbit = instance;
  }

  @action.bound
  startIcepond() {
    console.log("trying to icepond");
    const icepond = new Icepond(this.urbit);
    // on start
    icepond.oniceserver = (evt) => {
      console.log("just got a server");
      const newConfig = {
        ...this.configuration,
        iceServers: evt.iceServers,
      };
      console.log("icepond config:");
      // console.log(newConfig);
      if (this.urbitRtcApp !== null) {
        this.urbitRtcApp.configuration = newConfig;
      }
      // if (this.incomingCall !== null) {
      //   this.incomingCall.configuration = newConfig;
      // // }
      // if (this.ongoingCall !== null) {
      //   this.ongoingCall.conn.setConfiguration(newConfig);
      // }

      this.configuration = newConfig;
      console.log(this.configuration);
    };
    console.log("about to init");
    icepond.initialize();
    this.icepond = icepond;
  }

  @action.bound
  async placeCall(
    ship: string,
    setHandlers: (conn: UrbitRTCPeerConnection) => void
  ) {
    const { urbitRtcApp, hungup, startIcepond } = this;
    const conn = urbitRtcApp.call(ship, dap);
    setHandlers(conn);
    conn.addEventListener("hungupcall", hungup);
    await conn.initialize();
    const call = { peer: ship, dap: dap, uuid: conn.uuid };
    console.log("setting parts of call");
    console.log(this);
    console.log("starting icepond")
    startIcepond();
    console.log(this);

    const ongoingCall = { conn, call };
    this.isCaller = true
    this.ongoingCall = ongoingCall;
    console.log("made it to an ongoing call");
    console.log(ongoingCall);
    return ongoingCall;
  }

  @action.bound
  async answerCall(
    setHandlers: (ship: string, conn: UrbitRTCPeerConnection) => void
  ) {
    console.log("trying to answer call");
    const { incomingCall, hungup, startIcepond } = this;
    const call = incomingCall.call;
    const conn = incomingCall.answer();
    conn.addEventListener("hungupcall", hungup);
    setHandlers(call.peer, conn);
    await conn.initialize();
    startIcepond();

    const ongoingCall = { conn, call };
    this.isCaller = false;
    this.ongoingCall = ongoingCall;
    this.incomingCall = null;

    return ongoingCall;
  }

  @action.bound
  async reconnectCall(uuid, setHandlers) {
    const urbit = this.urbit;
    const conn = await UrbitRTCPeerConnection.reconnect({ urbit, uuid });
    const call = { uuid, peer: conn.peer, dap: conn.dap };
    const ongoingCall = { call, conn };

    const { hungup, startIcepond } = this;
    conn.addEventListener("hungupcall", hungup);
    setHandlers(call.peer, conn);
    await conn.initialize();
    startIcepond();

    this.ongoingCall = ongoingCall;
    return ongoingCall;
  }
  @action.bound
  rejectCall() {
    this.incomingCall.reject();
    return { incomingCall: null };
  }
  @action.bound
  hangup() {
    if (!useMock && this.ongoingCall) {
      this.ongoingCall.conn.close();
    }
    return { ...this, ongoingCall: null };
  }
  @action.bound
  hungup() {
    this.ongoingCall = null;
  }
}
