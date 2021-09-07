import create from 'zustand';
import { UrbitRTCApp } from 'switchboard';
import Icepond from 'icepond';
import Urbit from '@urbit/http-api';

const dap = 'urchatfm';

const useUrchatStore = create((set,get) => {
  const configuration = { iceServers: [] };
  const urbitRtcApp = new UrbitRTCApp(dap, configuration);
  // Set up the event listener for an incoming call
  urbitRtcApp.addEventListener('incomingcall', incomingCallEvt => set((state) => {
    if(state.incomingCall === null) {
      return { incomingCall: incomingCallEvt };
    } else {
      incomingCallEvt.reject();
      return {};
    }
  }));

  const urbit = new Urbit('', '');
  // requires <script> tag for /~landscape/js/session.js
  urbit.ship = window.ship;
  urbitRtcApp.urbit = urbit;

  return {
    urbit: urbit,
    icepond: null,
    configuration: { iceServers: [] },
    urbitRtcApp: urbitRtcApp,
    incomingCall: null,
    ongoingCall: null,
    isCaller: false,
    startIcepond: () => set((state) => {
      const icepond = new Icepond(state.urbit);
      icepond.oniceserver = (evt) => {
        set((state) => {
          const newConfig = { ...state.configuration, iceServers: evt.iceServers };
          if(state.urbitRtcApp !== null) {
            state.urbitRtcApp.configuration = newConfig;
          }
          if(state.incomingCall !== null) {
            state.incomingCall.configuration = newConfig;
          }
          if(state.ongoingCall !== null) {
            state.ongoingCall.conn.setConfiguration(newConfig);
          }
          return { ...state, configuration: newConfig };
        }, true);
      };
      icepond.initialize();
      set({ icepond: icepond });
    }),
    placeCall: (ship, setHandlers) => set((state) => {
      console.log('placeCall');
      const conn = state.urbitRtcApp.call(ship, dap);
      setHandlers(conn);
      conn.addEventListener('hungupcall', state.hungup);
      conn.initialize();
      const call = { peer: ship, dap: dap, uuid: conn.uuid };
      state.startIcepond();
      return {
        isCaller: true,
        ongoingCall: { conn: conn, call: call }
      };
    }),
    answerCall: setHandlers => set((state) => {
      const call = state.incomingCall.call;
      const conn = state.incomingCall.answer();
      conn.addEventListener('hungupcall', state.hungup);
      setHandlers(call.peer, conn);
      conn.initialize();
      state.startIcepond();
      return {
        isCaller: false,
        ongoingCall: { conn: conn, call: call },
        incomingCall: null
      };
    }),

    rejectCall: () => set((state) => {
      state.incomingCall.reject();
      return { incomingCall: null };
    }),

    addTrackToCall: track => set((state) => {
      const sender = state.ongoingCall.conn.addTrack(track);
      track.sender = sender;
    }),

    removeTrackFromCall: track => set((state) => {
      state.ongoingCall.conn.removeTrack(track.sender);
    }),

     setOnTrack: onTrack => set((state) => {
       state.ongoingCall.conn.ontrack = onTrack;
     }),

    hangup: () => set((state) => {
      state.ongoingCall.conn.close();
      return { ongoingCall: null };
    }),

    hungup: () => set(() => ({
      ongoingCall: null
    }))
  };
});

export default useUrchatStore;
